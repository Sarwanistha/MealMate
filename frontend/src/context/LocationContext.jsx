import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Globe2, MapPin, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useFetch } from '@/hooks/useFetch'
import { api } from '@/lib/api'
import { INDIA } from '@/lib/india'
import { cn } from '@/lib/utils'

const LocationContext = createContext(null)
const KEY = 'mealmate_location'

// eslint-disable-next-line react-refresh/only-export-components
export const useUserLocation = () => useContext(LocationContext)

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    return v && typeof v === 'object' ? { city: v.city || '', area: v.area || '' } : { city: '', area: '' }
  } catch {
    return { city: '', area: '' }
  }
}

const norm = (s) => s.trim().toLowerCase()

function Badge({ count }) {
  if (count === undefined) return null
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
        count > 0 ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      {count > 0 ? `${count} live` : 'none yet'}
    </span>
  )
}

function Row({ selected, onClick, title, hint, count, icon, chevron }) {
  const Icon = icon ?? MapPin
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary',
        selected && 'bg-primary-soft',
      )}
    >
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-secondary', selected && 'bg-primary text-primary-foreground')}>
        {selected ? <Check className="size-4" /> : <Icon className="size-4 text-muted-foreground" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{title}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Badge count={count} />
      {chevron && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </button>
  )
}

function Picker({ open, current, onPick }) {
  const [q, setQ] = useState('')
  const [cityView, setCityView] = useState(null)
  const { data } = useFetch(() => api.locations(), [], { enabled: open })

  // Static India list + live counts. Cities/areas that sellers typed but we don't list are added too.
  const catalog = useMemo(() => {
    const counts = new Map()
    for (const r of data ?? []) counts.set(`${norm(r.city)}|${norm(r.area)}`, r.count)

    const cities = INDIA.map((c) => ({ city: c.city, state: c.state, areas: new Set(c.areas) }))
    for (const r of data ?? []) {
      let c = cities.find((x) => norm(x.city) === norm(r.city))
      if (!c) {
        c = { city: r.city, state: '', areas: new Set() }
        cities.push(c)
      }
      if (![...c.areas].some((a) => norm(a) === norm(r.area))) c.areas.add(r.area)
    }

    const areaCount = (city, area) => (data ? (counts.get(`${norm(city)}|${norm(area)}`) ?? 0) : undefined)
    const full = cities.map((c) => {
      const areas = [...c.areas]
        .map((a) => ({ area: a, count: areaCount(c.city, a) }))
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || a.area.localeCompare(b.area))
      const count = data ? areas.reduce((n, a) => n + (a.count ?? 0), 0) : undefined
      return { city: c.city, state: c.state, areas, count }
    })
    return full.sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || a.city.localeCompare(b.city))
  }, [data])

  const term = norm(q)
  const picked = (city, area = '') => onPick({ city, area })
  const isSel = (city, area = '') => norm(current.city) === norm(city) && norm(current.area) === norm(area)
  const active = cityView ? catalog.find((c) => c.city === cityView) : null

  let body
  if (term) {
    const rows = []
    for (const c of catalog) {
      if (norm(c.city).includes(term) || norm(c.state).includes(term))
        rows.push({ key: c.city, city: c.city, area: '', title: c.city, hint: c.state, count: c.count })
      for (const a of c.areas)
        if (norm(a.area).includes(term))
          rows.push({ key: `${c.city}-${a.area}`, city: c.city, area: a.area, title: a.area, hint: c.city, count: a.count })
    }
    body = rows.length ? (
      rows.slice(0, 40).map((r) => (
        <Row key={r.key} selected={isSel(r.city, r.area)} onClick={() => picked(r.city, r.area)} title={r.title} hint={r.hint} count={r.count} />
      ))
    ) : (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">No city or area matches &ldquo;{q}&rdquo;</p>
    )
  } else if (active) {
    body = (
      <>
        <button
          onClick={() => setCityView(null)}
          className="mb-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold text-primary hover:bg-secondary"
        >
          <ArrowLeft className="size-4" /> All cities
        </button>
        <Row
          selected={isSel(active.city)}
          onClick={() => picked(active.city)}
          title={`All of ${active.city}`}
          hint={active.state}
          count={active.count}
        />
        {active.areas.map((a) => (
          <Row key={a.area} selected={isSel(active.city, a.area)} onClick={() => picked(active.city, a.area)} title={a.area} hint={active.city} count={a.count} />
        ))}
      </>
    )
  } else {
    body = (
      <>
        <Row
          icon={Globe2}
          selected={!current.city && !current.area}
          onClick={() => onPick({ city: '', area: '' })}
          title="Everywhere in India"
          hint="Show food from all cities"
        />
        <p className="px-3 pt-3 pb-1 text-[11px] font-extrabold tracking-widest text-muted-foreground uppercase">Cities</p>
        {catalog.map((c) => (
          <Row
            key={c.city}
            selected={norm(current.city) === norm(c.city) && !current.area}
            onClick={() => setCityView(c.city)}
            title={c.city}
            hint={c.state}
            count={c.count}
            chevron
          />
        ))}
      </>
    )
  }

  return (
    <>
      <div className="relative px-5">
        <Search className="pointer-events-none absolute top-1/2 left-8 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any city or area in India"
          className="h-11 rounded-xl bg-secondary pl-10"
          aria-label="Search city or area"
        />
      </div>
      <div key={cityView ?? (term ? "search" : "cities")} className="mt-3 max-h-[52vh] space-y-1 overflow-y-auto px-3 pb-4">
        {body}
      </div>
    </>
  )
}

/** Remembers the customer's chosen city/area (localStorage) and renders the picker dialog. */
export function LocationProvider({ children }) {
  const [loc, setLoc] = useState(load)
  const [open, setOpen] = useState(false)

  const pick = useCallback((next) => {
    setLoc(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable */
    }
    setOpen(false)
  }, [])

  const value = useMemo(() => {
    const chosen = Boolean(loc.city || loc.area)
    return {
      ...loc,
      chosen,
      label: loc.area || loc.city || 'Select location',
      sublabel: loc.area ? loc.city : '',
      open: () => setOpen(true),
      pick,
    }
  }, [loc, pick])

  return (
    <LocationContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-md">
          <DialogHeader className="p-5 pb-4">
            <DialogTitle className="text-xl font-extrabold tracking-tight">Choose your location</DialogTitle>
            <DialogDescription>Pick any city across India to see the food that is live there.</DialogDescription>
          </DialogHeader>
          {/* keyed on open so the picker starts fresh (no stale search or city) every time */}
          {open && <Picker key="picker" open current={loc} onPick={pick} />}
        </DialogContent>
      </Dialog>
    </LocationContext.Provider>
  )
}
