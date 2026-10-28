import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import EmptyState from '@/components/EmptyState'
import FoodTile from '@/components/FoodTile'
import VegDot from '@/components/VegDot'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { api } from '@/lib/api'
import { formatDay, inr, parseDate, pickupWindow } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAYMENTS = [
  { value: 'pay_at_pickup', emoji: '💵', title: 'Pay at pickup', text: 'Cash or UPI at the counter' },
  { value: 'upi_mock', emoji: '📱', title: 'UPI (demo)', text: 'Simulated payment, nothing is charged' },
]

export default function Checkout() {
  const { items, seller, total, savings, count, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payment, setPayment] = useState('pay_at_pickup')
  const [note, setNote] = useState('')
  const [safe, setSafe] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The pickup slot every item shares: latest start -> earliest end
  const window_ = useMemo(() => {
    if (!items.length) return null
    const start = items.reduce((a, i) => (parseDate(i.listing.pickup_start) > parseDate(a) ? i.listing.pickup_start : a), items[0].listing.pickup_start)
    const end = items.reduce((a, i) => (parseDate(i.listing.pickup_end) < parseDate(a) ? i.listing.pickup_end : a), items[0].listing.pickup_end)
    return { start, end }
  }, [items])

  if (!items.length)
    return (
      <EmptyState
        emoji="🧺"
        title="Your cart is empty"
        description="Find something delicious to rescue."
        action={
          <Button asChild className="h-11 rounded-xl font-bold">
            <Link to="/">Browse food</Link>
          </Button>
        }
      />
    )

  const address = [seller.address, seller.area, seller.city].filter(Boolean).join(', ')

  const place = async () => {
    setBusy(true)
    setError('')
    try {
      const order = await api.createOrder({
        items: items.map((i) => ({ listing_id: i.listing.id, qty: i.qty })),
        payment_method: payment,
        note: note.trim() || undefined,
      })
      clear()
      toast.success('Reservation placed!')
      navigate(`/orders/${order.id}`, { state: { justPlaced: true }, replace: true })
    } catch (e) {
      setError(e.message)
      toast.error(e.message)
      setBusy(false)
    }
  }

  const summary = (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="font-extrabold">Order summary</h2>
      <p className="text-xs text-muted-foreground">from {seller.business_name}</p>
      <ul className="mt-3 space-y-3">
        {items.map(({ listing, qty }) => (
          <li key={listing.id} className="flex items-center gap-3">
            <FoodTile item={listing} className="size-12 shrink-0 rounded-xl" emojiClassName="text-2xl" />
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <VegDot diet={listing.diet} />
              <span className="truncate text-sm font-semibold">
                {qty} × {listing.title}
              </span>
            </div>
            <span className={cn('tabular text-sm font-bold', listing.is_free && 'text-success')}>
              {listing.is_free ? 'Free' : inr(listing.price * qty)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1.5 border-t pt-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>Subtotal</dt>
          <dd className="tabular">{inr(total + savings)}</dd>
        </div>
        {savings > 0 && (
          <div className="flex justify-between font-semibold text-success">
            <dt>You saved</dt>
            <dd className="tabular">−{inr(savings)}</dd>
          </div>
        )}
        <div className="flex justify-between pt-1 text-lg font-extrabold">
          <dt>To pay</dt>
          <dd className="tabular">{total === 0 ? 'Free' : inr(total)}</dd>
        </div>
      </dl>
      <p className="mt-3 rounded-xl bg-success-soft px-3 py-2 text-center text-xs font-semibold text-success">
        🌱 You&apos;re rescuing {count} {count === 1 ? 'meal' : 'meals'}
      </p>
      <Button
        onClick={place}
        disabled={!safe || busy}
        className="mt-4 hidden h-12 w-full rounded-xl text-base font-bold active:scale-95 lg:flex"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : null}
        {busy ? 'Placing…' : 'Place reservation'}
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl pb-24 lg:pb-0">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Confirm your reservation</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="animate-rise space-y-5">
          {user?.role === 'ngo' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-sm font-bold text-success">
              🤝 Collecting for an NGO
            </span>
          )}

          <section className="rounded-2xl border bg-card p-4 shadow-card">
            <h2 className="font-extrabold">Pickup</h2>
            <div className="mt-3 space-y-3 text-sm">
              <p className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <b>
                    {formatDay(window_.start)}, {pickupWindow(window_.start, window_.end)}
                  </b>
                  <span className="block text-xs text-muted-foreground">Collect within this window or the order lapses.</span>
                </span>
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <b>{seller.business_name}</b>
                  <span className="block text-muted-foreground">{address}</span>
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-4 shadow-card">
            <h2 className="font-extrabold">Payment</h2>
            <RadioGroup value={payment} onValueChange={setPayment} className="mt-3 grid gap-3 sm:grid-cols-2">
              {PAYMENTS.map((p) => (
                <Label
                  key={p.value}
                  htmlFor={p.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all active:scale-[0.98]',
                    payment === p.value ? 'border-primary bg-primary-soft' : 'hover:border-primary/40',
                  )}
                >
                  <RadioGroupItem value={p.value} id={p.value} />
                  <span aria-hidden className="text-2xl">
                    {p.emoji}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{p.title}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{p.text}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </section>

          <section className="rounded-2xl border bg-card p-4 shadow-card">
            <Label htmlFor="note" className="font-extrabold">
              Note for the seller <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="e.g. I'll be there by 8 PM"
              className="mt-3 rounded-xl"
            />
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-success-soft p-4 text-sm">
            <Checkbox checked={safe} onCheckedChange={(v) => setSafe(v === true)} className="mt-0.5" aria-label="Food safety acknowledgement" />
            <span className="text-muted-foreground">
              <ShieldCheck className="mr-1 inline size-4 text-success" />
              I understand this is surplus food. I&apos;ll check it on pickup and consume it the same day.
            </span>
          </label>

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-bold">We couldn&apos;t place your reservation</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">{summary}</aside>
      </div>

      {/* mobile CTA */}
      <div className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 p-3 backdrop-blur-xl lg:hidden">
        <Button onClick={place} disabled={!safe || busy} className="h-12 w-full rounded-xl text-base font-bold active:scale-95">
          {busy ? <Loader2 className="size-5 animate-spin" /> : null}
          {busy ? 'Placing…' : `Place reservation · ${total === 0 ? 'Free' : inr(total)}`}
        </Button>
        {!safe && <p className="mt-1 text-center text-[11px] text-muted-foreground">Tick the food-safety box to continue</p>}
      </div>
    </div>
  )
}
