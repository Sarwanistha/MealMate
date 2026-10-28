import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import EmptyState from '@/components/EmptyState'
import FoodTile from '@/components/FoodTile'
import VegDot from '@/components/VegDot'
import FilterTabs, { ErrorState } from '@/components/seller/FilterTabs'
import { useNow } from '@/hooks/useNow'
import { api } from '@/lib/api'
import { inr, parseDate, pickupWindow, timeLeft } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_UI = {
  active: { label: 'Active', cls: 'bg-success-soft text-success' },
  sold_out: { label: 'Sold out', cls: 'bg-warning-soft text-warning-foreground dark:text-warning' },
  expired: { label: 'Ended', cls: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', cls: 'bg-destructive/10 text-destructive' },
}

// A listing can be "active" server-side yet already sold out or past its window
function effectiveStatus(l, now) {
  if (l.status === 'cancelled') return 'cancelled'
  if (l.status === 'expired' || parseDate(l.pickup_end).getTime() <= now) return 'expired'
  if (l.status === 'sold_out' || l.quantity_available <= 0) return 'sold_out'
  return 'active'
}

const FILTERS = {
  all: () => true,
  active: (s) => s === 'active',
  sold_out: (s) => s === 'sold_out',
  ended: (s) => s === 'expired' || s === 'cancelled',
}

function ListingStatus({ status }) {
  const s = STATUS_UI[status]
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', s.cls)}>{s.label}</span>
}

function Price({ l }) {
  return l.is_free || l.price === 0 ? (
    <span className="font-extrabold text-success">Free</span>
  ) : (
    <span className="tabular">
      <span className="font-extrabold">{inr(l.price)}</span>{' '}
      <span className="text-xs text-muted-foreground line-through">{inr(l.original_price)}</span>
    </span>
  )
}

function Stock({ l }) {
  const pct = l.quantity_total ? (l.quantity_available / l.quantity_total) * 100 : 0
  return (
    <div className="min-w-28">
      <p className="tabular text-xs font-bold">
        {l.quantity_available} <span className="font-medium text-muted-foreground">/ {l.quantity_total} left</span>
      </p>
      <Progress value={pct} className="mt-1 h-1.5" />
    </div>
  )
}

function Actions({ l, status, onCancel, onRepost }) {
  const navigate = useNavigate()
  const editable = status === 'active' || status === 'sold_out'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${l.title}`} className="size-10 rounded-xl">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {editable && (
          <DropdownMenuItem onSelect={() => navigate(`/seller/listings/${l.id}/edit`)}>
            <Pencil /> Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => onRepost(l)}>
          <Copy /> Repost
        </DropdownMenuItem>
        {editable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onCancel(l)}>
              <Trash2 /> Cancel listing
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Listings() {
  const navigate = useNavigate()
  const now = useNow(30000)
  const [listings, setListings] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [toCancel, setToCancel] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(() => {
    setError('')
    api
      .sellerListings()
      .then(setListings)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const rows = useMemo(
    () => (listings ?? []).map((l) => ({ l, status: effectiveStatus(l, now) })),
    [listings, now],
  )
  const count = (f) => rows.filter((r) => FILTERS[f](r.status)).length
  const shown = rows.filter((r) => FILTERS[filter](r.status))

  const repost = (l) => navigate('/seller/listings/new', { state: { template: l } })

  const confirmCancel = async () => {
    setCancelling(true)
    try {
      await api.cancelListing(toCancel.id)
      toast.success('Listing cancelled')
      setToCancel(null)
      load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCancelling(false)
    }
  }

  const tabs = [
    { value: 'all', label: 'All', count: count('all') },
    { value: 'active', label: 'Active', count: count('active') },
    { value: 'sold_out', label: 'Sold out', count: count('sold_out') },
    { value: 'ended', label: 'Ended', count: count('ended') },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="animate-rise flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your listings</h1>
          <p className="text-sm text-muted-foreground">Manage what you&apos;re rescuing today.</p>
        </div>
        <Button asChild className="h-11 rounded-xl px-5 font-bold active:scale-95">
          <Link to="/seller/listings/new">
            <Plus /> New listing
          </Link>
        </Button>
      </div>

      {listings && <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />}

      {error && !listings ? (
        <ErrorState message={error} onRetry={load} />
      ) : !listings ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          emoji={listings.length === 0 ? '🍱' : '🔍'}
          title={listings.length === 0 ? 'No listings yet' : 'Nothing in this tab'}
          description={
            listings.length === 0 ? 'Post your surplus food and it goes live instantly.' : 'Try a different filter.'
          }
          action={
            listings.length === 0 && (
              <Button asChild className="h-11 rounded-xl font-bold">
                <Link to="/seller/listings/new">
                  <Plus /> Create your first listing
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* mobile cards */}
          <div className="space-y-3 md:hidden">
            {shown.map(({ l, status }) => {
              const left = timeLeft(l.pickup_end, now)
              return (
                <div key={l.id} className="animate-rise flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
                  <FoodTile item={l} className="size-16 shrink-0 rounded-xl" emojiClassName="text-3xl" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <VegDot diet={l.diet} />
                      <p className="truncate text-sm font-bold">{l.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Price l={l} />
                      <ListingStatus status={status} />
                    </div>
                    <Stock l={l} />
                    <p className="text-[11px] text-muted-foreground">
                      {status === 'active' ? `Ends in ${left.text.replace(' left', '')}` : pickupWindow(l.pickup_start, l.pickup_end)}
                    </p>
                  </div>
                  <Actions l={l} status={status} onCancel={setToCancel} onRepost={repost} />
                </div>
              )
            })}
          </div>

          {/* desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Listing</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Ends in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map(({ l, status }) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <FoodTile item={l} className="size-12 shrink-0 rounded-xl" emojiClassName="text-2xl" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <VegDot diet={l.diet} />
                            <p className="max-w-56 truncate font-bold">{l.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{pickupWindow(l.pickup_start, l.pickup_end)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Price l={l} />
                    </TableCell>
                    <TableCell>
                      <Stock l={l} />
                    </TableCell>
                    <TableCell className="tabular text-sm">
                      {status === 'active' || status === 'sold_out' ? timeLeft(l.pickup_end, now).text.replace(' left', '') : '—'}
                    </TableCell>
                    <TableCell>
                      <ListingStatus status={status} />
                    </TableCell>
                    <TableCell>
                      <Actions l={l} status={status} onCancel={setToCancel} onRepost={repost} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AlertDialog open={!!toCancel} onOpenChange={(o) => !o && !cancelling && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel &ldquo;{toCancel?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from the marketplace immediately. Existing orders are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault()
                confirmCancel()
              }}
            >
              {cancelling ? 'Cancelling…' : 'Cancel listing'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
