import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import FoodTile from '@/components/FoodTile'
import QtyStepper from '@/components/QtyStepper'
import VegDot from '@/components/VegDot'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { inr } from '@/lib/format'

const query = '(min-width: 768px)'

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

export default function CartSheet() {
  const cart = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const desktop = useIsDesktop()

  // close when navigating
  useEffect(() => {
    cart.setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const { items, seller, total, savings, count } = cart

  const reserve = () => {
    cart.closeCart()
    if (!user) navigate('/login', { state: { from: '/checkout' } })
    else navigate('/checkout')
  }

  return (
    <Sheet open={cart.open} onOpenChange={cart.setOpen}>
      <SheetContent
        side={desktop ? 'right' : 'bottom'}
        className={desktop ? 'w-full gap-0 sm:max-w-md' : 'max-h-[88vh] gap-0 rounded-t-3xl'}
      >
        <SheetHeader className="border-b text-left">
          <SheetTitle className="text-xl font-extrabold">Your cart</SheetTitle>
          <SheetDescription>
            {seller ? (
              <>
                From <b className="text-foreground">{seller.business_name}</b> · {seller.area}
              </>
            ) : (
              'Reserve surplus food for pickup'
            )}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <div className="animate-float text-6xl" aria-hidden>
              🧺
            </div>
            <h3 className="mt-3 text-lg font-bold">Nothing here yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add something tasty and rescue it before it&apos;s gone.</p>
            <Button onClick={cart.closeCart} variant="outline" className="mt-5 h-11 rounded-xl font-bold active:scale-95">
              Keep browsing
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {items.map(({ listing, qty }) => (
                <li key={listing.id} className="flex items-center gap-3 py-3">
                  <FoodTile item={listing} className="size-16 shrink-0 rounded-xl" emojiClassName="text-3xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1.5">
                      <VegDot diet={listing.diet} className="mt-0.5" />
                      <p className="line-clamp-2 text-sm leading-snug font-bold">{listing.title}</p>
                    </div>
                    <p className="tabular mt-1 text-xs text-muted-foreground">
                      {listing.is_free ? 'Free' : inr(listing.price)} each
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <QtyStepper
                      qty={qty}
                      className="h-9 [&>button]:h-9"
                      onDec={() => cart.setQty(listing.id, qty - 1)}
                      onInc={() => cart.add(listing)}
                      disableInc={qty >= Math.min(listing.max_per_user ?? 1, listing.quantity_available ?? 1)}
                    />
                    <span className={`tabular text-sm font-extrabold ${listing.is_free ? 'text-success' : ''}`}>
                      {listing.is_free ? 'Free' : inr(listing.price * qty)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
                  <dd className="tabular font-semibold">{inr(total + savings)}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between font-semibold text-success">
                    <dt>You saved</dt>
                    <dd className="tabular">−{inr(savings)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-extrabold">
                  <dt>Total</dt>
                  <dd className="tabular">{total === 0 ? 'Free' : inr(total)}</dd>
                </div>
              </dl>
              <p className="rounded-xl bg-success-soft px-3 py-2 text-center text-xs font-semibold text-success">
                🌱 You&apos;ll rescue {count} {count === 1 ? 'meal' : 'meals'} from the bin
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Clear cart"
                  onClick={cart.clear}
                  className="size-12 shrink-0 rounded-xl active:scale-95"
                >
                  <Trash2 className="size-5" />
                </Button>
                <Button onClick={reserve} className="h-12 flex-1 rounded-xl text-base font-bold active:scale-95">
                  Reserve for pickup
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
