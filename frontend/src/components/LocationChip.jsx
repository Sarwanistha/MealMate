import { ChevronDown, MapPin } from 'lucide-react'
import { useUserLocation } from '@/context/LocationContext'
import { cn } from '@/lib/utils'

/** Tappable location pill. Opens the picker; pulses a dot until the customer has chosen an area. */
export default function LocationChip({ className }) {
  const loc = useUserLocation()
  return (
    <button
      onClick={loc.open}
      aria-label={`Location: ${loc.label}. Change location`}
      className={cn(
        'group items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
        loc.chosen ? 'bg-secondary text-foreground/90 hover:bg-secondary/70' : 'bg-primary-soft text-primary hover:bg-primary-soft/70',
        className,
      )}
    >
      <span className="relative flex">
        <MapPin className="size-4" />
        {!loc.chosen && <span className="absolute -top-0.5 -right-0.5 size-2 animate-ping rounded-full bg-primary" />}
      </span>
      <span className="max-w-[10rem] truncate">{loc.label}</span>
      {loc.sublabel && <span className="hidden max-w-[7rem] truncate text-xs font-medium text-muted-foreground xl:inline">{loc.sublabel}</span>}
      <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5" />
    </button>
  )
}
