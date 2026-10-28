import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '@/lib/api'

const AuthContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  // api.js fires this when an authenticated request comes back 401 (expired token)
  useEffect(() => {
    window.addEventListener('mealmate:unauthorized', logout)
    return () => window.removeEventListener('mealmate:unauthorized', logout)
  }, [logout])

  const value = useMemo(() => {
    const authenticate = async (call, body) => {
      const { access_token, user } = await call(body)
      setToken(access_token)
      setUser(user)
      return user
    }
    return {
      user,
      loading,
      isSeller: user?.role === 'seller',
      isCustomer: user?.role === 'buyer' || user?.role === 'ngo',
      login: (body) => authenticate(api.login, body),
      register: (body) => authenticate(api.register, body),
      setUser,
      logout,
    }
  }, [user, loading, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
