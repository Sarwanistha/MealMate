import { cn } from '@/lib/utils'

/** Pill-style filter tabs with optional count badges. tabs: [{value,label,count?}] */
export default function FilterTabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0', className)}>
      {tabs.map((t) => {
        const on = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95',
              on ? 'border-primary bg-primary text-primary-foreground shadow-card' : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'tabular grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-extrabold',
                  on ? 'bg-white/25' : 'bg-muted',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-12 text-center">
      <div className="mb-2 text-5xl" aria-hidden>
        😵
      </div>
      <h3 className="text-lg font-bold">Couldn&apos;t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 h-11 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground active:scale-95"
        >
          Retry
        </button>
      )}
    </div>
  )
}
