from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from ..auth import require_seller
from ..database import get_db, utcnow
from ..models import Listing, Review, SellerProfile, User
from ..schemas import (Category, Diet, ListingCreate, ListingOut, ListingUpdate, ReviewPublic,
                       StorefrontOut)
from ..serializers import listing_out, seller_public
from ..services import NO_SYNC

router = APIRouter(prefix="/api", tags=["listings"])

SortKey = str


def _reload(db: Session, listing_id: int) -> Listing:
    return db.scalar(select(Listing).where(Listing.id == listing_id).execution_options(populate_existing=True))


def _public_filter():
    return (
        Listing.status == "active",
        Listing.quantity_available > 0,
        Listing.pickup_end > utcnow(),
    )


@router.get("/listings", response_model=list[ListingOut])
def browse(
    q: str | None = None,
    category: Category | None = None,
    diet: Diet | None = None,
    free: bool | None = None,
    max_price: int | None = Query(default=None, ge=0),
    area: str | None = None,
    city: str | None = None,
    sort: str = Query(default="ending_soon", pattern="^(ending_soon|price_low|newest|discount)$"),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Listing)
        .join(SellerProfile, SellerProfile.user_id == Listing.seller_id)
        .where(*_public_filter(), SellerProfile.is_open.is_(True))
    )
    if q and q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(Listing.title).like(like),
                              func.lower(func.coalesce(Listing.description, "")).like(like),
                              func.lower(SellerProfile.business_name).like(like)))
    if category:
        stmt = stmt.where(Listing.category == category)
    if diet:
        stmt = stmt.where(Listing.diet == diet)
    if free:
        stmt = stmt.where(Listing.price == 0)
    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)
    if area and area.strip():
        stmt = stmt.where(func.lower(SellerProfile.area) == area.strip().lower())
    if city and city.strip():
        stmt = stmt.where(func.lower(SellerProfile.city) == city.strip().lower())
    order = {
        "ending_soon": (Listing.pickup_end.asc(), Listing.id.asc()),
        "price_low": (Listing.price.asc(), Listing.pickup_end.asc()),
        "newest": (Listing.created_at.desc(), Listing.id.desc()),
        "discount": (((Listing.original_price - Listing.price) * 1.0 / Listing.original_price).desc(),
                     Listing.pickup_end.asc()),
    }[sort]
    return [listing_out(l) for l in db.scalars(stmt.order_by(*order)).unique().all()]


@router.get("/locations")
def locations(db: Session = Depends(get_db)):
    """Areas with at least one open seller, plus how many listings are live there right now."""
    live = (
        select(Listing.seller_id, func.count().label("n")).where(*_public_filter()).group_by(Listing.seller_id).subquery()
    )
    rows = db.execute(
        select(SellerProfile.city, SellerProfile.area, func.coalesce(func.sum(live.c.n), 0))
        .outerjoin(live, live.c.seller_id == SellerProfile.user_id)
        .where(SellerProfile.is_open.is_(True))
        .group_by(SellerProfile.city, SellerProfile.area)
        .order_by(SellerProfile.city, SellerProfile.area)
    ).all()
    return [{"city": c, "area": a, "count": int(n)} for c, a, n in rows]


@router.get("/listings/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(404, "Listing not found")
    return listing_out(listing)


@router.post("/listings", response_model=ListingOut, status_code=status.HTTP_201_CREATED)
def create_listing(data: ListingCreate, user: User = Depends(require_seller), db: Session = Depends(get_db)):
    if data.price > data.original_price:
        raise HTTPException(422, "price cannot exceed original_price")
    if data.pickup_end <= data.pickup_start:
        raise HTTPException(422, "pickup_end must be after pickup_start")
    if data.pickup_end <= utcnow():
        raise HTTPException(422, "pickup_end must be in the future")
    listing = Listing(
        seller_id=user.id, title=data.title.strip(), description=data.description, category=data.category,
        diet=data.diet, original_price=data.original_price, price=data.price,
        quantity_total=data.quantity, quantity_available=data.quantity, max_per_user=data.max_per_user,
        pickup_start=data.pickup_start, pickup_end=data.pickup_end, allergens=data.allergens,
    )
    db.add(listing)
    db.commit()
    return listing_out(listing)


def _own_listing(db: Session, listing_id: int, user: User) -> Listing:
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(404, "Listing not found")
    if listing.seller_id != user.id:
        raise HTTPException(403, "Not your listing")
    return listing


@router.put("/listings/{listing_id}", response_model=ListingOut)
def update_listing(listing_id: int, data: ListingUpdate, user: User = Depends(require_seller),
                   db: Session = Depends(get_db)):
    listing = _own_listing(db, listing_id, user)
    if listing.status in ("cancelled", "expired") or listing.pickup_end <= utcnow():
        raise HTTPException(409, f"Cannot edit a {listing.status if listing.status != 'active' else 'expired'} listing")
    changes = data.model_dump(exclude_unset=True)
    for k in ("title", "price", "original_price", "pickup_end", "max_per_user"):
        if k in changes and changes[k] is None:
            raise HTTPException(422, f"{k} cannot be null")
    price = changes.get("price", listing.price)
    original = changes.get("original_price", listing.original_price)
    if price > original:
        raise HTTPException(422, "price cannot exceed original_price")
    pickup_end = changes.get("pickup_end", listing.pickup_end)
    if "pickup_end" in changes and (pickup_end <= utcnow() or pickup_end <= listing.pickup_start):
        raise HTTPException(422, "pickup_end must be in the future and after pickup_start")

    values = {k: changes[k] for k in ("title", "description", "price", "original_price", "pickup_end",
                                      "allergens", "max_per_user") if k in changes}
    if "title" in values:
        values["title"] = values["title"].strip()
    if changes.get("quantity") is not None:
        delta = changes["quantity"] - listing.quantity_total
        if delta < 0:
            raise HTTPException(422, "Quantity can only be raised")
        # atomic relative increment so concurrent orders are not clobbered
        values["quantity_total"] = Listing.quantity_total + delta
        values["quantity_available"] = Listing.quantity_available + delta
    if values:
        db.execute(update(Listing).where(Listing.id == listing_id).values(**values).execution_options(**NO_SYNC))
        db.execute(
            update(Listing).where(Listing.id == listing_id, Listing.status == "sold_out",
                                  Listing.quantity_available > 0, Listing.pickup_end > utcnow())
            .values(status="active").execution_options(**NO_SYNC)
        )
        db.commit()
    return listing_out(_reload(db, listing_id))


@router.post("/listings/{listing_id}/cancel", response_model=ListingOut)
def cancel_listing(listing_id: int, user: User = Depends(require_seller), db: Session = Depends(get_db)):
    listing = _own_listing(db, listing_id, user)
    res = db.execute(
        update(Listing).where(Listing.id == listing_id, Listing.status.in_(("active", "sold_out")))
        .values(status="cancelled").execution_options(**NO_SYNC)
    )
    if res.rowcount != 1:
        raise HTTPException(409, f"Listing is already {listing.status}")
    db.commit()
    return listing_out(_reload(db, listing_id))


@router.get("/seller/listings", response_model=list[ListingOut])
def my_listings(user: User = Depends(require_seller), db: Session = Depends(get_db)):
    rows = db.scalars(select(Listing).where(Listing.seller_id == user.id)
                      .order_by(Listing.created_at.desc(), Listing.id.desc())).unique().all()
    return [listing_out(l) for l in rows]


@router.get("/sellers/{seller_id}", response_model=StorefrontOut)
def storefront(seller_id: int, db: Session = Depends(get_db)):
    seller = db.get(User, seller_id)
    if seller is None or seller.role != "seller" or seller.seller_profile is None:
        raise HTTPException(404, "Seller not found")
    listings = db.scalars(select(Listing).where(Listing.seller_id == seller_id, *_public_filter())
                          .order_by(Listing.pickup_end.asc())).unique().all()
    reviews = db.scalars(select(Review).where(Review.seller_id == seller_id)
                         .order_by(Review.created_at.desc()).limit(50)).unique().all()
    return StorefrontOut(
        seller=seller_public(seller),
        listings=[listing_out(l) for l in listings],
        reviews=[ReviewPublic(rating=r.rating, comment=r.comment, buyer_name=r.buyer.name,
                              created_at=r.created_at) for r in reviews],
    )
