import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_customer, require_seller
from ..database import get_db, utcnow
from ..models import Listing, Order, OrderEvent, OrderItem, Review, SellerProfile, User
from ..schemas import CompleteIn, OrderCreate, OrderOut, ReviewIn
from ..serializers import order_out
from ..services import ACTIVE_STATUSES, NO_SYNC, decrement_stock, load_order, transition

router = APIRouter(prefix="/api", tags=["orders"])

MAX_CODE_ATTEMPTS = 5
IST = timezone(timedelta(hours=5, minutes=30))
CO2_KG_PER_MEAL = 2.5


# ---------------------------------------------------------------- create
@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(data: OrderCreate, user: User = Depends(require_customer), db: Session = Depends(get_db)):
    wanted: dict[int, int] = {}
    for it in data.items:
        wanted[it.listing_id] = wanted.get(it.listing_id, 0) + it.qty

    listings: dict[int, Listing] = {}
    for lid in wanted:
        l = db.get(Listing, lid)
        if l is None:
            raise HTTPException(404, f"Listing {lid} not found")
        listings[lid] = l
    seller_ids = {l.seller_id for l in listings.values()}
    if len(seller_ids) != 1:
        raise HTTPException(400, "All items in an order must be from the same seller")
    seller = next(iter(listings.values())).seller
    if not seller.seller_profile.is_open:
        raise HTTPException(409, f"{seller.seller_profile.business_name} is currently closed")

    now = utcnow()
    for lid, qty in wanted.items():
        l = listings[lid]
        if l.status != "active" or l.pickup_end <= now:
            raise HTTPException(409, f'"{l.title}" is no longer available')
        already = db.scalar(
            select(func.coalesce(func.sum(OrderItem.qty), 0))
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.buyer_id == user.id, OrderItem.listing_id == lid, Order.status.in_(ACTIVE_STATUSES))
        )
        if qty + already > l.max_per_user:
            raise HTTPException(400, f'You can order at most {l.max_per_user} of "{l.title}"')

    try:
        for lid, qty in wanted.items():
            if not decrement_stock(db, lid, qty):
                db.rollback()
                raise HTTPException(409, f'Sorry, "{listings[lid].title}" just sold out or has less than {qty} left')

        total = sum(listings[lid].price * q for lid, q in wanted.items())
        savings = sum((listings[lid].original_price - listings[lid].price) * q for lid, q in wanted.items())
        start = max(l.pickup_start for l in listings.values())
        end = min(l.pickup_end for l in listings.values())
        if start >= end:
            start, end = min(l.pickup_start for l in listings.values()), max(l.pickup_end for l in listings.values())
        auto = seller.seller_profile.auto_accept
        order = Order(
            buyer_id=user.id, seller_id=seller.id, status="accepted" if auto else "placed",
            total=total, savings=savings, pickup_code=f"{secrets.randbelow(10000):04d}",
            payment_method=data.payment_method, note=data.note, pickup_start=start, pickup_end=end,
            created_at=now, updated_at=now,
        )
        db.add(order)
        db.flush()
        for lid, qty in wanted.items():
            l = listings[lid]
            db.add(OrderItem(order_id=order.id, listing_id=lid, title=l.title, category=l.category,
                             diet=l.diet, qty=qty, unit_price=l.price, original_price=l.original_price))
        db.add(OrderEvent(order_id=order.id, status="placed", at=now))
        if auto:
            db.add(OrderEvent(order_id=order.id, status="accepted", at=now))
        db.commit()
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise
    return order_out(load_order(db, order.id), user)


# ---------------------------------------------------------------- read
def _participant_order(db: Session, order_id: int, user: User) -> Order:
    order = load_order(db, order_id)
    if order is None:
        raise HTTPException(404, "Order not found")
    if user.id not in (order.buyer_id, order.seller_id):
        raise HTTPException(403, "Not your order")
    return order


@router.get("/orders", response_model=list[OrderOut])
def my_orders(active: bool | None = None, user: User = Depends(require_customer), db: Session = Depends(get_db)):
    stmt = select(Order).where(Order.buyer_id == user.id)
    if active is True:
        stmt = stmt.where(Order.status.in_(ACTIVE_STATUSES))
    elif active is False:
        stmt = stmt.where(Order.status.not_in(ACTIVE_STATUSES))
    rows = db.scalars(stmt.order_by(Order.created_at.desc(), Order.id.desc())).unique().all()
    return [order_out(o, user) for o in rows]


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return order_out(_participant_order(db, order_id, user), user)


@router.get("/seller/orders", response_model=list[OrderOut])
def seller_orders(status_: str | None = Query(default=None, alias="status"),
                  user: User = Depends(require_seller), db: Session = Depends(get_db)):
    stmt = select(Order).where(Order.seller_id == user.id)
    if status_:
        stmt = stmt.where(Order.status == status_)
    rows = db.scalars(stmt.order_by(Order.created_at.desc(), Order.id.desc())).unique().all()
    return [order_out(o, user) for o in rows]
