import { useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AuthShell from '@/components/auth/AuthShell'
import { useAuth } from '@/context/AuthContext'
import { SELLER_TYPES } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { CITY_NAMES, areasFor } from '@/lib/india'

const ROLES = [
  { value: 'buyer', emoji: '🛍️', label: 'Customer', text: 'Grab deals' },
  { value: 'seller', emoji: '🏪', label: 'Seller', text: 'List surplus' },
  { value: 'ngo', emoji: '🤝', label: 'NGO', text: 'Collect free' },
]

function Field({ id, label, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export default function Register() {
  const { user, register } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  const initialRole = ROLES.some((r) => r.value === params.get('role')) ? params.get('role') : 'buyer'
  const [role, setRole] = useState(initialRole)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    business_name: '',
    seller_type: 'restaurant',
    address: '',
    area: '',
    city: '',
  })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.role === 'seller' ? '/seller' : location.state?.from || '/'} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const seller = role === 'seller'
  const valid =
    form.name.trim() &&
    form.email.trim() &&
    form.password.length >= 6 &&
    (!seller || (form.business_name.trim() && form.address.trim() && form.area.trim() && form.city.trim()))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role,
      phone: form.phone.trim() || undefined,
    }
    if (seller) {
      Object.assign(body, {
        business_name: form.business_name.trim(),
        seller_type: form.seller_type,
        address: form.address.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
      })
    }
    try {
      const u = await register(body)
      toast.success(`Welcome to MealMate, ${u.name.split(' ')[0]}!`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Join MealMate 🌱" subtitle="Create your account in under a minute.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div role="radiogroup" aria-label="I am a" className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={role === r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-2xl border-2 p-3 transition-all active:scale-95',
                role === r.value ? 'border-primary bg-primary-soft shadow-card' : 'bg-card hover:border-primary/40',
              )}
            >
              <span aria-hidden className="text-2xl">
                {r.emoji}
              </span>
              <span className="text-sm font-bold">{r.label}</span>
              <span className="text-[11px] text-muted-foreground">{r.text}</span>
            </button>
          ))}
        </div>

        <Field id="name" label="Full name">
          <Input id="name" autoComplete="name" value={form.name} onChange={set('name')} className="h-12 rounded-xl" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="Email">
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} className="h-12 rounded-xl" />
          </Field>
          <Field id="phone" label="Phone (optional)">
            <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className="h-12 rounded-xl" />
          </Field>
        </div>
        <Field id="password" label="Password (min. 6 characters)">
          <div className="relative">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
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
        </Field>

        {seller && (
          <div className="animate-rise space-y-4 rounded-2xl border bg-card p-4 shadow-card">
            <p className="font-bold">🏪 Tell us about your shop</p>
            <Field id="business_name" label="Business name">
              <Input id="business_name" value={form.business_name} onChange={set('business_name')} className="h-12 rounded-xl" />
            </Field>
            <Field id="seller_type" label="Type">
              <Select value={form.seller_type} onValueChange={(v) => setForm((f) => ({ ...f, seller_type: v }))}>
                <SelectTrigger id="seller_type" className="h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SELLER_TYPES).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="address" label="Street address">
              <Input id="address" autoComplete="street-address" value={form.address} onChange={set('address')} className="h-12 rounded-xl" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="city" label="City">
                <Input id="city" list="city-suggestions" value={form.city} onChange={set('city')} className="h-12 rounded-xl" />
              </Field>
              <Field id="area" label="Area / locality">
                <Input id="area" list="area-suggestions" value={form.area} onChange={set('area')} className="h-12 rounded-xl" />
              </Field>
              <datalist id="city-suggestions">
                {CITY_NAMES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <datalist id="area-suggestions">
                {areasFor(form.city).map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" disabled={busy || !valid} className="h-12 w-full rounded-xl text-base font-bold active:scale-95">
          {busy && <Loader2 className="size-5 animate-spin" />} Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-bold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
