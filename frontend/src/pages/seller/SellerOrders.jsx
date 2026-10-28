import { useMemo, useState } from 'react'
import EmptyState from '@/components/EmptyState'
import OrderActionCard from '@/components/seller/OrderActionCard'
import OrderCardSkeleton from '@/components/seller/OrderCardSkeleton'
import FilterTabs, { ErrorState } from '@/components/seller/FilterTabs'
import { useSellerOrders } from '@/components/seller/useSellerOrders'
import { ACTIVE_STATUSES } from '@/lib/categories'

const EMPTY = {
  active: { emoji: '🍛', title: 'No active orders', description: 'New orders show up here the moment customers reserve your food.' },
  completed: { emoji: '🎉', title: 'Nothing collected yet', description: 'Completed pickups will appear here.' },
  other: { emoji: '🌤️', title: 'All clear', description: 'No declined, cancelled or missed orders.' },
}

export default function SellerOrders() {
  const { orders, error, reload } = useSellerOrders()
  const [tab, setTab] = useState('active')

  const groups = useMemo(() => {
    const g = { active: [], completed: [], other: [] }
    ;(orders ?? []).forEach((o) => {
      if (ACTIVE_STATUSES.includes(o.status)) g.active.push(o)
      else if (o.status === 'completed') g.completed.push(o)
      else g.other.push(o)
    })
    return g
  }, [orders])

  const tabs = [
    { value: 'active', label: 'Active', count: groups.active.length },
    { value: 'completed', label: 'Completed', count: groups.completed.length },
    { value: 'other', label: 'Cancelled & other', count: groups.other.length },
  ]
  const list = groups[tab]

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="animate-rise">
        <h1 className="text-2xl font-extrabold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Updates automatically every few seconds.</p>
      </div>
      <FilterTabs tabs={tabs} value={tab} onChange={setTab} />

      {orders === null && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : orders === null ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState {...EMPTY[tab]} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((o) => (
            <OrderActionCard key={o.id} order={o} onChange={reload} className="animate-rise" />
          ))}
        </div>
      )}
    </div>
  )
}
