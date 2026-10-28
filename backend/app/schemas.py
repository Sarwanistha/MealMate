from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, PlainSerializer

from .database import to_utc


def _iso_z(value: datetime) -> str:
    return to_utc(value).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


# Input: naive => UTC. Output: ISO-8601 with 'Z'.
UTCDateTime = Annotated[datetime, AfterValidator(to_utc), PlainSerializer(_iso_z, return_type=str, when_used="json")]

Role = Literal["buyer", "seller", "ngo"]
SellerType = Literal["restaurant", "bakery", "home_cook", "caterer", "store"]
Category = Literal["meals", "bakery", "sweets", "snacks", "fruits_veg", "beverages", "groceries"]
Diet = Literal["veg", "nonveg", "egg", "vegan"]
PaymentMethod = Literal["pay_at_pickup", "upi_mock"]


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth / users ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: Role
    phone: str | None = Field(default=None, max_length=30)
    business_name: str | None = Field(default=None, max_length=160)
    seller_type: SellerType | None = None
    address: str | None = Field(default=None, max_length=300)
    area: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=200)


class ProfileUpdate(BaseModel):
    business_name: str | None = Field(default=None, min_length=1, max_length=160)
    seller_type: SellerType | None = None
    address: str | None = Field(default=None, min_length=1, max_length=300)
    area: str | None = Field(default=None, min_length=1, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    auto_accept: bool | None = None
    is_open: bool | None = None


class SellerProfileOut(Out):
    business_name: str
    seller_type: str
    address: str
    area: str
    city: str
    phone: str | None
    auto_accept: bool
    is_open: bool
    rating_avg: float
    rating_count: int


class UserOut(Out):
    id: int
    name: str
    email: str
    phone: str | None
    role: str
    seller_profile: SellerProfileOut | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- listings ----------
class SellerMini(BaseModel):
    id: int
    business_name: str
    seller_type: str
    area: str
    city: str
    address: str
    rating_avg: float
    rating_count: int


class SellerPublic(SellerMini):
    phone: str | None = None
    is_open: bool = True


class ListingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    category: Category
    diet: Diet
    original_price: int = Field(ge=1, le=100000)
    price: int = Field(ge=0, le=100000)
    quantity: int = Field(ge=1, le=10000)
    max_per_user: int = Field(default=2, ge=1, le=100)
    pickup_start: UTCDateTime
    pickup_end: UTCDateTime
    allergens: str | None = Field(default=None, max_length=200)


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    price: int | None = Field(default=None, ge=0, le=100000)
    original_price: int | None = Field(default=None, ge=1, le=100000)
    pickup_end: UTCDateTime | None = None
    allergens: str | None = Field(default=None, max_length=200)
    max_per_user: int | None = Field(default=None, ge=1, le=100)
    quantity: int | None = Field(default=None, ge=1, le=10000)  # total; may only be raised


class ListingOut(BaseModel):
    id: int
    title: str
    description: str | None
    category: str
    diet: str
    original_price: int
    price: int
    is_free: bool
    discount_percent: int
    quantity_total: int
    quantity_available: int
    max_per_user: int
    pickup_start: UTCDateTime
    pickup_end: UTCDateTime
    allergens: str | None
    status: str
    created_at: UTCDateTime
    seller: SellerMini


class ReviewPublic(BaseModel):
    rating: int
    comment: str | None
    buyer_name: str
    created_at: UTCDateTime


class StorefrontOut(BaseModel):
    seller: SellerPublic
    listings: list[ListingOut]
    reviews: list[ReviewPublic]


# ---------- orders ----------
class OrderItemIn(BaseModel):
    listing_id: int
    qty: int = Field(ge=1, le=100)


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1, max_length=30)
    payment_method: PaymentMethod
    note: str | None = Field(default=None, max_length=500)


class CompleteIn(BaseModel):
    pickup_code: str = Field(min_length=1, max_length=10)


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class BuyerMini(BaseModel):
    id: int
    name: str
    phone: str | None
    role: str


class OrderItemOut(Out):
    listing_id: int
    title: str
    category: str
    diet: str
    qty: int
    unit_price: int
    original_price: int


class OrderEventOut(Out):
    status: str
    at: UTCDateTime


class OrderReviewOut(Out):
    rating: int
    comment: str | None


class OrderOut(BaseModel):
    id: int
    status: str
    total: int
    savings: int
    pickup_code: str | None
    payment_method: str
    note: str | None
    created_at: UTCDateTime
    updated_at: UTCDateTime
    pickup_start: UTCDateTime
    pickup_end: UTCDateTime
    seller: SellerPublic
    buyer: BuyerMini
    items: list[OrderItemOut]
    events: list[OrderEventOut]
    review: OrderReviewOut | None
