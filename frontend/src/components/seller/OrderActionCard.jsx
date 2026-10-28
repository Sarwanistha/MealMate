import { useState } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, Check, Loader2, PackageCheck, Phone, StickyNote, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import StatusBadge from '@/components/StatusBadge'
import VegDot from '@/components/VegDot'
import { api } from '@/lib/api'
import { categoryMeta } from '@/lib/categories'
import { inr, pickupWindow, timeAgo } from '@/lib/format'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'

/** Order card for sellers. `highlight` pulses a fresh order; `onChange` asks the parent to refetch. */
export default function OrderActionCard({ order, onChange, highlight = false, className }) {
  const now = useNow(30000)
  const [busy, setBusy] = useState('')
  const [declineOpen, setDeclineOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)

  const isNgo = order.buyer?.role === 'ngo'
  const canVerify = order.status === 'accepted' || order.status === 'ready'

  const run = async (key, call, success) => {
    setBusy(key)
    try {
      await call()
      toast.success(success)
      await onChange?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-card transition-all',
        order.status === 'placed' && 'border-warning/60',
        highlight && 'animate-pop ring-2 ring-primary/60',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tabular text-base font-extrabold">#{order.id}</span>
            <StatusBadge status={order.status} />
            {highlight && (
              <span className="animate-pulse rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-primary-foreground">
                NEW
              </span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-semibold">{order.buyer?.name ?? 'Customer'}</span>
            {isNgo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">
                <BadgeCheck className="size-3" /> NGO
              </span>
            )}
            {order.buyer?.phone && (
              <a
                href={`tel:${order.buyer.phone}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Phone className="size-3" />
                {order.buyer.phone}
              </a>
            )}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo(order.created_at, now)}</span>
      </header>

      <ul className="mt-3 space-y-1.5 rounded-xl bg-muted/50 p-3">
        {order.items.map((it, i) => (
          <li key={`${it.listing_id}-${i}`} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="text-lg">
              {categoryMeta(it.category).emoji}
            </span>
            <VegDot diet={it.diet} />
            <span className="min-w-0 flex-1 truncate font-medium">{it.title}</span>
            <span className="tabular font-extrabold">×{it.qty}</span>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-warning-soft px-3 py-2 text-xs">
          <StickyNote className="mt-0.5 size-3.5 shrink-0" />
          <span className="italic">“{order.note}”</span>
        </p>
      )}

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xs text-muted-foreground">Pickup {pickupWindow(order.pickup_start, order.pickup_end)}</p>
        {order.total > 0 ? (
          <span className="tabular text-xl font-extrabold">{inr(order.total)}</span>
        ) : (
          <span className="text-xl font-extrabold text-success">Free</span>
        )}
      </div>

      {(order.status === 'placed' || canVerify) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {order.status === 'placed' && (
            <>
              <Button
                disabled={!!busy}
                onClick={() => run('accept', () => api.acceptOrder(order.id), 'Order accepted 👍')}
                className="h-11 flex-1 rounded-xl bg-success font-bold text-success-foreground hover:bg-success/90 active:scale-95"
              >
                {busy === 'accept' ? <Loader2 className="animate-spin" /> : <Check />}
                Accept
              </Button>
              <Button
                variant="ghost"
                disabled={!!busy}
                onClick={() => setDeclineOpen(true)}
                className="h-11 rounded-xl font-bold text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95"
              >
                <X /> Decline
              </Button>
            </>
          )}
          {order.status === 'accepted' && (
            <Button
              variant="outline"
              disabled={!!busy}
              onClick={() => run('ready', () => api.readyOrder(order.id), 'Marked ready for pickup 🛍️')}
              className="h-11 flex-1 rounded-xl font-bold active:scale-95"
            >
              {busy === 'ready' ? <Loader2 className="animate-spin" /> : <PackageCheck />}
              Mark ready
            </Button>
          )}
          {canVerify && (
            <Button
              disabled={!!busy}
              onClick={() => setVerifyOpen(true)}
              className="h-11 flex-1 rounded-xl font-bold active:scale-95"
            >
              <BadgeCheck /> Verify &amp; complete
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline order #{order.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              {order.buyer?.name} will be notified and the food goes back on your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run('reject', () => api.rejectOrder(order.id), 'Order declined')}
            >
              Yes, decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {verifyOpen && (
        <VerifyDialog
          order={order}
          onClose={() => setVerifyOpen(false)}
          onDone={async () => {
            setVerifyOpen(false)
            await onChange?.()
          }}
        />
      )}
    </article>
  )
}

function VerifyDialog({ order, onClose, onDone }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (code.length !== 4) return
    setLoading(true)
    setError('')
    try {
      await api.completeOrder(order.id, code)
      toast.success(`Order #${order.id} handed over 🎉`)
      await onDone()
    } catch (err) {
      setError(
        err.status === 429
          ? 'Too many wrong attempts. This order is locked — please try again later.'
          : err.message,
      )
      setCode('')
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Verify pickup code</DialogTitle>
            <DialogDescription>
              Ask {order.buyer?.name ?? 'the customer'} for the 4-digit code on their order screen.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={code}
            aria-label="4-digit pickup code"
            aria-invalid={!!error}
            placeholder="••••"
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
              setError('')
            }}
            className="tabular h-16 rounded-2xl text-center text-4xl font-extrabold tracking-[0.5em]"
          />
          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="submit"
              disabled={code.length !== 4 || loading}
              className="h-12 w-full rounded-xl bg-success font-bold text-success-foreground hover:bg-success/90 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Check />}
              Complete order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
