import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Green pill stepper used in cart rows and the listing detail bar. */
export default function QtyStepper({ qty, onDec, onInc, disableInc, className }) {
  return (
    <div className={cn('flex h-10 items-center rounded-xl bg-success text-success-foreground', className)}>
      <button aria-label="Decrease quantity" className="grid h-10 w-9 place-items-center active:scale-90" onClick={onDec}>
        <Minus className="size-4" />
      </button>
      <span key={qty} className="animate-pop tabular w-6 text-center text-sm font-extrabold">
        {qty}
      </span>
      <button
        aria-label="Increase quantity"
        disabled={disableInc}
        className="grid h-10 w-9 place-items-center active:scale-90 disabled:opacity-40"
        onClick={onInc}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
