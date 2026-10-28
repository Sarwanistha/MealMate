import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/StatusBadge'
import { useCart } from '@/context/CartContext'
import { api } from '@/lib/api'
import { ACTIVE_STATUSES, categoryMeta } from '@/lib/categories'
import { inr, timeAgo } from '@/lib/format'

export default function OrderCard({ order }) {
  const cart = useCart()
  const [busy, setBusy] = useState(false)
  const active = ACTIVE_STATUSES.includes(order.status)
  const summary = order.items.map((i) => `${i.qty} × ${i.title}`).join(', ')
  const { emoji, from, to } = categoryMeta(order.items[0]?.category)

  const reorder = async () => {
    if (cart.seller && cart.seller.id !== order.seller.id) {
      toast.error(`Your cart has items from ${cart.seller.business_name}. Clear it first to reorder.`)
      return
    }
    setBusy(true)
    const results = await Promise.allSettled(order.items.map((i) => api.listing(i.listing_id)))
    let added = 0
    results.forEach((r, idx) => {
      const l = r.status === 'fulfilled' ? r.value : null
      if (l && l.status === 'active' && l.quantity_available > 0) {
        cart.add(l, order.items[idx].qty)
        added++
      }
    })
    setBusy(false)
    if (added) cart.openCart()
    else toast.error('Those items are no longer available.')
  }

  return (
    <article className="flex gap-3 rounded-2xl border bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover sm:p-4">
      <span
        aria-hidden
        className="grid size-14 shrink-0 place-items-center rounded-xl text-2xl shadow-card sm:size-16 sm:text-3xl"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/orders/${order.id}`} className="min-w-0">
            <h3 className="truncate font-bold">{order.seller.business_name}</h3>
          </Link>
          <StatusBadge status={order.status} className="shrink-0" />
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{summary}</p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(order.created_at)}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className={`tabular text-base font-extrabold ${order.total === 0 ? 'text-success' : ''}`}>
            {order.total === 0 ? 'Free' : inr(order.total)}
          </span>
          <div className="flex gap-2">
            {!active && (
              <Button variant="outline" size="sm" onClick={reorder} disabled={busy} className="rounded-xl font-bold active:scale-95">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />} Reorder
              </Button>
            )}
            <Button asChild size="sm" className="rounded-xl font-bold active:scale-95">
              <Link to={`/orders/${order.id}`}>{active ? 'Track' : 'Details'}</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
