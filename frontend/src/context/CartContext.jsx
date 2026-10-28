import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
} from '@/components/ui/alert-dialog'

const CartContext = createContext(null)
const KEY = 'mealmate_cart'

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext)

const load = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const limitFor = (l) => Math.max(0, Math.min(l.max_per_user ?? 1, l.quantity_available ?? 1))

/**
 * Cart holds items from ONE seller at a time (like Swiggy). Items are `{ listing, qty }`
 * where `listing` is the full Listing snapshot from the API.
 * `add()` returns 'ok' | 'max' | 'conflict' (conflict opens a "replace cart?" dialog).
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(load)
  const [open, setOpen] = useState(false)
  const [conflict, setConflict] = useState(null) // listing waiting for confirmation

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const sellerId = items[0]?.listing.seller.id ?? null

  const add = useCallback(
    (listing, qty = 1) => {
      if (sellerId && sellerId !== listing.seller.id) {
        setConflict(listing)
        return 'conflict'
      }
      const max = limitFor(listing)
      let result = 'ok'
      setItems((prev) => {
        const existing = prev.find((i) => i.listing.id === listing.id)
        const next = Math.min((existing?.qty ?? 0) + qty, max)
        if (next === (existing?.qty ?? 0)) {
          result = 'max'
          return prev
        }
        if (existing) return prev.map((i) => (i.listing.id === listing.id ? { listing, qty: next } : i))
        return [...prev, { listing, qty: next }]
      })
      if (result === 'max') toast.info(`You can take at most ${max} of this item`)
      return result
    },
    [sellerId],
  )

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev
        .map((i) => (i.listing.id === id ? { ...i, qty: Math.min(qty, limitFor(i.listing)) } : i))
        .filter((i) => i.qty > 0),
    )
  }, [])

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.listing.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const confirmReplace = () => {
    const listing = conflict
    setConflict(null)
    setItems([{ listing, qty: 1 }])
    toast.success('Cart replaced')
  }

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0)
    const total = items.reduce((n, i) => n + i.qty * i.listing.price, 0)
    const original = items.reduce((n, i) => n + i.qty * i.listing.original_price, 0)
    return {
      items,
      sellerId,
      seller: items[0]?.listing.seller ?? null,
      count,
      total,
      savings: original - total,
      qtyOf: (id) => items.find((i) => i.listing.id === id)?.qty ?? 0,
      add,
      setQty,
      remove,
      clear,
      open,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      setOpen,
    }
  }, [items, sellerId, add, setQty, remove, clear, open])

  return (
    <CartContext.Provider value={value}>
      {children}
      <AlertDialog open={Boolean(conflict)} onOpenChange={(o) => !o && setConflict(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items from {value.seller?.business_name}. You can only reserve from one seller at a
              time. Replace it with {conflict?.seller.business_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my cart</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>Replace cart</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CartContext.Provider>
  )
}
