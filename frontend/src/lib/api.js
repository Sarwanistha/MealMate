const TOKEN_KEY = 'mealmate_token'

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let url = `/api${path}`
  if (params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== false) qs.set(k, v)
    })
    const s = qs.toString()
    if (s) url += `?${s}`
  }

  let res
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0)
  }
  if (res.status === 204) return null

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.detail
    const message = Array.isArray(detail)
      ? detail.map((d) => `${d.loc?.slice(-1)[0] ?? ''} ${d.msg}`.trim()).join(', ')
      : detail || 'Something went wrong'
    if (res.status === 401 && token) window.dispatchEvent(new Event('mealmate:unauthorized'))
    throw new ApiError(message, res.status)
  }
  return data
}

export const api = {
  // auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/me/profile', { method: 'PUT', body }),

  // listings (public browse)
  listings: (params) => request('/listings', { params }),
  listing: (id) => request(`/listings/${id}`),
  locations: () => request('/locations'),
  storefront: (sellerId) => request(`/sellers/${sellerId}`),

  // listings (seller)
  sellerListings: () => request('/seller/listings'),
  createListing: (body) => request('/listings', { method: 'POST', body }),
  updateListing: (id, body) => request(`/listings/${id}`, { method: 'PUT', body }),
  cancelListing: (id) => request(`/listings/${id}/cancel`, { method: 'POST' }),

  // orders (customer)
  createOrder: (body) => request('/orders', { method: 'POST', body }),
  orders: (params) => request('/orders', { params }),
  order: (id) => request(`/orders/${id}`),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  reviewOrder: (id, body) => request(`/orders/${id}/review`, { method: 'POST', body }),

  // orders (seller)
  sellerOrders: (params) => request('/seller/orders', { params }),
  acceptOrder: (id) => request(`/orders/${id}/accept`, { method: 'POST' }),
  rejectOrder: (id) => request(`/orders/${id}/reject`, { method: 'POST' }),
  readyOrder: (id) => request(`/orders/${id}/ready`, { method: 'POST' }),
  completeOrder: (id, pickup_code) =>
    request(`/orders/${id}/complete`, { method: 'POST', body: { pickup_code } }),

  // stats
  sellerStats: () => request('/seller/stats'),
  impact: () => request('/impact'),
}
