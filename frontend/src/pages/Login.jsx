import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthShell from '@/components/auth/AuthShell'
import { useAuth } from '@/context/AuthContext'

const DEMOS = [
  { label: '🛍️ Customer', email: 'buyer@mealmate.app' },
  { label: '🏪 Seller', email: 'seller1@mealmate.app' },
  { label: '🤝 NGO', email: 'ngo@mealmate.app' },
]

export default function Login() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.role === 'seller' ? '/seller' : location.state?.from || '/'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login({ email: email.trim(), password })
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back 👋" subtitle="Log in to reserve food and track your orders.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="h-12 rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" disabled={busy || !email || !password} className="h-12 w-full rounded-xl text-base font-bold active:scale-95">
          {busy && <Loader2 className="size-5 animate-spin" />} Log in
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed p-4">
        <p className="text-sm font-bold">Try a demo account</p>
        <p className="text-xs text-muted-foreground">Fills the form. Password is demo1234.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMOS.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email)
                setPassword('demo1234')
                setError('')
              }}
              className="rounded-full border bg-card px-4 py-2 text-sm font-semibold transition-all hover:border-primary hover:text-primary active:scale-95"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to MealMate?{' '}
        <Link to="/register" state={location.state} className="font-bold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
