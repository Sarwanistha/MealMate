import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, Navigation, ShieldCheck, Star, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import FoodTile from '@/components/FoodTile'
import QtyStepper from '@/components/QtyStepper'
import VegDot from '@/components/VegDot'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useFetch } from '@/hooks/useFetch'
import { useNow } from '@/hooks/useNow'
import { api } from '@/lib/api'
import { categoryMeta } from '@/lib/categories'
import { formatDay, inr, pickupWindow, timeLeft } from '@/lib/format'
import { cn } from '@/lib/utils'

const asList = (a) => (Array.isArray(a) ? a : typeof a === 'string' ? a.split(',') : []).map((s) => s.trim()).filter(Boolean)

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="aspect-[16/9] animate-pulse rounded-3xl bg-muted" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-16 animate-pulse rounded-2xl bg-muted" />
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cart = useCart()
  const { isSeller } = useAuth()
  const now = useNow(1000)
  const { data: listing, error, loading, reload } = useFetch(() => api.listing(id), [id])
  const [pick, setPick] = useState(1)

  if (loading && !listing) return <DetailSkeleton />
  if (error?.status === 404)
    return (
      <EmptyState
        emoji="🕳️"
        title="This listing is gone"
        description="It may have been removed or already collected."
        action={
          <Button asChild className="h-11 rounded-xl font-bold">
            <Link to="/">Browse food</Link>
          </Button>
        }
      />
    )
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!listing) return null

  const { seller } = listing
  const left = timeLeft(listing.pickup_end, now)
  const ended = left.expired || listing.status === 'expired' || listing.status === 'cancelled'
  const soldOut = !ended && (listing.quantity_available <= 0 || listing.status === 'sold_out')
  const unavailable = ended || soldOut
  const max = Math.max(1, Math.min(listing.max_per_user ?? 1, listing.quantity_available))
  const inCart = cart.qtyOf(listing.id)
  const qty = Math.min(pick, max)
  const saved = listing.original_price - listing.price
  const allergens = asList(listing.allergens)
  const address = [seller.address, seller.area, seller.city].filter(Boolean).join(', ')
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  const addToCart = () => {
    if (cart.add(listing, qty) === 'conflict') return
    toast.success(`Added ${qty} to cart`)
    cart.openCart()
  }

  return (
    <div className="mx-auto max-w-3xl pb-20 md:pb-0">
      <FoodTile item={listing} className="animate-rise aspect-[16/9] rounded-3xl shadow-card" emojiClassName="text-8xl sm:text-9xl">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="Go back"
          className="absolute top-3 left-3 z-10 grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur active:scale-90"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="absolute top-3 right-3 z-10 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {categoryMeta(listing.category).label}
        </span>
      </FoodTile>

      <div className="mt-5 space-y-5">
        <div className="animate-rise flex items-start gap-2.5" style={{ animationDelay: '60ms' }}>
          <VegDot diet={listing.diet} className="mt-2" />
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{listing.title}</h1>
        </div>

        <Link
          to={`/seller/${seller.id}/store`}
          className="animate-rise flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover"
          style={{ animationDelay: '100ms' }}
        >
          <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-xl" aria-hidden>
            🏪
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{seller.business_name}</span>
            <span className="block text-xs text-muted-foreground">
              {seller.area}, {seller.city}
            </span>
          </span>
          {seller.rating_count > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
              <Star className="size-3 fill-current" />
              {seller.rating_avg.toFixed(1)}
              <span className="font-medium text-muted-foreground">({seller.rating_count})</span>
            </span>
          )}
        </Link>

        <div className="animate-rise rounded-2xl border bg-card p-4 shadow-card" style={{ animationDelay: '140ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {listing.is_free ? (
                <span className="text-3xl font-extrabold text-success">FREE</span>
              ) : (
                <>
                  <span className="tabular text-3xl font-extrabold tracking-tight">{inr(listing.price)}</span>
                  <span className="tabular text-base text-muted-foreground line-through">{inr(listing.original_price)}</span>
                </>
              )}
              {saved > 0 && (
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
                  {listing.is_free ? `Worth ${inr(listing.original_price)}` : `Save ${inr(saved)} · ${listing.discount_percent}% off`}
                </span>
              )}
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold',
                ended ? 'bg-muted text-muted-foreground' : left.urgent ? 'bg-destructive/10 text-destructive' : 'bg-primary-soft text-primary',
              )}
            >
              {left.urgent && !ended && <span className="size-1.5 animate-pulse rounded-full bg-destructive" />}
              <Clock className="size-3.5" />
              {left.text}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Pickup window</dt>
              <dd className="font-bold">
                {formatDay(listing.pickup_start)}, {pickupWindow(listing.pickup_start, listing.pickup_end)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Availability</dt>
              <dd className={cn('font-bold', listing.quantity_available <= 3 && !unavailable && 'text-destructive')}>
                {unavailable ? 'None left' : `${listing.quantity_available} left`}
              </dd>
            </div>
          </dl>
        </div>

        <div className="animate-rise flex items-start gap-3 rounded-2xl border bg-card p-4" style={{ animationDelay: '180ms' }}>
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">Pickup address</p>
            <p className="font-semibold">{address}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl font-bold active:scale-95">
            <a href={maps} target="_blank" rel="noreferrer">
              <Navigation className="size-4" /> Directions
            </a>
          </Button>
        </div>

        {listing.description && (
          <section className="animate-rise" style={{ animationDelay: '220ms' }}>
            <h2 className="mb-1 font-bold">About this item</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
          </section>
        )}

        {allergens.length > 0 && (
          <section>
            <h2 className="mb-2 font-bold">Allergens</h2>
            <div className="flex flex-wrap gap-2">
              {allergens.map((a) => (
                <span key={a} className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning-foreground dark:text-warning">
                  ⚠️ {a}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" /> Max {listing.max_per_user} per person
        </div>
        <div className="flex gap-3 rounded-2xl bg-success-soft p-4 text-sm text-muted-foreground">
          <ShieldCheck className="size-5 shrink-0 text-success" />
          <p>
            Surplus food is prepared fresh and offered close to its best-before time. Please check the food on pickup
            and consume it the same day.
          </p>
        </div>
      </div>

      {/* Buy bar: fixed above the bottom nav on mobile */}
      {!isSeller && (
        <div className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 p-3 backdrop-blur-xl md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            {unavailable ? (
              <Button disabled className="h-12 w-full rounded-xl text-base font-bold">
                {ended ? 'Pickup window ended' : 'Sold out'}
              </Button>
            ) : (
              <>
                <QtyStepper
                  qty={qty}
                  onDec={() => setPick(Math.max(1, qty - 1))}
                  onInc={() => setPick(Math.min(max, qty + 1))}
                  disableInc={qty >= max}
                  className="h-12 shrink-0 [&>button]:h-12"
                />
                <Button onClick={addToCart} className="h-12 flex-1 rounded-xl text-base font-bold active:scale-95">
                  Add to cart · {listing.is_free ? 'Free' : inr(listing.price * qty)}
                </Button>
              </>
            )}
          </div>
          {inCart > 0 && !unavailable && (
            <p className="mt-1.5 text-center text-xs text-muted-foreground">{inCart} already in your cart</p>
          )}
        </div>
      )}
    </div>
  )
}
