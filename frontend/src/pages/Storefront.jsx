import { Link, useParams } from 'react-router-dom'
import { MapPin, Phone, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import ListingCard, { ListingCardSkeleton } from '@/components/ListingCard'
import { useFetch } from '@/hooks/useFetch'
import { api } from '@/lib/api'
import { SELLER_TYPES } from '@/lib/categories'
import { initials, timeAgo } from '@/lib/format'

function Stars({ value, className = 'size-4' }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
      ))}
    </span>
  )
}

export default function Storefront() {
  const { id } = useParams()
  const { data, error, loading, reload } = useFetch(() => api.storefront(id), [id])

  if (error?.status === 404)
    return (
      <EmptyState
        emoji="🏚️"
        title="Store not found"
        action={
          <Button asChild className="h-11 rounded-xl font-bold">
            <Link to="/">Back to home</Link>
          </Button>
        }
      />
    )
  if (error) return <ErrorState error={error} onRetry={reload} />

  if (loading || !data)
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )

  const { seller, listings = [], reviews = [] } = data
  const address = [seller.address, seller.area, seller.city].filter(Boolean).join(', ')
  const open = seller.is_open !== false

  return (
    <div className="space-y-8">
      <header className="animate-rise relative isolate overflow-hidden rounded-3xl bg-brand-deep p-5 pt-16 text-white shadow-card sm:p-8 sm:pt-20">
        <div className="dots absolute inset-0 -z-10 opacity-40" />
        <span aria-hidden className="animate-float absolute top-3 right-6 -z-10 text-7xl opacity-30">
          🍽️
        </span>
        <div className="flex items-end gap-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-2xl border-4 border-white/70 bg-card text-2xl font-extrabold text-primary shadow-hover">
            {initials(seller.business_name)}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{seller.business_name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/20 px-2.5 py-1 backdrop-blur">
                {SELLER_TYPES[seller.seller_type] ?? seller.seller_type}
              </span>
              <span className={`rounded-full px-2.5 py-1 ${open ? 'bg-success text-success-foreground' : 'bg-black/40'}`}>
                {open ? 'Open now' : 'Closed'}
              </span>
              {seller.rating_count > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur">
                  <Star className="size-3 fill-current" />
                  {seller.rating_avg.toFixed(1)} ({seller.rating_count})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> {address}
          </span>
          {seller.phone && (
            <a href={`tel:${seller.phone}`} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
              <Phone className="size-4" /> {seller.phone}
            </a>
          )}
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-xl font-extrabold tracking-tight sm:text-2xl">Available now</h2>
        {listings.length === 0 ? (
          <EmptyState emoji="🍽️" title="Nothing on the menu right now" description="This seller has no active surplus. Check back later!" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l, i) => (
              <div key={l.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <ListingCard listing={l} className="h-full" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold tracking-tight sm:text-2xl">Reviews</h2>
        {reviews.length === 0 ? (
          <EmptyState emoji="⭐" title="No reviews yet" description="Be the first to rescue food here and leave a review." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.map((r, i) => (
              <li key={i} className="rounded-2xl border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-xs font-extrabold text-primary">
                      {initials(r.buyer_name)}
                    </span>
                    <span className="text-sm font-bold">{r.buyer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                <div className="mt-2">
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
