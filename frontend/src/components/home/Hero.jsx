import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FoodTile from '@/components/FoodTile'
import { inr } from '@/lib/format'
import { SHOTS } from '@/lib/images'

const GHOSTS = [
  { e: '🍛', cls: 'top-3 right-5 text-5xl lg:top-auto lg:right-[47%] lg:bottom-28 lg:text-6xl', depth: 14, r: '-10deg', d: '0s' },
  { e: '🥐', cls: 'top-10 right-[46%] text-6xl hidden lg:block', depth: 22, r: '12deg', d: '1s' },
  { e: '🍮', cls: 'bottom-8 left-[40%] text-5xl hidden sm:block lg:left-[30%]', depth: 10, r: '8deg', d: '2s' },
  { e: '🥭', cls: 'bottom-6 right-[6%] text-6xl lg:hidden', depth: 18, r: '-6deg', d: '3s' },
  { e: '🌮', cls: 'bottom-10 left-[4%] text-5xl hidden md:block', depth: 26, r: '14deg', d: '1.5s' },
]

const HEADLINE = [
  { w: 'Rescue' },
  { w: 'delicious' },
  { w: 'food.' },
  { w: 'Pay' },
  { w: 'little.' },
  { w: 'Waste', shine: true },
  { w: 'none.', shine: true },
]

const TRUST = ['🧾 Pay at pickup', '🔢 4-digit pickup code', '🤝 Free food for NGOs']

// Photo collage with live listing cards floating over it (desktop). The cards are real listings.
const PHOTOS = [
  { src: SHOTS.biryani, cls: 'top-0 right-2 h-64 w-56', tilt: '4deg', delay: '0s' },
  { src: SHOTS.croissants, cls: 'top-16 left-4 h-56 w-48', tilt: '-6deg', delay: '1.2s' },
  { src: SHOTS.fruits, cls: 'right-24 bottom-0 h-48 w-52', tilt: '3deg', delay: '2.4s' },
]
const CARD_SPOTS = ['bottom-6 left-0 w-64', 'top-40 right-0 w-64']

function Collage({ listings }) {
  return (
    <div className="relative hidden h-[28rem] lg:block">
      {PHOTOS.map((p, i) => (
        <div key={p.src} className={`animate-rise absolute ${p.cls}`} style={{ animationDelay: `${300 + i * 90}ms` }}>
          <div
            className="animate-float size-full overflow-hidden rounded-3xl border-4 border-white/85 shadow-2xl"
            style={{ '--r': p.tilt, animationDelay: p.delay }}
          >
            <img src={p.src} alt="" className="size-full object-cover" />
          </div>
        </div>
      ))}
      {listings.slice(0, 2).map((l, i) => (
        <div key={l.id} className={`animate-rise absolute z-10 ${CARD_SPOTS[i]}`} style={{ animationDelay: `${650 + i * 90}ms` }}>
          <Link
            to={`/listing/${l.id}`}
            className="animate-float flex items-center gap-3 rounded-2xl border border-white/30 bg-emerald-950/55 p-3 text-white backdrop-blur-xl [box-shadow:0_20px_40px_-12px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.35)] transition-transform duration-200 ease-out hover:scale-[1.03]"
            style={{ '--r': i ? '-3deg' : '3deg', animationDelay: `${i * 1.4}s` }}
          >
            <FoodTile item={l} className="size-14 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{l.title}</p>
              <p className="truncate text-xs text-white/70">{l.seller.business_name}</p>
              <p className="mt-0.5 flex items-center gap-2 text-sm font-extrabold">
                {l.is_free ? (
                  <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] text-emerald-950">FREE</span>
                ) : (
                  <>
                    <span className="tabular">{inr(l.price)}</span>
                    <span className="tabular text-xs font-medium text-white/60 line-through">{inr(l.original_price)}</span>
                  </>
                )}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

export default function Hero({ value, onChange, autoFocus, listings = [] }) {
  const input = useRef(null)
  const section = useRef(null)

  useEffect(() => {
    if (autoFocus) input.current?.focus()
  }, [autoFocus])

  // Mouse parallax for the decorative emoji. Writes transforms straight to the DOM (no React state).
  useEffect(() => {
    const el = section.current
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el || !fine || reduce) return
    const layers = el.querySelectorAll('[data-depth]')
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      layers.forEach((l) => {
        const d = Number(l.dataset.depth)
        l.style.transform = `translate3d(${nx * d * -2}px, ${ny * d * -2}px, 0)`
      })
    }
    const reset = () => layers.forEach((l) => (l.style.transform = ''))
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', reset)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', reset)
    }
  }, [])

  const scrollToFood = (e) => {
    e?.preventDefault()
    document.getElementById('food')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      ref={section}
      className="relative isolate overflow-hidden rounded-3xl bg-brand-deep px-5 pt-9 pb-14 text-white shadow-card sm:px-10 sm:pt-14 sm:pb-20 lg:px-14"
    >
      <div className="dots absolute inset-0 -z-10 opacity-40" />
      {GHOSTS.map((g) => (
        <span
          key={g.e}
          aria-hidden
          data-depth={g.depth}
          className={`pointer-events-none absolute -z-10 transition-transform duration-300 ease-out select-none ${g.cls}`}
        >
          <span className="animate-float block opacity-50" style={{ '--r': g.r, animationDelay: g.d }}>
            {g.e}
          </span>
        </span>
      ))}

      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <span
            className="animate-rise inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/25 backdrop-blur"
            style={{ animationDelay: '0ms' }}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
            </span>
            <MapPin className="size-3.5" /> Surplus food near you, live now
          </span>

          <h1 className="mt-4 text-[2.1rem] leading-[1.05] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl">
            {HEADLINE.map((h, i) => (
              <span
                key={h.w}
                className={`animate-word inline-block pr-[0.25em] ${h.shine ? 'text-shine' : ''}`}
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                {h.w}
              </span>
            ))}
          </h1>

          <p className="animate-rise mx-auto mt-4 max-w-lg text-sm text-white/80 sm:text-base lg:mx-0" style={{ animationDelay: '560ms' }}>
            Local restaurants, bakeries and home cooks sell tonight&apos;s surplus at a steal, or give it away. Reserve in
            seconds. Pay at pickup.
          </p>

          <form
            onSubmit={scrollToFood}
            className="animate-rise relative mx-auto mt-6 flex max-w-xl items-center lg:mx-0"
            style={{ animationDelay: '640ms' }}
          >
            <label htmlFor="hero-search" className="sr-only">
              Search for food or sellers
            </label>
            <Search className="pointer-events-none absolute left-4 size-5 text-muted-foreground" />
            <input
              id="hero-search"
              ref={input}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search food, sellers…"
              className="h-14 w-full rounded-2xl border-0 bg-card pr-36 pl-12 text-base font-medium text-foreground shadow-hover outline-none placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-white/50"
            />
            {value && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onChange('')}
                className="absolute right-[7.75rem] grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted active:scale-90"
              >
                <X className="size-4" />
              </button>
            )}
            <Button type="submit" className="absolute right-2 h-10 rounded-xl px-5 font-bold">
              Find food
            </Button>
          </form>

          <ul className="animate-rise mt-5 flex flex-wrap justify-center gap-2 lg:justify-start" style={{ animationDelay: '720ms' }}>
            {TRUST.map((t) => (
              <li key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <Collage listings={listings} />
      </div>
    </section>
  )
}
