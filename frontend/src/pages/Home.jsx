import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import ListingCard, { ListingCardSkeleton } from '@/components/ListingCard'
import Hero from '@/components/home/Hero'
import ImpactStrip from '@/components/home/ImpactStrip'
import CategoryRow from '@/components/home/CategoryRow'
import FilterBar from '@/components/home/FilterBar'
import { Benefits, Faq, FinalCta, Footer, HowItWorks, Marquee, Problem } from '@/components/home/HomeExtras'
import LocationChip from '@/components/LocationChip'
import { useUserLocation } from '@/context/LocationContext'
import { useDebounced, useFetch } from '@/hooks/useFetch'
import { api } from '@/lib/api'
import { categoryMeta } from '@/lib/categories'

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'

function Grid({ items, startDelay = 0 }) {
  return (
    <div className={GRID}>
      {items.map((l, i) => (
        <div key={l.id} className="animate-rise" style={{ animationDelay: `${startDelay + Math.min(i, 8) * 50}ms` }}>
          <ListingCard listing={l} className="h-full" />
        </div>
      ))}
    </div>
  )
}

function SkeletonGrid({ n = 8 }) {
  return (
    <div className={GRID}>
      {Array.from({ length: n }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

function Section({ title, subtitle, children, className = '' }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function Home() {
  const [params, setParams] = useSearchParams()
  const userLoc = useUserLocation()
  const { city, area } = userLoc
  const filters = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    diet: params.get('diet') ?? '',
    free: params.get('free') === '1',
    max_price: params.get('max_price') ?? '',
    sort: params.get('sort') || 'ending_soon',
  }
  const filtered = Boolean(
    filters.q || filters.category || filters.diet || filters.free || filters.max_price || filters.sort !== 'ending_soon',
  )

  const setFilter = useCallback(
    (key, value) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          next.delete('focus')
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  // search box: local state for snappy typing, debounced into the URL
  const [text, setText] = useState(filters.q)
  const debounced = useDebounced(text, 400)
  useEffect(() => {
    if (debounced !== filters.q) setFilter('q', debounced.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])
  // keep the box in sync when q changes from elsewhere (navbar search, clear filters)
  useEffect(() => {
    setText((t) => (t.trim() === filters.q ? t : filters.q))
  }, [filters.q])

  const { data, error, loading, reload } = useFetch(
    () =>
      api.listings({
        q: filters.q,
        category: filters.category,
        diet: filters.diet,
        free: filters.free ? true : undefined,
        max_price: filters.max_price,
        sort: filters.sort,
        city,
        area,
      }),
    [filters.q, filters.category, filters.diet, filters.free, filters.max_price, filters.sort, city, area],
  )

  const listings = useMemo(() => data ?? [], [data])
  const endingSoon = useMemo(() => listings.slice(0, 8), [listings])
  const freeFood = useMemo(() => listings.filter((l) => l.is_free), [listings])

  const clearAll = () => {
    setText('')
    setParams({}, { replace: true })
  }

  let body
  if (loading && !data) body = <SkeletonGrid />
  else if (error) body = <ErrorState error={error} onRetry={reload} title="Couldn't load food" />
  else if (listings.length === 0)
    body = (
      <EmptyState
        emoji={filtered ? '🔍' : '🍽️'}
        title={
          filtered
            ? 'Nothing matches those filters'
            : userLoc.chosen
              ? `No food in ${area || city} right now`
              : 'No food available right now'
        }
        description={
          filtered
            ? 'Try removing a filter or searching for something else.'
            : userLoc.chosen
              ? 'Sellers there have nothing live at the moment. Try another area, or look at all of India.'
              : 'Sellers list new surplus throughout the day. Check back soon!'
        }
        action={
          filtered ? (
            <Button onClick={clearAll} className="h-11 rounded-xl font-bold active:scale-95">
              Clear filters
            </Button>
          ) : (
            userLoc.chosen && (
              <Button onClick={userLoc.open} className="h-11 rounded-xl font-bold active:scale-95">
                Change location
              </Button>
            )
          )
        }
      />
    )
  else if (filtered)
    body = (
      <Section
        title={filters.category ? `${categoryMeta(filters.category).emoji} ${categoryMeta(filters.category).label}` : 'Results'}
        subtitle={`${listings.length} ${listings.length === 1 ? 'item' : 'items'} found`}
      >
        <Grid items={listings} />
      </Section>
    )
  else
    body = (
      <div className="space-y-10">
        <Section title="⏰ Ending soon" subtitle="Grab these before they're gone">
          <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            {endingSoon.map((l) => (
              <div key={l.id} className="w-[270px] shrink-0 snap-start sm:w-[300px]">
                <ListingCard listing={l} className="h-full" />
              </div>
            ))}
          </div>
        </Section>

        {freeFood.length > 0 && (
          <section className="-mx-4 bg-gradient-to-br from-success-soft via-success-soft/70 to-card px-4 py-8 sm:mx-0 sm:rounded-3xl sm:border sm:border-success/15 sm:px-6">
            <h2 className="text-xl font-extrabold tracking-tight text-success sm:text-2xl">🆓 Free food</h2>
            <p className="mb-3 text-sm text-muted-foreground">Zero rupees, zero waste. Perfect for NGOs too.</p>
            <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {freeFood.map((l) => (
                <div key={l.id} className="w-[270px] shrink-0 snap-start sm:w-[300px]">
                  <ListingCard listing={l} className="h-full" />
                </div>
              ))}
            </div>
          </section>
        )}

        <Section title={area ? `📍 In ${area}` : city ? `📍 In ${city}` : '📍 Near you'} subtitle={`${listings.length} items available`}>
          <Grid items={listings} />
        </Section>
      </div>
    )

  return (
    <div className="space-y-6">
      <LocationChip className="flex md:hidden" />
      <Hero value={text} onChange={setText} autoFocus={params.get('focus') === 'search'} listings={listings} />
      <ImpactStrip />
      <CategoryRow active={filters.category} onSelect={(v) => setFilter('category', v)} />
      <div>
        <FilterBar filters={filters} setFilter={setFilter} />
        {filtered && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {filters.q && (
                <>
                  Results for <b className="text-foreground">&ldquo;{filters.q}&rdquo;</b>
                </>
              )}
            </p>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold active:scale-95"
            >
              <X className="size-3.5" /> Clear filters
            </button>
          </div>
        )}
        <div id="food" className="mt-5 scroll-mt-20">
          {body}
        </div>
      </div>
      {!filtered && (
        <>
          <Marquee />
          <Problem />
          <Benefits />
          <HowItWorks />
          <Faq />
          <FinalCta />
        </>
      )}
      <Footer />
    </div>
  )
}
