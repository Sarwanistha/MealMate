# 🍲 MealMate – Surplus Food Marketplace

Zomato/Swiggy se inspired app jahan restaurants, bakeries aur home cooks apna **bacha hua khana** free ya bahut kam daam pe list karte hain, aur customers / NGOs use **reserve** karke pickup code se le jaate hain. Khana waste nahi hota, sabka fayda.

**Tech stack:** React (Vite) + Tailwind CSS v4 + shadcn/ui · Python + FastAPI · SQLite (SQLAlchemy) · JWT auth

---

## Kaun kya kar sakta hai

| Role | Kya karta hai |
|---|---|
| 🛍️ **Customer** | Food browse/search/filter, cart (ek time pe ek seller), reservation, order tracking, pickup code, review |
| 🤝 **NGO** | Customer jaisa hi, free food ke liye |
| 🏪 **Seller** | Listing banana (live preview ke saath), orders accept/decline, "ready" mark karna, pickup code verify karke complete karna, dashboard stats |

**Order flow:** `placed → accepted → ready → completed` (ya `rejected` / `cancelled` / `expired` / `no_show`).
Stock order banate hi atomic tareeke se kam hota hai (overselling nahi hoti) aur cancel/reject/expire pe wapas aa jata hai.

## Features

- 🔐 Signup / Login (3 roles), JWT
- 🏠 Zomato-style home: hero, category chips, filters (Veg, Free, Under ₹99, sort), "Ending soon", "Free food", "Near you"
- 🛒 Cart drawer, checkout, order tracking (live polling), pickup code ticket, confetti 🎉
- 🧑‍🍳 Seller dashboard: stats, incoming orders (auto-refresh), listings table, new/edit listing form with live preview, shop profile, auto-accept toggle
- 🌱 Impact counter (meals saved, CO₂ saved, ₹ saved)
- 🌙 Dark mode, mobile-first UI with bottom navigation
- ⏱️ Background job: expired listings / unanswered orders / no-shows apne aap handle hote hain

## Folder structure

```
mealmate/
├── PLAN.md                  # plan + poora API contract
├── backend/                 # FastAPI
│   ├── requirements.txt
│   ├── seed.py              # demo data
│   └── app/
│       ├── main.py          # app, CORS, background expiry job
│       ├── database.py, models.py, schemas.py, serializers.py
│       ├── auth.py          # password hashing, JWT, role checks
│       ├── services.py      # stock/expiry logic
│       └── routers/         # auth.py, listings.py, orders.py, order_actions.py
└── frontend/                # React + Vite
    └── src/
        ├── pages/           # Home, ListingDetail, Checkout, Orders, OrderTracking, Login, Register
        │   └── seller/      # Dashboard, Listings, ListingForm, SellerOrders, SellerProfile
        ├── components/      # ListingCard, Navbar, BottomNav, CartSheet, ... + ui/ (shadcn)
        ├── context/         # AuthContext, CartContext
        ├── lib/             # api.js, format.js, categories.js
        └── index.css        # theme (colors, dark mode)
```

---

## Project kaise run karein

Do terminals chahiye (ek backend, ek frontend).

**Zaroori:** Python 3.10+ (`python --version`) aur Node.js 18+ (`node --version`).

### 1) Backend (Terminal 1)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
python seed.py                    # demo data (sellers, listings, orders)
uvicorn app.main:app --reload
```

API: http://127.0.0.1:8000 · Docs (Swagger): http://127.0.0.1:8000/docs

### 2) Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Browser: **http://localhost:5173**

### 3) Demo accounts (password sabka `demo1234`)

| Role | Email |
|---|---|
| Customer | `buyer@mealmate.app` |
| NGO | `ngo@mealmate.app` |
| Seller (restaurant) | `seller1@mealmate.app` |
| Seller (bakery, auto-accept ON) | `seller2@mealmate.app` |
| Seller (home cook) | `seller3@mealmate.app` |
| Seller (store) | `seller4@mealmate.app` |

Login page pe "demo account" buttons bhi hain.

### Try karne ka tareeka

1. Customer se login → koi food **ADD** karo → cart → **Reserve for pickup** → order place.
2. Order page pe seller ke accept karne ka wait karo; accept hone par 4-digit **pickup code** dikhega.
3. Dusre browser/incognito mein `seller1@mealmate.app` se login → **Dashboard** pe order aayega → Accept → Mark ready → **Verify & complete** (customer wala code daalo).
4. Customer ke order page pe 🎉 aur review ka option aa jayega.

---

## API (short)

Poora contract `PLAN.md` mein hai. Live docs: `/docs`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `GET /me`, `PUT /me/profile` |
| Listings | `GET /api/listings` (q, category, diet, free, max_price, sort), `GET /listings/{id}`, `GET /sellers/{id}`; seller: `POST/PUT /listings`, `/cancel`, `GET /seller/listings` |
| Orders | `POST /api/orders`, `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel`, `/review`; seller: `GET /seller/orders`, `POST /orders/{id}/accept│reject│ready│complete` |
| Stats | `GET /api/seller/stats`, `GET /api/impact` |

## Common problems

- **`python` not found** → Python install karo (installer mein "Add to PATH" tick) aur naya terminal kholo.
- **"Can't reach the server"** → backend (Terminal 1) chal raha hai ya nahi dekho.
- **Port 8000 busy** → `uvicorn app.main:app --reload --port 8001` aur `frontend/vite.config.js` ke proxy mein bhi 8001 karo.
- **Database reset** → backend band karo, `backend/mealmate.db*` delete karo, `python seed.py` dobara chalao.
- **Production** → `MEALMATE_SECRET` environment variable mein lamba random secret set karo (JWT ke liye).
