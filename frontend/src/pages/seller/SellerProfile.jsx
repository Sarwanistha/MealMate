import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, LogOut, Save, Star } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { ROLE_LABEL, SELLER_TYPES } from '@/lib/categories'
import { initials } from '@/lib/format'
import { CITY_NAMES, areasFor } from '@/lib/india'

function Card({ title, children, className = '' }) {
  return (
    <section className={`space-y-4 rounded-2xl border bg-card p-4 shadow-card md:p-5 ${className}`}>
      {title && <h2 className="text-base font-extrabold">{title}</h2>}
      {children}
    </section>
  )
}

function ToggleRow({ id, title, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm font-bold">
          {title}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}

export default function SellerProfile() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const p = user.seller_profile ?? {}

  const [form, setForm] = useState({
    business_name: p.business_name ?? '',
    seller_type: p.seller_type ?? 'restaurant',
    address: p.address ?? '',
    area: p.area ?? '',
    city: p.city ?? '',
    phone: p.phone ?? user.phone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const missing = (k) => submitted && !form[k].trim()

  const save = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (['business_name', 'address', 'area', 'city'].some((k) => !form[k].trim())) {
      toast.error('Please fill in the highlighted fields')
      return
    }
    setSaving(true)
    try {
      const u = await api.updateProfile({
        ...form,
        business_name: form.business_name.trim(),
        address: form.address.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
        phone: form.phone.trim() || null,
      })
      setUser(u)
      toast.success('Shop profile saved ✨')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (key, value, message) => {
    setToggling(key)
    try {
      setUser(await api.updateProfile({ [key]: value }))
      toast.success(message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setToggling('')
    }
  }

  const textField = (id, label, extra = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-bold">
        {label}
      </Label>
      <Input
        id={id}
        value={form[id]}
        aria-invalid={missing(id)}
        onChange={(e) => set({ [id]: e.target.value })}
        className="h-11 rounded-xl"
        {...extra}
      />
      {missing(id) && <p className="text-xs font-semibold text-destructive">Required</p>}
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="animate-rise flex items-center gap-4">
        <Avatar className="size-16 text-xl">
          <AvatarFallback className="bg-primary-soft font-extrabold text-primary">
            {initials(p.business_name || user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{p.business_name || user.name}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {p.rating_count > 0 ? (
              <>
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <b className="tabular text-foreground">{Number(p.rating_avg).toFixed(1)}</b>
                <span>
                  from {p.rating_count} review{p.rating_count > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              'No reviews yet — your first happy customer is coming'
            )}
          </p>
        </div>
      </div>

      <Card title="Shop status">
        <ToggleRow
          id="is_open"
          title="Shop is open"
          description="When closed, your listings are hidden from customers."
          checked={p.is_open ?? true}
          disabled={toggling === 'is_open'}
          onChange={(v) => toggle('is_open', v, v ? 'Shop is open' : 'Shop closed')}
        />
        <ToggleRow
          id="auto_accept"
          title="Auto-accept orders"
          description="New orders skip the queue and go straight to accepted."
          checked={p.auto_accept ?? false}
          disabled={toggling === 'auto_accept'}
          onChange={(v) => toggle('auto_accept', v, v ? 'Orders will be auto-accepted' : 'Manual acceptance on')}
        />
      </Card>

      <form onSubmit={save} noValidate>
        <Card title="Shop profile">
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('business_name', 'Business name')}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Type</Label>
              <Select value={form.seller_type} onValueChange={(v) => set({ seller_type: v })}>
                <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Seller type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SELLER_TYPES).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {textField('address', 'Address')}
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('city', 'City', { list: 'city-suggestions' })}
            {textField('area', 'Area', { list: 'area-suggestions' })}
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
          {textField('phone', 'Phone', { type: 'tel', inputMode: 'tel' })}
          <Button type="submit" disabled={saving} className="h-12 w-full rounded-xl font-extrabold active:scale-[0.98] sm:w-auto sm:px-8">
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Save changes
          </Button>
        </Card>
      </form>

      <Card title="Account">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd className="font-semibold">{user.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="truncate font-semibold">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="font-semibold">{ROLE_LABEL[user.role] ?? user.role}</dd>
          </div>
        </dl>
        <Button
          variant="outline"
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="h-11 w-full rounded-xl font-bold text-destructive hover:text-destructive active:scale-95 sm:w-auto"
        >
          <LogOut /> Log out
        </Button>
      </Card>
    </div>
  )
}
