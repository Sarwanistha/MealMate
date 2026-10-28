export const inr = (n) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

// API sends ISO strings with "Z"; be tolerant if the suffix is missing.
export const parseDate = (s) =>
  s instanceof Date ? s : new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`)

export const formatTime = (s) =>
  parseDate(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

export const formatDay = (s) => {
  const d = parseDate(s)
  const today = new Date()
  const tomorrow = new Date(Date.now() + 864e5)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const formatDateTime = (s) => `${formatDay(s)}, ${formatTime(s)}`

// "7:00 – 9:00 PM"
export function pickupWindow(start, end) {
  const a = formatTime(start)
  const b = formatTime(end)
  const [aT, aP] = a.split(' ')
  const [, bP] = b.split(' ')
  return aP === bP ? `${aT} – ${b}` : `${a} – ${b}`
}

// ms remaining -> {text, urgent, expired}
export function timeLeft(iso, now = Date.now()) {
  const ms = parseDate(iso).getTime() - now
  if (ms <= 0) return { text: 'Ended', urgent: false, expired: true }
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return { text: `${Math.max(mins, 1)}m left`, urgent: true, expired: false }
  const h = Math.floor(mins / 60)
  if (h < 24) return { text: `${h}h ${mins % 60}m left`, urgent: h < 2, expired: false }
  return { text: `${Math.floor(h / 24)}d left`, urgent: false, expired: false }
}

export function timeAgo(iso, now = Date.now()) {
  const secs = Math.max(0, Math.floor((now - parseDate(iso).getTime()) / 1000))
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

// value for <input type="datetime-local"> (local time) from an ISO string / Date
export function toLocalInput(value) {
  const d = new Date(parseDate(value))
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
