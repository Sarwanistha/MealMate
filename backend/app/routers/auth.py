from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import (create_access_token, get_current_user, hash_password, require_seller,
                    verify_password)
from ..database import get_db
from ..models import SellerProfile, User
from ..schemas import LoginIn, ProfileUpdate, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(name=data.name.strip(), email=email, hashed_password=hash_password(data.password),
                phone=data.phone, role=data.role)
    if data.role == "seller":
        missing = [f for f in ("business_name", "address", "area", "city")
                   if not (getattr(data, f) or "").strip()]
        if missing:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                                f"Sellers must provide: {', '.join(missing)}")
        user.seller_profile = SellerProfile(
            business_name=data.business_name.strip(), seller_type=data.seller_type or "restaurant",
            address=data.address.strip(), area=data.area.strip(), city=data.city.strip(), phone=data.phone,
        )
    db.add(user)
    db.commit()
    return _token(user)


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _token(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me/profile", response_model=UserOut)
def update_profile(data: ProfileUpdate, user: User = Depends(require_seller), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is None and field not in ("phone",):
            continue
        setattr(user.seller_profile, field, value)
    db.commit()
    return user
