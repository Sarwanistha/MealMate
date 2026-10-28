import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tiny data-fetching hook. `fetcher` is re-run when `deps` change (and every `interval` ms, silently).
 * Returns { data, error, loading, reload, setData }. Stale responses are ignored.
 */
export function useFetch(fetcher, deps = [], { interval, enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const run = (silent) => {
      if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
      fetcherRef
        .current()
        .then((data) => !cancelled && setState({ data, error: null, loading: false }))
        .catch((error) => {
          if (cancelled) return
          // a failed background refresh keeps the last good data
          setState((s) => (silent && s.data ? s : { data: null, error, loading: false }))
        })
    }
    run(false)
    const t = interval ? setInterval(() => run(true), interval) : null
    return () => {
      cancelled = true
      if (t) clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, interval, enabled])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), [])
  return { ...state, reload, setData }
}

export const useDebounced = (value, ms = 400) => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
