from .database import utcnow
from .models import Listing, Order, User
from .schemas import BuyerMini, ListingOut, OrderOut, SellerMini, SellerPublic


def seller_mini(u: User) -> SellerMini:
    p = u.seller_profile
    return SellerMini(
        id=u.id, business_name=p.business_name, seller_type=p.seller_type, area=p.area,
        city=p.city, address=p.address, rating_avg=p.rating_avg, rating_count=p.rating_count,
    )


def seller_public(u: User) -> SellerPublic:
    return SellerPublic(
        **seller_mini(u).model_dump(), phone=u.seller_profile.phone or u.phone, is_open=u.seller_profile.is_open
    )


def listing_out(l: Listing) -> ListingOut:
    status = l.status
    if status in ("active", "sold_out") and l.pickup_end <= utcnow():
        status = "expired"
    discount = round((l.original_price - l.price) * 100 / l.original_price) if l.original_price else 0
    return ListingOut(
        id=l.id, title=l.title, description=l.description, category=l.category, diet=l.diet,
        original_price=l.original_price, price=l.price, is_free=l.price == 0, discount_percent=discount,
        quantity_total=l.quantity_total, quantity_available=l.quantity_available,
        max_per_user=l.max_per_user, pickup_start=l.pickup_start, pickup_end=l.pickup_end,
        allergens=l.allergens, status=status, created_at=l.created_at, seller=seller_mini(l.seller),
    )


def order_out(o: Order, viewer: User) -> OrderOut:
    return OrderOut(
        id=o.id, status=o.status, total=o.total, savings=o.savings,
        pickup_code=o.pickup_code if viewer.id == o.buyer_id else None,
        payment_method=o.payment_method, note=o.note, created_at=o.created_at,
        updated_at=o.updated_at, pickup_start=o.pickup_start, pickup_end=o.pickup_end,
        seller=seller_public(o.seller),
        buyer=BuyerMini(id=o.buyer.id, name=o.buyer.name, phone=o.buyer.phone, role=o.buyer.role),
        items=o.items, events=o.events, review=o.review,
    )
