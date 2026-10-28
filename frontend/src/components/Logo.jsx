import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Logo({ to = '/', className, light = false }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2 text-xl font-extrabold tracking-tight', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-lg shadow-card ring-1 ring-white/20">🍲</span>
      <span className={light ? 'text-white' : ''}>
        Meal<span className={light ? 'text-white/80' : 'text-primary'}>Mate</span>
      </span>
    </Link>
  )
}
