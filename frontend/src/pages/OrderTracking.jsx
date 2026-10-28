import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, MapPin, Navigation, Phone } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import Confetti from '@/components/Confetti'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import FoodTile from '@/components/FoodTile'
import StatusBadge from '@/components/StatusBadge'
import VegDot from '@/components/VegDot'
import { ReviewCard, StatusHero, Stepper, Ticket } from '@/components/orders/TrackingParts'
import { useFetch } from '@/hooks/useFetch'
import { api } from '@/lib/api'
import { ACTIVE_STATUSES } from '@/lib/categories'
import { formatDay, inr, pickupWindow } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function OrderTracking() {
  const { id } = useParams()
  const { state } = useLocation()
  const [pollMs, setPollMs] = useState(8000)
  const { data: order, error, loading, reload, setData } = useFetch(() => api.order(id), [id], { interval: pollMs })
  const [cancelling, setCancelling] = useState(false)
  const [confettiDone, setConfettiDone] = useState(false)

  const status = order?.status
  const active = ACTIVE_STATUSES.includes(status)
  const celebrate = (status === 'completed' || Boolean(state?.justPlaced)) && !confettiDone

  // stop polling once the order has reached a final state
  useEffect(() => {
    if (status && !active) setPollMs(undefined)
  }, [status, active])

  useEffect(() => {
    if (!celebrate) return
    const t = setTimeout(() => setConfettiDone(true), 4000)
    return () => clearTimeout(t)
  }, [celebrate])

  if (loading && !order)
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        <div className="h-48 animate-pulse rounded-3xl bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  if (error?.status === 404 || error?.status === 403)
    return (
      <EmptyState
        emoji="🕳️"
        title="Order not found"
        action={
          <Button asChild className="h-11 rounded-xl font-bold">
            <Link to="/orders">Your orders</Link>
          </Button>
        }
      />
    )
  if (error && !order) return <ErrorState error={error} onRetry={reload} />
  if (!order) return null

  const { seller } = order
  const address = [seller.address, seller.area, seller.city].filter(Boolean).join(', ')
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const subtotal = order.total + order.savings
  const showTicket = status === 'accepted' || status === 'ready' || status === 'placed'

  const cancel = async () => {
    setCancelling(true)
    try {
      setData(await api.cancelOrder(order.id))
      toast.success('Reservation cancelled')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {celebrate && <Confetti />}

      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All orders
      </Link>

      {state?.justPlaced && status !== 'completed' && (
        <p className="animate-pop rounded-2xl bg-primary px-4 py-3 text-center font-extrabold text-primary-foreground shadow-hover">
          Reservation placed 🎉
        </p>
      )}

      <StatusHero status={status} sellerName={seller.business_name} />

      {status === 'completed' && (
        <div className="animate-pop -mt-2 flex items-center justify-center gap-2 text-sm font-bold text-success">
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" className="opacity-30" />
            <path d="M7 12.5l3.5 3.5L17 9" strokeDasharray="20" strokeDashoffset="20" className="animate-draw" />
          </svg>
          {order.savings > 0 ? `You saved ${inr(order.savings)} and rescued food` : 'You rescued food from the bin'}
        </div>
      )}

      {showTicket && <Ticket code={order.pickup_code} status={status} />}

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">Progress</h2>
          <StatusBadge status={status} />
        </div>
        <Stepper order={order} />
        {active && (
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            Pickup window: <b className="text-foreground">{formatDay(order.pickup_start)}, {pickupWindow(order.pickup_start, order.pickup_end)}</b>
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-extrabold">Your items</h2>
        <ul className="mt-3 space-y-3">
          {order.items.map((it) => (
            <li key={it.listing_id} className="flex items-center gap-3">
              <FoodTile item={it} className="size-12 shrink-0 rounded-xl" emojiClassName="text-2xl" />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <VegDot diet={it.diet} />
                <span className="truncate text-sm font-semibold">
                  {it.qty} × {it.title}
                </span>
              </span>
              <span className={cn('tabular text-sm font-bold', it.unit_price === 0 && 'text-success')}>
                {it.unit_price === 0 ? 'Free' : inr(it.unit_price * it.qty)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular">{inr(subtotal)}</dd>
          </div>
          {order.savings > 0 && (
            <div className="flex justify-between font-semibold text-success">
              <dt>You saved</dt>
              <dd className="tabular">−{inr(order.savings)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-extrabold">
            <dt>Total</dt>
            <dd className="tabular">{order.total === 0 ? 'Free' : inr(order.total)}</dd>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <dt>Payment</dt>
            <dd>{order.payment_method === 'upi_mock' ? 'UPI (demo)' : 'Pay at pickup'}</dd>
          </div>
        </dl>
        {order.note && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">Note: {order.note}</p>}
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl">
            🏪
          </span>
          <div className="min-w-0 flex-1">
            <Link to={`/seller/${seller.id}/store`} className="font-bold hover:text-primary">
              {seller.business_name}
            </Link>
            <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" /> {address}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="h-11 rounded-xl font-bold active:scale-95">
            <a href={maps} target="_blank" rel="noreferrer">
              <Navigation className="size-4" /> Directions
            </a>
          </Button>
          {seller.phone ? (
            <Button asChild variant="outline" className="h-11 rounded-xl font-bold active:scale-95">
              <a href={`tel:${seller.phone}`}>
                <Phone className="size-4" /> Call
              </a>
            </Button>
          ) : (
            <Button disabled variant="outline" className="h-11 rounded-xl font-bold">
              <Phone className="size-4" /> Call
            </Button>
          )}
        </div>
      </section>

      {status === 'completed' && <ReviewCard order={order} onDone={setData} />}

      {(status === 'placed' || status === 'accepted') && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={cancelling} className="h-12 w-full rounded-xl font-bold text-destructive active:scale-95">
              {cancelling && <Loader2 className="size-4 animate-spin" />} Cancel reservation
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
              <AlertDialogDescription>The food will be released for others. This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={cancel}>Yes, cancel</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
