import { cn } from '@/lib/utils'

export default function EmptyState({ emoji = '🍽️', title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-14 text-center', className)}>
      <div className="animate-float mb-3 text-6xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
