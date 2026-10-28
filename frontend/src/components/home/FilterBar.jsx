import { ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const SORTS = {
  ending_soon: 'Ending soon',
  price_low: 'Price: low to high',
  newest: 'Newest',
  discount: 'Biggest discount',
}

function Pill({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all active:scale-95',
        on ? 'border-primary bg-primary text-primary-foreground shadow-card' : 'bg-card hover:border-primary/50',
      )}
    >
      {children}
    </button>
  )
}

/** Sticky row under the navbar. All state lives in the URL, owned by Home. */
export default function FilterBar({ filters, setFilter }) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b bg-background/85 px-4 py-2.5 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14 backdrop-blur-xl">
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto">
        <Pill on={filters.diet === 'veg'} onClick={() => setFilter('diet', filters.diet === 'veg' ? '' : 'veg')}>
          🟢 Veg only
        </Pill>
        <Pill on={filters.free} onClick={() => setFilter('free', filters.free ? '' : '1')}>
          🆓 Free
        </Pill>
        <Pill on={filters.max_price === '99'} onClick={() => setFilter('max_price', filters.max_price === '99' ? '' : '99')}>
          Under ₹99
        </Pill>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
                filters.sort !== 'ending_soon' ? 'border-primary bg-primary-soft text-primary' : 'bg-card',
              )}
            >
              <ArrowUpDown className="size-3.5" />
              {SORTS[filters.sort]}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={filters.sort} onValueChange={(v) => setFilter('sort', v === 'ending_soon' ? '' : v)}>
              {Object.entries(SORTS).map(([v, label]) => (
                <DropdownMenuRadioItem key={v} value={v}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
