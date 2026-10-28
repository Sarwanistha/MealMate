import { DIETS } from '@/lib/categories'
import { cn } from '@/lib/utils'

/** Indian-style veg / non-veg indicator (square outline + dot). */
export default function VegDot({ diet = 'veg', className }) {
  const meta = DIETS[diet] ?? DIETS.veg
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={cn('inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-2', className)}
      style={{ borderColor: meta.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
    </span>
  )
}
