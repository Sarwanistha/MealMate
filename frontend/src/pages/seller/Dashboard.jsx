import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Bell, HandHeart, IndianRupee, Plus, ShoppingBag, Soup, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/EmptyState'
import FoodTile from '@/components/FoodTile'
import OrderActionCard from '@/components/seller/OrderActionCard'
import OrderCardSkeleton from '@/components/seller/OrderCardSkeleton'
import { ErrorState } from '@/components/seller/FilterTabs'
import { useSellerOrders } from '@/components/seller/useSellerOrders'
import { useAuth } from '@/context/AuthContext'
import { useCountUp } from '@/hooks/useCountUp'
import { api } from '@/lib/api'
import { ACTIVE_STATUSES } from '@/lib/categories'
import { inr, timeLeft } from '@/lib/format'
import { cn } from '@/lib/utils'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function StatCard({ icon: Icon, label, value, format = (n) => n.toLocaleString('en-IN'), tone = 'primary', highlight, delay, children }) {
  const [shown, ref] = useCountUp(value ?? 0)
  const tones = {
    primary: 'bg-primary-soft text-primary',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning-foreground dark:text-warning',
  }
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        'animate-rise rounded-2xl border bg-card p-4 shadow-card',
        highlight && 'border-warning ring-2 ring-warning/40',
      )}
    >
      <div className={cn('mb-3 grid size-10 place-items-center rounded-xl', tones[tone])}>
        <Icon className="size-5" />
      </div>
      <div ref={ref} key={value} className="tabular animate-pop text-3xl font-extrabold tracking-tight">
        {format(shown)}
      </div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const profile = user?.seller_profile
  const { orders, error: ordersError, reload: reloadOrders } = useSellerOrders()

  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [listings, setListings] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [fresh, setFresh] = useState(() => new Set())
  const seen = useRef(null)

  const loadStats = useCallback(() => {
    api
      .sellerStats()
      .then((s) => {
        setStats(s)
        setStatsError('')
      })
      .catch((e) => setStatsError(e.message))
  }, [])

  useEffect(() => {
    loadStats()
    api.sellerListings().then(setListings).catch(() => setListings([]))
    const t = setInterval(() => !document.hidden && loadStats(), 20000)
    return () => clearInterval(t)
  }, [loadStats])

  // Spot newly arrived `placed` orders between polls
  useEffect(() => {
    if (!orders) return
    const placed = orders.filter((o) => o.status === 'placed').map((o) => o.id)
    if (seen.current === null) {
      seen.current = new Set(placed)
      return
    }
    const added = placed.filter((id) => !seen.current.has(id))
    if (added.length) {
      added.forEach((id) => seen.current.add(id))
      setFresh((f) => new Set([...f, ...added]))
      toast(`🔔 ${added.length} new order${added.length > 1 ? 's' : ''}!`)
      loadStats()
    }
  }, [orders, loadStats])

  const refresh = useCallback(async () => {
    await Promise.all([reloadOrders(), loadStats()])
  }, [reloadOrders, loadStats])

  const toggleOpen = async (checked) => {
    setToggling(true)
    try {
      const u = await api.updateProfile({ is_open: checked })
      setUser(u)
      toast.success(checked ? 'Shop is open — customers can see your food' : 'Shop closed — listings are hidden')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setToggling(false)
    }
  }

  const incoming = (orders ?? []).filter((o) => ACTIVE_STATUSES.includes(o.status))
  incoming.sort((a, b) => (a.status === 'placed' ? 0 : 1) - (b.status === 'placed' ? 0 : 1))
  const activeListings = (listings ?? []).filter((l) => l.status === 'active').slice(0, 6)
  const isOpen = profile?.is_open ?? true

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* header */}
      <section className="animate-rise flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-success-soft to-card p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight md:text-3xl">
            {greeting()}, {profile?.business_name ?? user?.name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening at your shop today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border bg-card px-4 text-sm font-bold">
            <span className={cn('size-2 rounded-full', isOpen ? 'animate-pulse bg-success' : 'bg-muted-foreground')} />
            {isOpen ? 'Open' : 'Closed'}
            <Switch checked={isOpen} disabled={toggling} onCheckedChange={toggleOpen} aria-label="Shop open" />
          </label>
          <Button asChild className="h-11 rounded-xl px-5 font-bold active:scale-95">
            <Link to="/seller/listings/new">
              <Plus /> New listing
            </Link>
          </Button>
        </div>
      </section>

      {/* onboarding */}
      {listings && listings.length === 0 && (
        <section className="animate-rise flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-primary/40 bg-primary-soft p-8 text-center">
          <div className="animate-float text-6xl">🍱</div>
          <h2 className="text-xl font-extrabold">Create your first listing</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Got leftover food? List it in under a minute and let nearby customers and NGOs rescue it.
          </p>
          <Button size="lg" className="h-12 rounded-xl px-6 font-bold active:scale-95" onClick={() => navigate('/seller/listings/new')}>
            <Plus /> Create first listing
          </Button>
        </section>
      )}

      {/* stats */}
      {statsError && !stats ? (
        <ErrorState message={statsError} onRetry={loadStats} />
      ) : !stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={ShoppingBag} label="Today's orders" value={stats.orders_today} delay={0} highlight={stats.pending_orders > 0}>
            {stats.pending_orders > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[11px] font-extrabold text-warning-foreground">
                <Bell className="size-3" /> {stats.pending_orders} pending
              </span>
            )}
          </StatCard>
          <StatCard icon={IndianRupee} label="Revenue today" value={stats.revenue_today} format={(n) => inr(n)} delay={60} />
          <StatCard icon={HandHeart} tone="success" label="Meals rescued" value={stats.meals_rescued} delay={120} />
          <StatCard icon={Soup} label="Active listings" value={stats.active_listings} delay={180}>
            {stats.rating_count > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {Number(stats.rating_avg).toFixed(1)}
                <span className="font-medium text-muted-foreground">({stats.rating_count})</span>
              </span>
            )}
          </StatCard>
        </div>
      )}

      {/* incoming orders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            Incoming orders
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
          </h2>
          <Link to="/seller/orders" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
            All orders <ArrowRight className="size-4" />
          </Link>
        </div>
        {orders === null && ordersError ? (
          <ErrorState message={ordersError} onRetry={reloadOrders} />
        ) : orders === null ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : incoming.length === 0 ? (
          <EmptyState emoji="🍛" title="No orders yet — your listings are live" description="We'll ping you here as soon as someone reserves your food." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {incoming.map((o) => (
              <OrderActionCard key={o.id} order={o} onChange={refresh} highlight={fresh.has(o.id) && o.status === 'placed'} />
            ))}
          </div>
        )}
      </section>

      {/* listings strip */}
      {activeListings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Your listings</h2>
            <Link to="/seller/listings" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
              Manage <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {activeListings.map((l) => (
              <Link
                key={l.id}
                to={`/seller/listings/${l.id}/edit`}
                className="w-44 shrink-0 overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover active:scale-95"
              >
                <FoodTile item={l} className="h-20" emojiClassName="text-4xl" />
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{l.title}</p>
                  <p className="tabular text-xs text-muted-foreground">
                    {l.quantity_available}/{l.quantity_total} left
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">{timeLeft(l.pickup_end).text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
