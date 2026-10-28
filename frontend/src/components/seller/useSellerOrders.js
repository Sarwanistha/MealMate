import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

/** Loads the seller's orders and polls (default 10 s). Keeps stale data on poll errors. */
export function useSellerOrders(interval = 10000) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const alive = useRef(true)

  const load = useCallback(async () => {
    try {
      const data = await api.sellerOrders()
      if (!alive.current) return
      setOrders(data)
      setError('')
    } catch (e) {
      if (alive.current) setError(e.message)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    load()
    const t = setInterval(() => {
      if (!document.hidden) load()
    }, interval)
    return () => {
      alive.current = false
      clearInterval(t)
    }
  }, [load, interval])

  return { orders, error, reload: load }
}
