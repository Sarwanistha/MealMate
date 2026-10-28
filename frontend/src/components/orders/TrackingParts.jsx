import { useState } from 'react'
import { Check, Copy, Loader2, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { ORDER_STATUS, ORDER_STEPS } from '@/lib/categories'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const HERO = {
  placed: { emoji: '⏳', title: 'Waiting for the seller', text: 'We pinged the seller. Hang tight, they usually reply within minutes.' },
  accepted: { emoji: '👨‍🍳', title: 'Reservation accepted', text: 'Your food is being set aside. Head over during your pickup window.' },
  ready: { emoji: '🛍️', title: 'Ready for pickup!', text: 'Show your code at the counter to collect your food.' },
  completed: { emoji: '🎉', title: 'Enjoy your meal!', text: 'Thanks for rescuing food and keeping it out of the bin.' },
  rejected: { emoji: '🚫', title: 'The seller declined', text: "Sorry, they couldn't fulfil this one. Your items are released, so try another seller." },
  cancelled: { emoji: '✖️', title: 'Reservation cancelled', text: 'Your items were released back to the shelf.' },
  expired: { emoji: '⌛', title: 'Request timed out', text: "The seller didn't respond in time, so we released your items." },
  no_show: { emoji: '😕', title: 'Pickup missed', text: 'The pickup window ended before the food was collected.' },
}

const BAD = ['rejected', 'cancelled', 'expired', 'no_show']

export function StatusHero({ status, sellerName }) {
  const h = HERO[status] ?? HERO.placed
  const good = status === 'completed' || status === 'ready'
  const bad = BAD.includes(status)
  return (
    <section
      className={cn('animate-rise rounded-3xl p-6 text-center', good ? 'bg-success-soft' : bad ? 'bg-muted' : 'bg-primary-soft')}
    >
      <div key={status} className={cn('animate-pop text-6xl', status === 'placed' && 'animate-float')} aria-hidden>
        {h.emoji}
      </div>
      <h1 className={cn('mt-2 text-2xl font-extrabold tracking-tight', good && 'text-success')}>{h.title}</h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {status === 'placed' ? `${sellerName} has been notified. ${h.text}` : h.text}
      </p>
    </section>
  )
}

export function Stepper({ order }) {
  const at = (s) => order.events?.find((e) => e.status === s)?.at
  const bad = BAD.includes(order.status)
  const idx = ORDER_STEPS.indexOf(order.status)

  // On a failed order: show "placed" then the terminal state
  const steps = bad ? ['placed', order.status] : ORDER_STEPS

  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const isBadStep = bad && i === steps.length - 1
        const done = bad ? !isBadStep : i < idx || order.status === 'completed'
        const current = !bad && i === idx && order.status !== 'completed'
        const t = at(s)
        const meta = ORDER_STATUS[s]
        return (
          <li key={s} className="relative flex gap-3 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span className={cn('absolute top-8 bottom-0 left-4 w-0.5 -translate-x-1/2', done ? 'bg-success' : 'bg-border')} />
            )}
            <span
              className={cn(
                'relative grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm',
                done && 'border-success bg-success text-success-foreground',
                current && 'border-primary bg-primary-soft',
                isBadStep && 'border-destructive bg-destructive/10 text-destructive',
                !done && !current && !isBadStep && 'bg-card text-muted-foreground',
              )}
            >
              {current && <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
              {done ? <Check className="size-4" /> : isBadStep ? <X className="size-4" /> : <span aria-hidden>{meta.emoji}</span>}
            </span>
            <div className="pt-1">
              <p className={cn('text-sm leading-none font-bold', !done && !current && !isBadStep && 'text-muted-foreground')}>
                {s === 'completed' ? 'Collected' : meta.label}
              </p>
              {t && <p className="mt-1 text-xs text-muted-foreground">{formatTime(t)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function Ticket({ code, status }) {
  const [copied, setCopied] = useState(false)
  const waiting = status === 'placed'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy, but you can read it out.")
    }
  }

  return (
    <div className="relative rounded-3xl border-2 border-dashed border-primary/60 bg-primary-soft p-6 text-center">
      <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border-r-2 border-dashed border-primary/60 bg-background" />
      <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border-l-2 border-dashed border-primary/60 bg-background" />
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Pickup code</p>
      {waiting || !code ? (
        <p className="mt-3 text-sm font-semibold text-muted-foreground">Waiting for the seller to accept…</p>
      ) : (
        <>
          <div className="mt-3 flex justify-center gap-2" aria-label={`Pickup code ${code.split('').join(' ')}`}>
            {code.split('').map((d, i) => (
              <span
                key={i}
                className="animate-pop tabular grid size-14 place-items-center rounded-2xl bg-card text-4xl font-extrabold text-primary shadow-card sm:size-16"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {d}
              </span>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={copy} className="mt-4 rounded-xl font-bold active:scale-95">
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy code'}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Tell the seller this code when you collect.</p>
        </>
      )}
    </div>
  )
}

export function StarPicker({ value, onChange, size = 'size-9' }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
        >
          <Star className={cn(size, 'transition-colors', n <= shown ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
        </button>
      ))}
    </div>
  )
}

export function ReviewCard({ order, onDone }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  if (order.review) {
    return (
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-extrabold">Your review</h2>
        <div className="mt-2 flex gap-0.5" aria-label={`${order.review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={cn('size-5', n <= order.review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
          ))}
        </div>
        {order.review.comment && <p className="mt-2 text-sm text-muted-foreground">{order.review.comment}</p>}
      </section>
    )
  }

  const submit = async () => {
    setBusy(true)
    try {
      const updated = await api.reviewOrder(order.id, { rating, comment: comment.trim() || undefined })
      onDone(updated)
      toast.success('Thanks for your review!')
    } catch (e) {
      toast.error(e.message)
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="font-extrabold">How was it?</h2>
      <p className="text-sm text-muted-foreground">Rate {order.seller.business_name} to help others.</p>
      <div className="mt-3">
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        placeholder="Tell us about the food (optional)"
        aria-label="Review comment"
        className="mt-3 rounded-xl"
      />
      <Button onClick={submit} disabled={!rating || busy} className="mt-3 h-11 w-full rounded-xl font-bold active:scale-95">
        {busy && <Loader2 className="size-4 animate-spin" />} Submit review
      </Button>
    </section>
  )
}
