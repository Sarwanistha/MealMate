"""Idempotent demo data.  Run from the backend dir:  python seed.py

Safe to re-run: users are looked up by email, listings by (seller, title); re-running refreshes the
pickup windows/stock of the demo listings so they are live "now". Demo orders/reviews are only
created once.  Works on a fresh (deleted) database.
"""
import secrets
from datetime import timedelta

from sqlalchemy import func, select, update

from app.auth import hash_password
from app.database import Base, SessionLocal, engine, utcnow
from app.models import (Listing, Order, OrderEvent, OrderItem, Review, SellerProfile, User)
from app.services import decrement_stock

PASSWORD = "demo1234"

SELLERS = [
    dict(email="seller1@mealmate.app", name="Rohan Shetty", phone="+91 98450 11001", business_name="Spice Route Kitchen",
         seller_type="restaurant", address="80 Feet Road, 5th Block", area="Koramangala", auto_accept=False),
    dict(email="seller2@mealmate.app", name="Priya Nair", phone="+91 98450 11002", business_name="The Rolling Pin Bakery",
         seller_type="bakery", address="100 Feet Road, 12th Main", area="Indiranagar", auto_accept=True),
    dict(email="seller3@mealmate.app", name="Lakshmi Iyer", phone="+91 98450 11003", business_name="Amma's Home Kitchen",
         seller_type="home_cook", address="27th Main, Sector 2", area="HSR Layout", auto_accept=False),
    dict(email="seller4@mealmate.app", name="Suresh Gowda", phone="+91 98450 11004", business_name="Jayanagar Fresh & Sweets",
         seller_type="store", address="4th Block, 11th Main", area="Jayanagar", auto_accept=False),
    # --- rest of India ---
    dict(email="seller5@mealmate.app", name="Farhan Qureshi", phone="+91 98200 11005", business_name="Bandra Bites & Bakes",
         seller_type="restaurant", address="Hill Road, Bandra West", area="Bandra West", city="Mumbai", auto_accept=False),
    dict(email="seller6@mealmate.app", name="Gurpreet Singh", phone="+91 98110 11006", business_name="Karol Bagh Rasoi",
         seller_type="restaurant", address="Ajmal Khan Road, Karol Bagh", area="Karol Bagh", city="Delhi", auto_accept=False),
    dict(email="seller7@mealmate.app", name="Imran Baig", phone="+91 98490 11007", business_name="Charminar Dum House",
         seller_type="restaurant", address="Road No. 12, Banjara Hills", area="Banjara Hills", city="Hyderabad", auto_accept=True),
    dict(email="seller8@mealmate.app", name="Meenakshi Raman", phone="+91 98400 11008", business_name="Mylapore Mess",
         seller_type="home_cook", address="Kutchery Road, Mylapore", area="Mylapore", city="Chennai", auto_accept=False),
    dict(email="seller9@mealmate.app", name="Sourav Dutta", phone="+91 98300 11009", business_name="Park Street Patisserie",
         seller_type="bakery", address="Park Street", area="Park Street", city="Kolkata", auto_accept=False),
    dict(email="seller10@mealmate.app", name="Ketaki Joshi", phone="+91 98220 11010", business_name="Koregaon Kitchen",
         seller_type="restaurant", address="Lane 5, Koregaon Park", area="Koregaon Park", city="Pune", auto_accept=False),
    dict(email="seller11@mealmate.app", name="Rajendra Sharma", phone="+91 98290 11011", business_name="Pink City Sweets",
         seller_type="store", address="Ashok Marg, C-Scheme", area="C-Scheme", city="Jaipur", auto_accept=False),
    dict(email="seller12@mealmate.app", name="Hetal Patel", phone="+91 98250 11012", business_name="Manek Thali House",
         seller_type="caterer", address="CG Road, Navrangpura", area="Navrangpura", city="Ahmedabad", auto_accept=False),
]
CITY = "Bengaluru"

# (seller idx, title, description, category, diet, original, price, qty, max/user, start_offset_min, end_offset_min, allergens)
LISTINGS = [
    (0, "Chicken Dum Biryani (serves 1)", "Hyderabadi-style dum biryani with raita and mirchi ka salan. Made fresh at lunch.",
     "meals", "nonveg", 320, 129, 8, 2, -45, 80, "Dairy, nuts"),
    (0, "Paneer Tikka Wrap Combo", "Paneer tikka wrap, masala fries and a small cold drink.",
     "meals", "veg", 249, 99, 6, 2, -30, 110, "Dairy, gluten"),
    (0, "Veg Thali (Dal, 2 sabzi, rice, roti)", "Full North Indian thali, packed hot.",
     "meals", "veg", 220, 0, 5, 1, -20, 95, "Gluten, dairy"),
    (0, "Masala Dosa Pack (2 pcs)", "Crisp masala dosas with sambar and two chutneys.",
     "snacks", "vegan", 160, 69, 10, 3, 20, 260, "None"),
    (1, "Assorted Croissant Box (4 pcs)", "Butter, almond, chocolate and plain croissants baked this morning.",
     "bakery", "veg", 480, 199, 7, 2, -60, 70, "Gluten, dairy, nuts, egg"),
    (1, "Sourdough Loaf", "Slow-fermented country sourdough, still fresh.",
     "bakery", "vegan", 220, 89, 6, 2, -60, 130, "Gluten"),
    (1, "Eggless Chocolate Brownie Box (6)", "Fudgy brownies, end-of-day box.",
     "bakery", "veg", 360, 149, 5, 2, 0, 240, "Gluten, dairy, nuts"),
    (1, "Cold Brew Coffee Bottles (2)", "House cold brew, 250ml each, best before tomorrow.",
     "beverages", "veg", 300, 120, 8, 2, -30, 150, "Dairy"),
    (2, "Homestyle Chicken Curry & Rice", "Amma's pepper chicken curry with steamed rice.",
     "meals", "nonveg", 260, 110, 4, 2, -15, 100, "None"),
    (2, "Curd Rice & Pickle Tub", "Comforting curd rice with mango pickle and papad.",
     "meals", "veg", 140, 0, 6, 2, -15, 75, "Dairy"),
    (2, "Egg Fried Rice Box", "Wok-tossed egg fried rice with veggies.",
     "meals", "egg", 180, 79, 5, 2, 30, 270, "Egg, soy"),
    (2, "Homemade Murukku & Mixture Pack", "Crunchy South Indian snack assortment, 400 g.",
     "snacks", "vegan", 200, 90, 9, 3, -30, 280, "Sesame"),
    (3, "Gulab Jamun Tray (12 pcs)", "Soft khoya gulab jamuns in sugar syrup.",
     "sweets", "veg", 420, 169, 5, 1, -30, 120, "Dairy, gluten, nuts"),
    (3, "Seasonal Fruit Crate (2 kg)", "Mixed bananas, apples and papaya - ripe, perfect for today.",
     "fruits_veg", "vegan", 280, 0, 6, 1, -30, 90, "None"),
    (3, "Fresh Vegetable Bag (3 kg)", "Tomato, onion, beans, carrots and greens - slightly overstocked.",
     "fruits_veg", "vegan", 240, 99, 8, 2, -20, 210, "None"),
    (3, "Atta, Dal & Rice Combo (5 kg)", "Packaged staples near best-before date, perfectly good.",
     "groceries", "vegan", 520, 249, 4, 1, -30, 290, "Gluten"),
    # Mumbai
    (4, "Pav Bhaji Combo (serves 1)", "Buttery pav bhaji with extra pav and a sliced onion salad.",
     "meals", "veg", 240, 99, 8, 2, -30, 100, "Gluten, dairy"),
    (4, "Vada Pav Box (4 pcs)", "Mumbai-style vada pav with dry garlic chutney.",
     "snacks", "veg", 160, 59, 12, 3, -20, 200, "Gluten"),
    (4, "Masala Chai Flask (500 ml)", "Strong masala chai in a thermos flask.",
     "beverages", "veg", 120, 0, 6, 1, 0, 150, "Dairy"),
    # Delhi
    (5, "Chole Bhature Plate", "Two fluffy bhature with spicy chole, pickled onions and chutney.",
     "meals", "veg", 200, 79, 8, 2, -30, 110, "Gluten, dairy"),
    (5, "Butter Chicken & Naan Combo", "Creamy butter chicken with two butter naans.",
     "meals", "nonveg", 380, 149, 5, 2, -15, 120, "Dairy, gluten, nuts"),
    (5, "Hot Jalebi Box (500 g)", "Crisp, syrupy jalebis fried this evening.",
     "sweets", "veg", 250, 0, 6, 1, 0, 140, "Gluten"),
    # Hyderabad
    (6, "Hyderabadi Mutton Biryani", "Slow-cooked dum biryani with boiled egg and mirchi ka salan.",
     "meals", "nonveg", 420, 179, 6, 2, -30, 90, "Dairy, nuts"),
    (6, "Double Ka Meetha Tray", "Rich bread pudding with saffron and dry fruits.",
     "sweets", "veg", 300, 120, 5, 1, -10, 180, "Dairy, gluten, nuts"),
    (6, "Osmania Biscuit Tin (500 g)", "Classic Irani cafe biscuits, packed fresh.",
     "bakery", "veg", 260, 99, 8, 2, -20, 230, "Gluten, dairy"),
    # Chennai
    (7, "Idli Sambar Pack (6 pcs)", "Soft idlis with sambar, coconut and tomato chutney.",
     "snacks", "vegan", 140, 59, 10, 3, -20, 160, "None"),
    (7, "Meen Kuzhambu & Rice", "Tangy tamarind fish curry with steamed rice.",
     "meals", "nonveg", 280, 119, 4, 2, -15, 100, "Fish, tamarind"),
    (7, "Filter Coffee Decoction (500 ml)", "Strong South Indian decoction, dilute with hot milk.",
     "beverages", "veg", 180, 0, 5, 1, 0, 200, "None"),
    # Kolkata
    (8, "Chicken Kathi Roll (2 pcs)", "Paratha rolls with egg, onions and green chutney.",
     "snacks", "nonveg", 220, 89, 8, 2, -20, 130, "Egg, gluten"),
    (8, "Rosogolla Box (8 pcs)", "Spongy rosogollas in light syrup.",
     "sweets", "veg", 320, 129, 6, 1, -10, 180, "Dairy"),
    (8, "Mishti Doi Cups (4)", "Sweet set curd in earthen cups.",
     "sweets", "veg", 280, 0, 5, 1, 0, 170, "Dairy"),
    # Pune
    (9, "Misal Pav Combo", "Spicy sprouted-moth misal with farsan, two pav and buttermilk.",
     "meals", "veg", 190, 79, 8, 2, -30, 110, "Gluten, dairy"),
    (9, "Sabudana Khichdi Box", "Peanutty sabudana khichdi, served warm.",
     "meals", "vegan", 150, 0, 6, 2, -15, 120, "Peanuts"),
    # Jaipur
    (10, "Dal Baati Churma Thali", "Baked baati with ghee, panchmel dal, churma and garlic chutney.",
     "meals", "veg", 320, 139, 6, 2, -25, 130, "Gluten, dairy, nuts"),
    (10, "Ghewar Box (4 pcs)", "Honeycomb ghewar topped with rabri.",
     "sweets", "veg", 400, 169, 5, 1, -10, 200, "Dairy, gluten, nuts"),
    (10, "Mawa Kachori (6 pcs)", "Flaky kachoris stuffed with sweet mawa.",
     "snacks", "veg", 300, 119, 7, 2, -10, 190, "Dairy, gluten, nuts"),
    # Ahmedabad
    (11, "Gujarati Thali (serves 1)", "Dal, kadhi, two sabzi, rotli, rice, farsan and a sweet.",
     "meals", "veg", 280, 109, 8, 2, -30, 120, "Gluten, dairy"),
    (11, "Dhokla & Fafda Box", "Soft khaman dhokla and crunchy fafda with kadhi chutney.",
     "snacks", "veg", 180, 69, 10, 3, -20, 210, "Gluten, besan"),
    (11, "Assorted Khakhra Packs (4)", "Roasted khakhras, near best-before but perfectly good.",
     "groceries", "vegan", 240, 99, 6, 2, -30, 260, "Gluten"),
]

# Past listings (yesterday) used for demo order history
HISTORY = [
    (0, "Butter Chicken & Naan Combo", "meals", "nonveg", 340, 140, "Dairy, gluten"),
    (1, "Mixed Pastry Box", "bakery", "veg", 420, 170, "Gluten, dairy, egg"),
    (2, "Rajma Chawal Bowl", "meals", "veg", 180, 70, "None"),
    (3, "Rasmalai Box (6 pcs)", "sweets", "veg", 360, 150, "Dairy, nuts"),
    (4, "Bombay Sandwich Platter", "snacks", "veg", 200, 80, "Gluten, dairy"),
    (5, "Rajma Chawal Combo", "meals", "veg", 190, 75, "Dairy"),
    (6, "Chicken 65 Biryani Box", "meals", "nonveg", 380, 160, "Dairy"),
    (7, "Sambar Rice Bowl", "meals", "vegan", 130, 55, "None"),
    (8, "Pastry Box (6)", "bakery", "veg", 400, 160, "Gluten, dairy, egg"),
    (9, "Pav Bhaji Box", "meals", "veg", 200, 80, "Gluten, dairy"),
    (10, "Kachori Sabzi Plate", "snacks", "veg", 180, 70, "Gluten"),
    (11, "Thepla & Chunda Pack", "snacks", "veg", 160, 60, "Gluten"),
]

BUYERS = [
    dict(email="buyer@mealmate.app", name="Aarav Mehta", phone="+91 99000 22001", role="buyer"),
    dict(email="ngo@mealmate.app", name="Annadaan Foundation", phone="+91 99000 22002", role="ngo"),
]
EXTRA_REVIEWERS = [("Neha Kapoor", "neha.k@example.com"), ("Vikram Rao", "vikram.r@example.com")]


def get_or_create_user(db, **fields):
    user = db.scalar(select(User).where(User.email == fields["email"]))
    if user:
        return user
    user = User(hashed_password=hash_password(PASSWORD), **fields)
    db.add(user)
    db.flush()
    return user


def make_order(db, buyer, seller, listing, qty, status, created_at, review=None, pay="pay_at_pickup"):
    """Insert an order (and events/review) directly, without touching stock."""
    total = listing.price * qty
    savings = (listing.original_price - listing.price) * qty
    order = Order(
        buyer_id=buyer.id, seller_id=seller.id, status=status, total=total, savings=savings,
        pickup_code=f"{secrets.randbelow(10000):04d}", payment_method=pay,
        pickup_start=listing.pickup_start, pickup_end=listing.pickup_end,
        created_at=created_at, updated_at=created_at + timedelta(minutes=25),
    )
    db.add(order)
    db.flush()
    db.add(OrderItem(order_id=order.id, listing_id=listing.id, title=listing.title, category=listing.category,
                     diet=listing.diet, qty=qty, unit_price=listing.price, original_price=listing.original_price))
    flow = ["placed", "accepted", "ready", "completed"] if status == "completed" else ["placed", status]
    for i, st in enumerate(flow):
        db.add(OrderEvent(order_id=order.id, status=st, at=created_at + timedelta(minutes=i * 8)))
    if review:
        rating, comment = review
        db.add(Review(order_id=order.id, seller_id=seller.id, buyer_id=buyer.id, rating=rating,
                      comment=comment, created_at=created_at + timedelta(hours=2)))
    return order


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    now = utcnow()
    try:
        sellers = []
        for s in SELLERS:
            s = dict(s)
            profile = {k: s.pop(k) for k in ("business_name", "seller_type", "address", "area", "auto_accept")}
            city = s.pop("city", CITY)
            user = get_or_create_user(db, role="seller", **s)
            if user.seller_profile is None:
                user.seller_profile = SellerProfile(city=city, phone=s["phone"], **profile)
            sellers.append(user)
        buyer, ngo = [get_or_create_user(db, **b) for b in BUYERS]
        reviewers = [buyer, ngo] + [get_or_create_user(db, name=n, email=e, role="buyer", phone=None)
                                   for n, e in EXTRA_REVIEWERS]

        # live listings: create or refresh windows
        live = {}
        for sidx, title, desc, cat, diet, orig, price, qty, mpu, so, eo, allergens in LISTINGS:
            seller = sellers[sidx]
            l = db.scalar(select(Listing).where(Listing.seller_id == seller.id, Listing.title == title))
            if l is None:
                l = Listing(seller_id=seller.id, title=title, created_at=now - timedelta(minutes=abs(so) + 5))
                db.add(l)
            l.description, l.category, l.diet = desc, cat, diet
            l.original_price, l.price, l.max_per_user, l.allergens = orig, price, mpu, allergens
            l.quantity_total = l.quantity_available = qty
            l.pickup_start, l.pickup_end, l.status = now + timedelta(minutes=so), now + timedelta(minutes=eo), "active"
            live[title] = l
        db.flush()

        # order history: once per seller, so new demo sellers get ratings on an existing database too
        already = db.scalar(select(func.count(Order.id)))
        needs = {i for i, s in enumerate(sellers)
                 if not db.scalar(select(func.count(Order.id)).where(Order.seller_id == s.id))}
        if needs:
            hist = []
            for sidx, title, cat, diet, orig, price, allergens in HISTORY:
                if sidx not in needs:
                    continue
                seller = sellers[sidx]
                l = Listing(seller_id=seller.id, title=title, description="Rescued last evening.", category=cat,
                            diet=diet, original_price=orig, price=price, quantity_total=10, quantity_available=0,
                            max_per_user=2, pickup_start=now - timedelta(days=1, hours=3),
                            pickup_end=now - timedelta(days=1, hours=1), allergens=allergens,
                            status="expired", created_at=now - timedelta(days=1, hours=5))
                db.add(l)
                hist.append((seller, l))
            db.flush()
            comments = [
                (5, "Fantastic value and still piping hot. Will order again!"),
                (4, "Great food, pickup was quick."),
                (5, "Generous portions, lovely packaging."),
                (4, "Tasty and a real bargain."),
                (3, "Good, though I waited a few minutes at pickup."),
                (5, "Saved a meal and loved it."),
                (5, None),
            ]
            n = 0
            for rounds in range(2):
                for i, (seller, l) in enumerate(hist):
                    c = comments[n % len(comments)]
                    make_order(db, reviewers[(n + i) % len(reviewers)], seller, l, 1 + (n % 2), "completed",
                               now - timedelta(days=1, hours=2, minutes=10 * n), review=c)
                    n += 1
            if not already:
                # a couple of non-completed past orders so history looks real
                make_order(db, buyer, sellers[0], hist[0][1], 1, "cancelled", now - timedelta(days=2))
                make_order(db, ngo, sellers[3], hist[3][1], 1, "rejected", now - timedelta(days=2, hours=3))
                # completed today (revenue_today / orders_today non-zero)
                today_l = live["Curd Rice & Pickle Tub"]
                o = make_order(db, buyer, sellers[2], today_l, 1, "completed", now - timedelta(minutes=50))
                o.updated_at = now - timedelta(minutes=20)

            # recompute ratings
            for s in sellers:
                avg, cnt = db.execute(select(func.avg(Review.rating), func.count(Review.id))
                                      .where(Review.seller_id == s.id)).one()
                s.seller_profile.rating_count = cnt
                s.seller_profile.rating_avg = round(float(avg), 2) if cnt else 0.0

            # live orders using real stock decrement: one pending, one accepted-in-progress
            def live_order(who, title, qty, status):
                l = live[title]
                assert decrement_stock(db, l.id, qty)
                o = make_order(db, who, l.seller, l, qty, status, now - timedelta(minutes=3))
                o.updated_at = now
                o.pickup_start, o.pickup_end = l.pickup_start, l.pickup_end

            if not already:
                live_order(buyer, "Chicken Dum Biryani (serves 1)", 1, "placed")
                live_order(ngo, "Assorted Croissant Box (4 pcs)", 2, "accepted")

        db.commit()
        n_l = db.scalar(select(func.count(Listing.id)).where(Listing.status == "active"))
        print(f"Seeded. {len(sellers)} sellers, 2 customers, {n_l} active listings, "
              f"{db.scalar(select(func.count(Order.id)))} orders. All passwords: {PASSWORD}")
        print("Logins: seller1..12@mealmate.app, buyer@mealmate.app, ngo@mealmate.app")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
