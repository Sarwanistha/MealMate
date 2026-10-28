import { ORDER_STATUS } from '@/lib/categories'
import { cn } from '@/lib/utils'

export default function StatusBadge({ status, className }) {
  const s = ORDER_STATUS[status] ?? { label: status, emoji: '•', cls: 'bg-muted text-muted-foreground' }
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', s.cls, className)}
    >
      <span aria-hidden>{s.emoji}</span>
      {s.label}
    </span>
  )
}
