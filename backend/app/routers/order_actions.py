import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import require_customer, require_seller
from ..database import get_db, utcnow
from ..models import Listing, Order, OrderItem, Review, SellerProfile, User
from ..schemas import CompleteIn, OrderOut, ReviewIn
from ..serializers import order_out
from ..services import NO_SYNC, load_order, transition

router = APIRouter(prefix="/api", tags=["orders"])

MAX_CODE_ATTEMPTS = 5
IST = timezone(timedelta(hours=5, minutes=30))
CO2_KG_PER_MEAL = 2.5


def _conflict(order: Order, action: str) -> HTTPException:
    return HTTPException(409, f"Cannot {action} an order that is {order.status}")


def _seller_order(db: Session, order_id: int, user: User) -> Order:
    order = load_order(db, order_id)
    if order is None:
        raise HTTPException(404, "Order not found")
    if order.seller_id != user.id:
        raise HTTPException(403, "Not your order")
    return order


def _seller_step(order_id: int, user: User, db: Session, from_status, to: str, action: str, restore=False):
    _seller_order(db, order_id, user)
    if not transition(db, order_id, from_status, to, restore=restore):
        db.rollback()
        raise _conflict(load_order(db, order_id), action)
    db.commit()
    return order_out(load_order(db, order_id), user)


@router.post("/orders/{order_id}/accept", response_model=OrderOut)
def accept(order_id: int, user: User = Depends(require_seller), db: Session = Depends(get_db)):
    return _seller_step(order_id, user, db, ("placed",), "accepted", "accept")


@router.post("/orders/{order_id}/reject", response_model=OrderOut)
def reject(order_id: int, user: User = Depends(require_seller), db: Session = Depends(get_db)):
    return _seller_step(order_id, user, db, ("placed",), "rejected", "reject", restore=True)


@router.post("/orders/{order_id}/ready", response_model=OrderOut)
def ready(order_id: int, user: User = Depends(require_seller), db: Session = Depends(get_db)):
    return _seller_step(order_id, user, db, ("accepted",), "ready", "mark ready")


@router.post("/orders/{order_id}/complete", response_model=OrderOut)
def complete(order_id: int, data: CompleteIn, user: User = Depends(require_seller), db: Session = Depends(get_db)):
    order = _seller_order(db, order_id, user)
    if order.status not in ("accepted", "ready"):
        raise _conflict(order, "complete")
    if order.code_attempts >= MAX_CODE_ATTEMPTS:
        raise HTTPException(429, "Too many wrong codes. This order is locked.")
    if not secrets.compare_digest(data.pickup_code.strip().encode(), order.pickup_code.encode()):
        res = db.execute(
            update(Order).where(Order.id == order_id, Order.code_attempts < MAX_CODE_ATTEMPTS,
                                Order.status.in_(("accepted", "ready")))
            .values(code_attempts=Order.code_attempts + 1).execution_options(**NO_SYNC)
        )
        db.commit()
        if res.rowcount != 1:
            raise HTTPException(429, "Too many wrong codes. This order is locked.")
        left = MAX_CODE_ATTEMPTS - load_order(db, order_id).code_attempts
        raise HTTPException(400, f"Wrong pickup code ({left} attempt{'s' if left != 1 else ''} left)")
    return _seller_step(order_id, user, db, ("accepted", "ready"), "completed", "complete")


@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel(order_id: int, user: User = Depends(require_customer), db: Session = Depends(get_db)):
    order = load_order(db, order_id)
    if order is None:
        raise HTTPException(404, "Order not found")
    if order.buyer_id != user.id:
        raise HTTPException(403, "Not your order")
    if not transition(db, order_id, ("placed", "accepted"), "cancelled", restore=True):
        db.rollback()
        raise _conflict(load_order(db, order_id), "cancel")
    db.commit()
    return order_out(load_order(db, order_id), user)


@router.post("/orders/{order_id}/review", response_model=OrderOut)
def review(order_id: int, data: ReviewIn, user: User = Depends(require_customer), db: Session = Depends(get_db)):
    order = load_order(db, order_id)
    if order is None:
        raise HTTPException(404, "Order not found")
    if order.buyer_id != user.id:
        raise HTTPException(403, "Not your order")
    if order.status != "completed":
        raise HTTPException(409, "Only completed orders can be reviewed")
    if order.review is not None:
        raise HTTPException(409, "Order already reviewed")
    try:
        db.add(Review(order_id=order_id, seller_id=order.seller_id, buyer_id=user.id,
                      rating=data.rating, comment=(data.comment or "").strip() or None))
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Order already reviewed")
    avg = select(func.round(func.avg(Review.rating), 2)).where(Review.seller_id == order.seller_id).scalar_subquery()
    cnt = select(func.count(Review.id)).where(Review.seller_id == order.seller_id).scalar_subquery()
    db.execute(update(SellerProfile).where(SellerProfile.user_id == order.seller_id)
               .values(rating_avg=avg, rating_count=cnt).execution_options(**NO_SYNC))
    db.commit()
    return order_out(load_order(db, order_id), user)


# ---------------------------------------------------------------- stats
def _today_start_utc() -> datetime:
    now_ist = utcnow().astimezone(IST)
    return now_ist.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)


@router.get("/seller/stats")
def seller_stats(user: User = Depends(require_seller), db: Session = Depends(get_db)):
    today = _today_start_utc()
    bad = ("rejected", "cancelled", "expired")
    orders_today = db.scalar(select(func.count(Order.id)).where(
        Order.seller_id == user.id, Order.created_at >= today, Order.status.not_in(bad)))
    pending = db.scalar(select(func.count(Order.id)).where(Order.seller_id == user.id, Order.status == "placed"))
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total), 0)).where(
        Order.seller_id == user.id, Order.status == "completed", Order.updated_at >= today))
    rescued = db.scalar(
        select(func.coalesce(func.sum(OrderItem.qty), 0)).join(Order, Order.id == OrderItem.order_id)
        .where(Order.seller_id == user.id, Order.status == "completed"))
    active_listings = db.scalar(select(func.count(Listing.id)).where(
        Listing.seller_id == user.id, Listing.status == "active", Listing.quantity_available > 0,
        Listing.pickup_end > utcnow()))
    p = user.seller_profile
    return {"orders_today": orders_today, "pending_orders": pending, "revenue_today": revenue,
            "meals_rescued": rescued, "active_listings": active_listings,
            "rating_avg": p.rating_avg, "rating_count": p.rating_count}


@router.get("/impact")
def impact(db: Session = Depends(get_db)):
    meals, saved = db.execute(
        select(func.coalesce(func.sum(OrderItem.qty), 0),
               func.coalesce(func.sum((OrderItem.original_price - OrderItem.unit_price) * OrderItem.qty), 0))
        .join(Order, Order.id == OrderItem.order_id).where(Order.status == "completed")
    ).one()
    sellers = db.scalar(select(func.count(SellerProfile.user_id)).where(SellerProfile.is_open.is_(True)))
    return {"meals_saved": meals, "kg_co2_saved": round(meals * CO2_KG_PER_MEAL, 1),
            "money_saved": saved, "active_sellers": sellers}
