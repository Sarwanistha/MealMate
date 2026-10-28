import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ChevronDown, Eye, Loader2, Rocket, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import ListingCard from '@/components/ListingCard'
import VegDot from '@/components/VegDot'
import { ErrorState } from '@/components/seller/FilterTabs'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { CATEGORY_LIST, DIETS } from '@/lib/categories'
import { toLocalInput } from '@/lib/format'
import { cn } from '@/lib/utils'

const at = (dayOffset, hour) => {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, 0, 0, 0)
  return d
}

const PRESETS = [
  { label: 'Next 2 hours', get: () => [new Date(), new Date(Date.now() + 2 * 36e5)] },
  {
    label: 'Tonight 7–9 PM',
    get: () => {
      const off = new Date().getHours() >= 21 ? 1 : 0
      return [at(off, 19), at(off, 21)]
    },
  },
  { label: 'Tomorrow morning', get: () => [at(1, 8), at(1, 10)] },
]

const freshWindow = () => {
  const [s, e] = PRESETS[0].get()
  return { pickup_start: toLocalInput(s), pickup_end: toLocalInput(e) }
}

const blank = () => ({
  title: '',
  description: '',
  category: 'meals',
  diet: 'veg',
  original_price: '',
  price: '',
  free: false,
  quantity: '5',
  max_per_user: '2',
  allergens: '',
  safety: false,
  ...freshWindow(),
})

const fromListing = (l, keepWindow) => ({
  title: l.title,
  description: l.description ?? '',
  category: l.category,
  diet: l.diet,
  original_price: String(l.original_price),
  price: String(l.price),
  free: l.price === 0,
  quantity: String(l.quantity_total),
  max_per_user: String(l.max_per_user),
  allergens: l.allergens ?? '',
  safety: keepWindow,
  ...(keepWindow
    ? { pickup_start: toLocalInput(l.pickup_start), pickup_end: toLocalInput(l.pickup_end) }
    : freshWindow()),
})

function Field({ label, htmlFor, error, hint, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-card md:p-5">
      <h2 className="text-base font-extrabold">{title}</h2>
      {children}
    </section>
  )
}

const inputCls = 'h-11 rounded-xl'

export default function ListingForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const template = state?.template

  const [form, setForm] = useState(() => (template && !editing ? fromListing(template, false) : blank()))
  const [original, setOriginal] = useState(null)
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const load = () => {
    setLoading(true)
    setLoadError('')
    api
      .listing(id)
      .then((l) => {
        setOriginal(l)
        setForm(fromListing(l, true))
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    if (editing) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const num = (v) => (v === '' ? NaN : Number(v))

  const errors = useMemo(() => {
    const e = {}
    const orig = num(form.original_price)
    const price = form.free ? 0 : num(form.price)
    const qty = num(form.quantity)
    const max = num(form.max_per_user)
    if (!form.title.trim()) e.title = 'Give your listing a name'
    if (!Number.isInteger(orig) || orig < 1) e.original_price = 'Enter the original price (₹1 or more)'
    if (!form.free && (!Number.isInteger(price) || price < 0)) e.price = 'Enter your offer price'
    else if (Number.isInteger(orig) && price > orig) e.price = 'Offer price can’t be higher than the original'
    if (!Number.isInteger(qty) || qty < 1) e.quantity = 'At least 1 portion'
    else if (original && qty < original.quantity_total) e.quantity = `Can only be raised (currently ${original.quantity_total})`
    if (!Number.isInteger(max) || max < 1) e.max_per_user = 'At least 1'
    else if (Number.isInteger(qty) && max > qty) e.max_per_user = 'More than the quantity available'
    const s = new Date(form.pickup_start)
    const en = new Date(form.pickup_end)
    if (!form.pickup_start && !editing) e.pickup_start = 'Pick a start time'
    if (!form.pickup_end) e.pickup_end = 'Pick an end time'
    else if (en <= new Date()) e.pickup_end = 'End time must be in the future'
    else if (form.pickup_start && en <= s) e.pickup_end = 'End must be after the start'
    if (form.allergens.length > 200) e.allergens = 'Keep it under 200 characters'
    if (!form.safety) e.safety = 'Please confirm food safety to continue'
    return e
  }, [form, original, editing])

  const price = form.free ? 0 : num(form.price)
  const orig = num(form.original_price)
  const discount = orig > 0 && price >= 0 && price <= orig ? Math.round(((orig - price) / orig) * 100) : 0

  const previewListing = useMemo(() => {
    const p = profile(user)
    const start = form.pickup_start ? new Date(form.pickup_start) : new Date()
    const end = form.pickup_end ? new Date(form.pickup_end) : new Date(Date.now() + 36e5)
    const qty = Number(form.quantity) > 0 ? Number(form.quantity) : 1
    const o = Number.isFinite(orig) ? orig : 0
    const pr = Number.isFinite(price) ? Math.min(price, o) : o
    return {
      id: 0,
      title: form.title.trim() || 'Your listing title',
      category: form.category,
      diet: form.diet,
      original_price: o,
      price: pr,
      is_free: pr === 0,
      discount_percent: discount,
      quantity_total: qty,
      quantity_available: qty,
      pickup_start: start.toISOString(),
      pickup_end: end.toISOString(),
      status: 'active',
      seller: p,
    }
  }, [form, user, orig, price, discount])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      const common = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        original_price: Number(form.original_price),
        price,
        pickup_end: new Date(form.pickup_end).toISOString(),
        max_per_user: Number(form.max_per_user),
        allergens: form.allergens.trim() || null,
      }
      if (editing) {
        const body = { ...common }
        if (Number(form.quantity) > original.quantity_total) body.quantity = Number(form.quantity)
        await api.updateListing(id, body)
        toast.success('Listing updated ✨')
      } else {
        await api.createListing({
          ...common,
          category: form.category,
          diet: form.diet,
          quantity: Number(form.quantity),
          pickup_start: new Date(form.pickup_start).toISOString(),
        })
        toast.success('Your listing is live 🎉')
      }
      navigate('/seller/listings')
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  const show = (k) => (submitted ? errors[k] : undefined)
  // live feedback on the price pair is helpful before submit
  const livePrice = errors.price && form.price !== '' && !form.free ? errors.price : show('price')

  if (loadError) return <ErrorState message={loadError} onRetry={load} />
  if (loading)
    return (
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="hidden h-96 rounded-2xl lg:block" />
      </div>
    )

  const lock = editing

  const previewBlock = (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <Eye className="size-3.5" /> Live preview
      </p>
      <ListingCard listing={previewListing} preview />
      <p className="text-center text-xs text-muted-foreground">This is how customers will see it.</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex h-9 items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </button>
      <h1 className="animate-rise mb-4 text-2xl font-extrabold tracking-tight">
        {editing ? 'Edit listing' : template ? 'Repost listing' : 'New listing'}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} noValidate className="space-y-4 pb-4">
          {/* mobile preview */}
          <div className="rounded-2xl border bg-card shadow-card lg:hidden">
            <button
              type="button"
              onClick={() => setPreviewOpen((o) => !o)}
              aria-expanded={previewOpen}
              className="flex h-12 w-full items-center justify-between px-4 text-sm font-bold"
            >
              <span className="flex items-center gap-2">
                <Eye className="size-4 text-primary" /> Preview
              </span>
              <ChevronDown className={cn('size-4 transition-transform', previewOpen && 'rotate-180')} />
            </button>
            {previewOpen && <div className="px-4 pb-4">{previewBlock}</div>}
          </div>

          <Section title="What are you offering?">
            <Field label="Title" htmlFor="title" error={show('title')}>
              <Input
                id="title"
                value={form.title}
                maxLength={160}
                placeholder="e.g. Paneer butter masala combo"
                aria-invalid={!!show('title')}
                onChange={(e) => set({ title: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Description" htmlFor="desc" hint="Optional — what's in it, how fresh, portion size">
              <Textarea
                id="desc"
                rows={3}
                value={form.description}
                maxLength={2000}
                onChange={(e) => set({ description: e.target.value })}
                className="rounded-xl"
              />
            </Field>

            <Field label="Category" hint={lock ? "Category can't be changed after posting." : undefined}>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Category">
                {CATEGORY_LIST.map((c) => {
                  const on = form.category === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={lock}
                      onClick={() => set({ category: c.value })}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2.5 text-[11px] font-bold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 disabled:opacity-60',
                        on ? 'border-primary bg-primary-soft text-primary' : 'border-transparent bg-muted hover:bg-muted/70',
                      )}
                    >
                      <span className="text-2xl" aria-hidden>
                        {c.emoji}
                      </span>
                      <span className="text-center leading-tight">{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Diet" hint={lock ? "Diet can't be changed after posting." : undefined}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Diet">
                {Object.entries(DIETS).map(([value, d]) => {
                  const on = form.diet === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={lock}
                      onClick={() => set({ diet: value })}
                      className={cn(
                        'flex h-11 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 disabled:opacity-60',
                        on ? 'border-primary bg-primary-soft' : 'border-transparent bg-muted hover:bg-muted/70',
                      )}
                    >
                      <VegDot diet={value} /> {d.label}
                    </button>
                  )
                })}
              </div>
            </Field>
          </Section>

          <Section title="Pricing & quantity">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Original price (₹)" htmlFor="orig" error={show('original_price')}>
                <Input
                  id="orig"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.original_price}
                  aria-invalid={!!show('original_price')}
                  onChange={(e) => set({ original_price: e.target.value })}
                  className={cn(inputCls, 'tabular')}
                />
              </Field>
              <Field label="Offer price (₹)" htmlFor="price" error={livePrice}>
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  disabled={form.free}
                  value={form.free ? '0' : form.price}
                  aria-invalid={!!livePrice}
                  onChange={(e) => set({ price: e.target.value })}
                  className={cn(inputCls, 'tabular')}
                />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-success-soft px-4 py-3">
              <div>
                <Label htmlFor="free" className="text-sm font-bold text-success">
                  Make it FREE ✨
                </Label>
                <p className="text-xs text-muted-foreground">
                  {discount > 0 ? (
                    <>
                      Customers save <b className="text-success">{discount}%</b>
                    </>
                  ) : (
                    'Great for NGOs and last-minute rescues'
                  )}
                </p>
              </div>
              <Switch id="free" checked={form.free} onCheckedChange={(v) => set({ free: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Quantity"
                htmlFor="qty"
                error={show('quantity')}
                hint={editing ? 'You can only raise it.' : 'Portions available'}
              >
                <Input
                  id="qty"
                  type="number"
                  inputMode="numeric"
                  min={editing ? original?.quantity_total : 1}
                  value={form.quantity}
                  aria-invalid={!!show('quantity')}
                  onChange={(e) => set({ quantity: e.target.value })}
                  className={cn(inputCls, 'tabular')}
                />
              </Field>
              <Field label="Max per customer" htmlFor="max" error={show('max_per_user')}>
                <Input
                  id="max"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.max_per_user}
                  aria-invalid={!!show('max_per_user')}
                  onChange={(e) => set({ max_per_user: e.target.value })}
                  className={cn(inputCls, 'tabular')}
                />
              </Field>
            </div>
          </Section>

          <Section title="Pickup window">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={lock}
                  onClick={() => {
                    const [s, e] = p.get()
                    set({ pickup_start: toLocalInput(s), pickup_end: toLocalInput(e) })
                  }}
                  className="h-9 rounded-full border bg-card px-3.5 text-xs font-bold transition-all hover:border-primary hover:text-primary active:scale-95 disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="From"
                htmlFor="start"
                error={show('pickup_start')}
                hint={lock ? "Start time can't be changed after posting." : undefined}
              >
                <Input
                  id="start"
                  type="datetime-local"
                  disabled={lock}
                  value={form.pickup_start}
                  onChange={(e) => set({ pickup_start: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Until" htmlFor="end" error={show('pickup_end')}>
                <Input
                  id="end"
                  type="datetime-local"
                  value={form.pickup_end}
                  aria-invalid={!!show('pickup_end')}
                  onChange={(e) => set({ pickup_end: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          <Section title="Good to know">
            <Field label="Allergens" htmlFor="allergens" error={show('allergens')} hint="Comma separated, e.g. nuts, dairy, gluten">
              <Input
                id="allergens"
                value={form.allergens}
                onChange={(e) => set({ allergens: e.target.value })}
                className={inputCls}
              />
            </Field>
            <div>
              <label
                htmlFor="safety"
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors',
                  form.safety ? 'border-success bg-success-soft' : 'border-dashed',
                  show('safety') && 'border-destructive',
                )}
              >
                <Checkbox
                  id="safety"
                  checked={form.safety}
                  onCheckedChange={(v) => set({ safety: v === true })}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <span className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="size-4 text-success" /> Food safety promise
                  </span>
                  <span className="text-muted-foreground">
                    I confirm this food was prepared hygienically, is stored safely and is fit to eat.
                  </span>
                </span>
              </label>
              {show('safety') && (
                <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
                  {errors.safety}
                </p>
              )}
            </div>
          </Section>

          <Button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-xl text-base font-extrabold active:scale-[0.98]"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Rocket />}
            {editing ? 'Save changes' : 'Publish listing'}
          </Button>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-20">{previewBlock}</div>
        </aside>
      </div>
    </div>
  )
}

function profile(user) {
  const p = user?.seller_profile
  return {
    id: user?.id ?? 0,
    business_name: p?.business_name ?? 'Your shop',
    seller_type: p?.seller_type ?? 'restaurant',
    area: p?.area ?? '',
    city: p?.city ?? '',
    address: p?.address ?? '',
    rating_avg: p?.rating_avg ?? 0,
    rating_count: p?.rating_count ?? 0,
  }
}
