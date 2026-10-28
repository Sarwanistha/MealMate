import { Link } from 'react-router-dom'
import { Clock, Minus, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FoodTile from '@/components/FoodTile'
import VegDot from '@/components/VegDot'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useNow } from '@/hooks/useNow'
import { inr, pickupWindow, timeLeft } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * The core marketplace card (Zomato/Swiggy style).
 * Props: listing (API Listing), preview (render without cart / links, used in the seller form),
 *        className.
 */
export default function ListingCard({ listing, preview = false, className }) {
  const cart = useCart()
  const { isSeller } = useAuth()
  const now = useNow(30000)

  const left = timeLeft(listing.pickup_end, now)
  const qty = preview ? 0 : cart.qtyOf(listing.id)
  const lowStock = listing.quantity_available <= 3
  const saved = listing.original_price - listing.price
  const showAdd = !preview && !isSeller
  const soldOut = listing.quantity_available <= 0 || listing.status !== 'active'

  const Wrapper = preview ? 'div' : Link
  const wrapperProps = preview ? {} : { to: `/listing/${listing.id}` }

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out)] hover:-translate-y-1 hover:shadow-hover',
        className,
      )}
    >
      <Wrapper {...wrapperProps} className="block">
        <FoodTile item={listing} className="aspect-[16/10]">
          {/* discount / free ribbon */}
          <div className="absolute top-3 left-3 z-10">
            {listing.is_free ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1 text-xs font-extrabold tracking-wide text-white shadow-lg">
                ✨ FREE
              </span>
            ) : listing.discount_percent > 0 ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold tracking-wide text-primary shadow-lg">
                {listing.discount_percent}% OFF
              </span>
            ) : null}
          </div>
          {/* urgency chip */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {left.urgent && <span className="size-1.5 animate-pulse rounded-full bg-red-400" />}
              <Clock className="size-3" />
              {left.text}
            </span>
          </div>
          {/* stock chip */}
          <div className="absolute right-3 bottom-3 z-10">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur',
                lowStock ? 'bg-warning text-warning-foreground' : 'bg-black/55 text-white',
              )}
            >
              {soldOut ? 'Sold out' : `${listing.quantity_available} left`}
            </span>
          </div>
        </FoodTile>
      </Wrapper>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Wrapper {...wrapperProps} className="block">
          <div className="flex items-start gap-2">
            <VegDot diet={listing.diet} className="mt-1" />
            <h3 className="line-clamp-2 text-base leading-snug font-bold">{listing.title}</h3>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">{listing.seller.business_name}</span>
            <span>•</span>
            <span>{listing.seller.area}</span>
            {listing.seller.rating_count > 0 && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 font-semibold text-foreground/80">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {listing.seller.rating_avg.toFixed(1)}
                </span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Pickup {pickupWindow(listing.pickup_start, listing.pickup_end)}</p>
        </Wrapper>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            {listing.is_free ? (
              <span className="text-xl font-extrabold tracking-tight text-success">Free</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="tabular text-xl font-extrabold tracking-tight">{inr(listing.price)}</span>
                <span className="tabular text-sm text-muted-foreground line-through">{inr(listing.original_price)}</span>
              </div>
            )}
            {saved > 0 && !listing.is_free && (
              <span className="mt-1 w-fit rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">
                Save {inr(saved)}
              </span>
            )}
          </div>

          {showAdd &&
            (qty === 0 ? (
              <Button
                variant="outline"
                disabled={soldOut}
                onClick={() => cart.add(listing)}
                className="h-10 rounded-xl border-success px-6 font-extrabold tracking-wide text-success hover:bg-success hover:text-success-foreground active:scale-95"
              >
                ADD
              </Button>
            ) : (
              <div className="flex h-10 items-center rounded-xl bg-success text-success-foreground">
                <button
                  aria-label="Decrease quantity"
                  className="grid h-10 w-9 place-items-center active:scale-90"
                  onClick={() => cart.setQty(listing.id, qty - 1)}
                >
                  <Minus className="size-4" />
                </button>
                <span key={qty} className="animate-pop tabular w-6 text-center text-sm font-extrabold">
                  {qty}
                </span>
                <button
                  aria-label="Increase quantity"
                  className="grid h-10 w-9 place-items-center active:scale-90"
                  onClick={() => cart.add(listing)}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </article>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex justify-between pt-3">
          <div className="h-6 w-20 animate-pulse rounded bg-muted" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
