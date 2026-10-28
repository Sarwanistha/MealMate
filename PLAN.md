# MealMate v2 – Plan & API contract

Zomato/Swiggy-style marketplace for **surplus food**: sellers (restaurants, bakeries, home cooks) list leftover food at a discount or free; customers/NGOs browse, reserve, and pick up with a code.

Stack: FastAPI + SQLAlchemy (SQLite) + JWT · React + Vite + Tailwind v4 + **shadcn/ui** (JS, Radix) + lucide-react.

## Roles
| Role | Can do |
|---|---|
| `buyer` (customer) | browse, cart (one seller at a time), order, track, cancel, review |
| `ngo` | same as buyer (flag shown on UI; free items) |
| `seller` | profile, create/edit/cancel listings, accept/reject/ready/complete orders, stats |

No admin UI in MVP. No real payments (`pay_at_pickup` or `upi_mock`). No delivery.

## Order state machine
`placed → accepted → ready → completed`; exits: `rejected` (seller, from placed), `cancelled` (buyer, from placed/accepted), `expired` (system: placed > 15 min unanswered), `no_show` (system: accepted/ready after pickup_end).
Stock is decremented atomically when an order is created and restored on rejected/cancelled/expired (once). If seller `auto_accept` is true the order is created directly as `accepted`. Every transition is stored in `order_events`.

## API contract (all under `/api`, JSON, `Authorization: Bearer <jwt>`)
Errors: `{"detail": "message"}` (422 may give a list).

### Auth
- `POST /auth/register` `{name,email,password,role:"buyer"|"seller"|"ngo",phone?, business_name?,seller_type?,address?,area?,city?}` → `{access_token, user}` (seller requires business_name, address, area, city; seller_type in restaurant|bakery|home_cook|caterer|store, default restaurant)
- `POST /auth/login` `{email,password}` → `{access_token, user}`
- `GET /auth/me` → `User`
- `PUT /auth/me/profile` (seller) `{business_name?,seller_type?,address?,area?,city?,phone?,auto_accept?,is_open?}` → `User`

`User` = `{id,name,email,phone,role,seller_profile: SellerProfile|null}`
`SellerProfile` = `{business_name,seller_type,address,area,city,phone,auto_accept,is_open,rating_avg,rating_count}`

### Listings
Enums — category: `meals|bakery|sweets|snacks|fruits_veg|beverages|groceries`; diet: `veg|nonveg|egg|vegan`; status: `active|sold_out|expired|cancelled`.
`Listing` = `{id,title,description,category,diet,original_price,price,is_free,discount_percent,quantity_total,quantity_available,max_per_user,pickup_start,pickup_end,allergens,status,created_at,seller: SellerMini}`
`SellerMini` = `{id (user id),business_name,seller_type,area,city,address,rating_avg,rating_count}`
Prices are integers in rupees. `is_free` = price==0.

- `GET /listings?q&category&diet&free&max_price&area&sort` — public; only `active`, `quantity_available>0`, `pickup_end>now`, seller `is_open`. `sort`: `ending_soon` (default) | `price_low` | `newest` | `discount`.
- `GET /listings/{id}` — public
- `POST /listings` (seller) `{title,description?,category,diet,original_price,price,quantity,max_per_user?(default 2),pickup_start,pickup_end,allergens?}` → Listing. Validate: price ≤ original_price, quantity>0, pickup_end > now and > pickup_start.
- `PUT /listings/{id}` (owner, only if no active orders reference quantity changes? — simple: allowed fields title, description, price, original_price, pickup_end, allergens, max_per_user; quantity can only be raised) → Listing
- `POST /listings/{id}/cancel` (owner) → Listing
- `GET /seller/listings` (seller) — all own listings, any status, newest first
- `GET /sellers/{id}` — public: `{seller: SellerMini+phone, listings:[Listing], reviews:[{rating,comment,buyer_name,created_at}]}`

### Orders
`Order` = `{id,status,total,savings,pickup_code,payment_method,note,created_at,updated_at,pickup_start,pickup_end,seller: SellerMini,buyer:{id,name,phone,role},items:[{listing_id,title,category,diet,qty,unit_price,original_price}],events:[{status,at}],review:{rating,comment}|null}`
`pickup_code` (4 digits) is returned only to the buyer; sellers get `null`.

- `POST /orders` (buyer|ngo) `{items:[{listing_id,qty}],payment_method:"pay_at_pickup"|"upi_mock",note?}` → Order (201). All items same seller; each qty ≤ `max_per_user`; atomic stock decrement (`UPDATE ... WHERE quantity_available >= qty`), 409 if sold out; listing must be active & unexpired.
- `GET /orders?active=true|false` (buyer|ngo) own orders, newest first (active = placed/accepted/ready)
- `GET /orders/{id}` participant only
- `POST /orders/{id}/cancel` (buyer owner; placed|accepted)
- `GET /seller/orders?status=` (seller) own incoming orders, newest first
- `POST /orders/{id}/accept|reject|ready` (seller owner) with state checks
- `POST /orders/{id}/complete` (seller owner, status ready or accepted) `{pickup_code}` — max 5 wrong attempts then 429
- `POST /orders/{id}/review` (buyer owner, completed, once) `{rating:1-5,comment?}` → Order; updates seller rating_avg/count

### Stats
- `GET /seller/stats` (seller) → `{orders_today,pending_orders,revenue_today,meals_rescued,active_listings,rating_avg,rating_count}`
- `GET /impact` (public) → `{meals_saved,kg_co2_saved,money_saved,active_sellers}` (from completed orders; 1 meal = qty 1; 2.5 kg CO₂ per meal)

### Background
asyncio task (FastAPI lifespan) every 60 s: expire listings past `pickup_end`; expire `placed` orders older than 15 min (restore stock); mark `accepted|ready` past pickup_end as `no_show`. Query-time filters also hide expired stuff, so the UI is correct even between runs.

### Seed
`backend/seed.py` creates demo data (idempotent, `python seed.py`): sellers `seller1..4@mealmate.app`, buyer `buyer@mealmate.app`, ngo `ngo@mealmate.app`, all password `demo1234`, ~16 listings across categories with pickup windows relative to "now", some free.

## Frontend
Pages (react-router): `/` Home · `/listing/:id` · `/seller/:id` (storefront) · `/checkout` · `/orders` · `/orders/:id` (tracking, poll 8 s) · `/login` · `/register` · seller area `/seller` (dashboard) · `/seller/listings` · `/seller/listings/new` and `/seller/listings/:id/edit` (live preview card) · `/seller/orders` · `/seller/profile`.
Global: sticky navbar (logo, location chip, search, cart, avatar menu + theme toggle), mobile bottom-nav (role-aware), cart Sheet (one seller at a time, localStorage), sonner toasts, skeletons, emoji empty states, animated impact counters, confetti on order success, dark mode (class on `<html>`, no flash).
Design tokens: tangerine primary `#E8500E`/`oklch(0.63 0.20 40)`, leaf-green accent for FREE/savings, warm neutrals, Plus Jakarta Sans, radius 1rem, category gradient+emoji tiles instead of photos (single `categories.js` map).

## Build steps
1. Backend rewrite (models → schemas → routers → background → seed) and verify with an end-to-end script.
2. Frontend foundation (shadcn init, tokens, layout, api/auth/cart contexts) → pages by area (buyer, then seller).
3. Integrate: run both, seed, test every flow in the browser, polish.
