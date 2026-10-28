import { useCountUp } from '@/hooks/useCountUp'
import { useFetch } from '@/hooks/useFetch'
import { api } from '@/lib/api'

function Stat({ emoji, value, label, prefix = '' }) {
  const [n, ref] = useCountUp(value)
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 px-2 py-4 text-center">
      <span aria-hidden className="text-2xl">
        {emoji}
      </span>
      <span ref={ref} className="tabular text-xl font-extrabold text-success sm:text-3xl">
        {prefix}
        {n.toLocaleString('en-IN')}
      </span>
      <span className="text-[11px] font-semibold text-muted-foreground sm:text-sm">{label}</span>
    </div>
  )
}

export default function ImpactStrip() {
  const { data } = useFetch(() => api.impact(), [])
  if (!data) return null
  return (
    <section
      aria-label="Community impact"
      className="animate-rise relative -mt-7 mb-2 flex divide-x rounded-2xl border bg-card shadow-card [box-shadow:var(--shadow-card),inset_0_1px_0_rgb(255_255_255/0.7)] dark:[box-shadow:var(--shadow-card)] sm:mx-8"
    >
      <Stat emoji="🍱" value={data.meals_saved} label="meals rescued" />
      <Stat emoji="🌍" value={Math.round(data.kg_co2_saved)} label="kg CO₂ saved" />
      <Stat emoji="💰" value={data.money_saved} label="saved by eaters" prefix="₹" />
    </section>
  )
}
