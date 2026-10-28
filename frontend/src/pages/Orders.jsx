import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import OrderCard from '@/components/orders/OrderCard'
import { useFetch } from '@/hooks/useFetch'
import { api } from '@/lib/api'

function OrderSkeletons() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 rounded-2xl border bg-card p-4">
          <div className="size-16 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-8 w-24 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Orders() {
  const [tab, setTab] = useState('active')
  const { data, error, loading, reload } = useFetch(
    () => api.orders({ active: tab === 'active' ? 'true' : 'false' }),
    [tab],
    { interval: tab === 'active' ? 10000 : undefined },
  )
  // `data` can briefly belong to the previous tab while a new request is in flight; `loading` covers it.
  const orders = data ?? []

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Your orders</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg font-bold">
            Active
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg font-bold">
            Past
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-5">
        {loading ? (
          <OrderSkeletons />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} title="Couldn't load orders" />
        ) : orders.length === 0 ? (
          <EmptyState
            emoji={tab === 'active' ? '🛍️' : '📜'}
            title={tab === 'active' ? 'No active reservations' : 'No past orders yet'}
            description={
              tab === 'active' ? 'Reserve some surplus food and it will show up here.' : 'Your finished orders will appear here.'
            }
            action={
              <Button asChild className="h-11 rounded-xl font-bold">
                <Link to="/">Find food</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {orders.map((o, i) => (
              <div key={o.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <OrderCard order={o} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
