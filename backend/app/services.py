"""Order/stock business logic shared by routers, the expiry job and the seed script."""
import logging
from datetime import timedelta

from sqlalchemy import case, func, select, update
from sqlalchemy.orm import Session

from .database import SessionLocal, utcnow
from .models import Listing, Order, OrderEvent, OrderItem

log = logging.getLogger("mealmate")

ACTIVE_STATUSES = ("placed", "accepted", "ready")
PLACED_TTL_MINUTES = 15
NO_SYNC = {"synchronize_session": False}


def load_order(db: Session, order_id: int) -> Order | None:
    return db.scalar(select(Order).where(Order.id == order_id).execution_options(populate_existing=True))


def restore_stock(db: Session, order_id: int) -> None:
    """Give an order's quantities back to its listings. Call only right after winning a transition."""
    now = utcnow()
    for item in db.scalars(select(OrderItem).where(OrderItem.order_id == order_id)).all():
        db.execute(
            update(Listing).where(Listing.id == item.listing_id)
            .values(quantity_available=func.min(Listing.quantity_total, Listing.quantity_available + item.qty))
            .execution_options(**NO_SYNC)
        )
        db.execute(
            update(Listing)
            .where(Listing.id == item.listing_id, Listing.status == "sold_out",
                   Listing.quantity_available > 0, Listing.pickup_end > now)
            .values(status="active").execution_options(**NO_SYNC)
        )


def transition(db: Session, order_id: int, from_statuses, to: str, restore: bool = False) -> bool:
    """Atomic conditional state change. Returns False if the order was not in an allowed state
    (so concurrent callers can never double-apply a transition or double-restore stock)."""
    now = utcnow()
    res = db.execute(
        update(Order).where(Order.id == order_id, Order.status.in_(tuple(from_statuses)))
        .values(status=to, updated_at=now).execution_options(**NO_SYNC)
    )
    if res.rowcount != 1:
        return False
    db.add(OrderEvent(order_id=order_id, status=to, at=now))
    if restore:
        restore_stock(db, order_id)
    return True


def decrement_stock(db: Session, listing_id: int, qty: int) -> bool:
    now = utcnow()
    res = db.execute(
        update(Listing)
        .where(Listing.id == listing_id, Listing.status == "active",
               Listing.quantity_available >= qty, Listing.pickup_end > now)
        .values(quantity_available=Listing.quantity_available - qty).execution_options(**NO_SYNC)
    )
    if res.rowcount != 1:
        return False
    db.execute(
        update(Listing).where(Listing.id == listing_id, Listing.quantity_available == 0, Listing.status == "active")
        .values(status="sold_out").execution_options(**NO_SYNC)
    )
    return True


def run_expiry(db: Session | None = None) -> dict:
    """Expire stale placed orders (restoring stock), mark no-shows, expire listings past pickup_end."""
    own = db is None
    db = db or SessionLocal()
    try:
        now = utcnow()
        cutoff = now - timedelta(minutes=PLACED_TTL_MINUTES)
        expired_orders = no_shows = 0

        for oid in db.scalars(select(Order.id).where(Order.status == "placed", Order.created_at < cutoff)).all():
            if transition(db, oid, ("placed",), "expired", restore=True):
                expired_orders += 1
        for oid in db.scalars(
            select(Order.id).where(Order.status.in_(("accepted", "ready")), Order.pickup_end < now)
        ).all():
            if transition(db, oid, ("accepted", "ready"), "no_show"):
                no_shows += 1
        res = db.execute(
            update(Listing).where(Listing.status.in_(("active", "sold_out")), Listing.pickup_end < now)
            .values(status="expired").execution_options(**NO_SYNC)
        )
        db.commit()
        return {"expired_orders": expired_orders, "no_shows": no_shows, "expired_listings": res.rowcount}
    except Exception:
        db.rollback()
        raise
    finally:
        if own:
            db.close()
