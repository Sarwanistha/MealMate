import { CATEGORY_LIST } from '@/lib/categories'
import { CATEGORY_PHOTO } from '@/lib/images'
import { cn } from '@/lib/utils'

export default function CategoryRow({ active, onSelect }) {
  return (
    <section aria-label="Categories">
      <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 py-2">
        {CATEGORY_LIST.map((c) => {
          const on = active === c.value
          return (
            <button
              key={c.value}
              onClick={() => onSelect(on ? '' : c.value)}
              aria-pressed={on}
              className="group flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 outline-none"
            >
              <span
                className={cn(
                  'relative grid size-14 place-items-center overflow-hidden rounded-full text-2xl shadow-card ring-offset-2 ring-offset-background transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-ring group-active:scale-90',
                  on && 'ring-2 ring-primary',
                )}
                style={{ backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
              >
                <img src={CATEGORY_PHOTO[c.value]} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              </span>
              <span className={cn('text-center text-xs leading-tight font-semibold', on ? 'text-primary' : 'text-foreground/80')}>
                {c.label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
