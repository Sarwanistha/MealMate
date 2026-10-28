import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import Reveal from '@/components/Reveal'
import { useCountUp } from '@/hooks/useCountUp'
import { useFetch } from '@/hooks/useFetch'
import { api } from '@/lib/api'
import { CATEGORY_LIST } from '@/lib/categories'
import { CATEGORY_PHOTO, SHOTS } from '@/lib/images'

const scrollToFood = () => document.getElementById('food')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/** Endless strip of what's on the menu. Constant motion, so linear; pauses on hover. */
export function Marquee() {
  const items = [...CATEGORY_LIST, ...CATEGORY_LIST]
  return (
    <div
      aria-hidden
      className="pause-on-hover -mx-4 overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] sm:mx-0"
    >
      <div className="animate-marquee flex w-max gap-3">
        {items.map((c, i) => (
          <span
            key={i}
            className="flex items-center gap-2.5 rounded-full py-1.5 pr-5 pl-1.5 text-sm font-bold text-white shadow-card"
            style={{ backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
          >
            <img src={CATEGORY_PHOTO[c.value]} alt="" loading="lazy" className="size-10 rounded-full border-2 border-white/60 object-cover" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function MealsChip() {
  const { data } = useFetch(() => api.impact(), [])
  const [n, ref] = useCountUp(data?.meals_saved ?? 0)
  if (!data) return null
  return (
    <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-hover sm:left-8">
      <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-success-soft text-xl">
        🍱
      </span>
      <div>
        <p ref={ref} className="tabular text-xl leading-none font-extrabold text-success">
          {n.toLocaleString('en-IN')}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">meals rescued so far</p>
      </div>
    </div>
  )
}

export function Problem() {
  return (
    <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-2 lg:gap-16">
      <div className="text-center lg:text-left">
        <Reveal>
          <p className="text-sm font-bold tracking-widest text-primary uppercase">The problem</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-3 text-3xl leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">
            Every night, good food goes in the <span className="text-primary">bin</span>.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
            Sellers lose what they cooked. Neighbours miss out on a good meal. MealMate connects the two before
            closing time, so nothing is thrown away.
          </p>
        </Reveal>
      </div>
      <Reveal delay={100} className="relative pb-5">
        <img
          src={SHOTS.platter}
          alt="A full thali with several curries, rice and flatbreads"
          loading="lazy"
          className="aspect-[4/3] w-full rounded-3xl object-cover shadow-card"
        />
        <MealsChip />
      </Reveal>
    </section>
  )
}

const AUDIENCES = [
  {
    emoji: '🛍️',
    title: 'Customers',
    headline: 'Eat well for less',
    photo: SHOTS.thali,
    from: '#38BDF8',
    to: '#6366F1',
    points: ['Meals and bakes at a steal, often free', 'Reserve in seconds, pay at pickup', 'Track your order with a 4-digit code'],
    cta: { label: 'Find food near me', onClick: scrollToFood },
  },
  {
    emoji: '🏪',
    title: 'Sellers',
    headline: 'Turn leftovers into income',
    photo: SHOTS.bakeryShop,
    from: '#F0583A',
    to: '#A3203A',
    points: ['List a batch in about two minutes', 'Accept orders, verify pickup with a code', 'See meals rescued and revenue on your dashboard'],
    cta: { label: 'List your surplus', to: '/register?role=seller' },
  },
  {
    emoji: '🤝',
    title: 'NGOs',
    headline: 'Collect free food for those who need it',
    photo: SHOTS.volunteers,
    from: '#2DD4BF',
    to: '#0F766E',
    points: ['Browse free listings in one tap', 'Reserve before it is gone', 'Same simple pickup code flow'],
    cta: { label: 'Register your NGO', to: '/register?role=ngo' },
  },
]

const linkCls = 'mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-[gap] duration-200 hover:gap-2.5'

export function Benefits() {
  return (
    <section className="py-4">
      <Reveal>
        <h2 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-4xl">Built for everyone at the table</h2>
        <p className="mt-1 text-muted-foreground">One marketplace, three ways to make it count.</p>
      </Reveal>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {AUDIENCES.map((a, i) => (
          <Reveal
            key={a.title}
            delay={i * 80}
            className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out)] hover:-translate-y-1 hover:shadow-hover"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={a.photo}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="flex flex-1 flex-col px-6 pb-6">
              <span
                aria-hidden
                className="-mt-7 grid size-14 place-items-center rounded-2xl text-3xl shadow-hover ring-4 ring-card"
                style={{ backgroundImage: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
              >
                {a.emoji}
              </span>
              <p className="mt-4 text-xs font-bold tracking-widest text-muted-foreground uppercase">{a.title}</p>
              <h3 className="mt-1 text-xl leading-tight font-extrabold tracking-tight">{a.headline}</h3>
              <ul className="mt-4 flex-1 space-y-2.5">
                {a.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                    <span aria-hidden className="mt-0.5 text-success">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              {a.cta.to ? (
                <Link to={a.cta.to} className={linkCls}>
                  {a.cta.label} <ArrowRight className="size-4" />
                </Link>
              ) : (
                <button onClick={a.cta.onClick} className={`${linkCls} self-start`}>
                  {a.cta.label} <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { tint: 'bg-sky-100 dark:bg-sky-500/15', emoji: '🔎', title: 'Find a deal', text: 'Browse surplus food from places around you, often at half price or free.' },
  { tint: 'bg-amber-100 dark:bg-amber-500/15', emoji: '🧺', title: 'Reserve it', text: 'Add to cart and place a reservation. You pay when you pick up.' },
  { tint: 'bg-emerald-100 dark:bg-emerald-500/15', emoji: '🔢', title: 'Pick up with your code', text: 'Show your 4-digit code at the counter and enjoy. Zero waste.' },
]

export function HowItWorks() {
  return (
    <section className="py-6">
      <Reveal>
        <h2 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-4xl">How it works</h2>
        <p className="mt-1 text-muted-foreground">From craving to collected in three steps.</p>
      </Reveal>
      <div className="relative mt-8">
        {/* connector that draws itself across the steps (desktop) */}
        <Reveal className="absolute top-7 right-[16%] left-[16%] hidden h-0.5 !translate-y-0 !scale-100 sm:block">
          <div className="draw-x h-full w-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400" />
        </Reveal>
        <ol className="relative grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 80} className="relative rounded-2xl border bg-card p-5 pt-6 text-center shadow-card">
              <span
                aria-hidden
                className={`mx-auto grid size-14 place-items-center rounded-2xl text-3xl ring-4 ring-background ${s.tint}`}
              >
                {s.emoji}
              </span>
              <span className="mt-3 block text-xs font-extrabold tracking-widest text-muted-foreground uppercase">Step {i + 1}</span>
              <h3 className="mt-1 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

const FAQS = [
  ['How does pickup work?', 'Reserve in the app, wait for the seller to accept, then go during the pickup window. Show your 4-digit code at the counter and the seller marks your order collected.'],
  ['Do I pay online?', 'No. Payment happens at pickup. The UPI option is a demo for now, so nothing is charged.'],
  ['Is the food safe to eat?', 'Sellers confirm their food was prepared hygienically and list allergens on every item. MealMate does not inspect food, so check allergens and freshness at pickup like you would anywhere else.'],
  ['Can NGOs claim free food?', 'Yes. Register as an NGO and reserve free listings with the same simple flow as everyone else.'],
  ['What if the seller does not accept my order?', 'Unanswered reservations expire automatically and the item goes back on the shelf for others. You are never charged.'],
  ['What does it cost sellers?', 'Nothing to list or sell right now. Add a batch in about two minutes and manage orders from your dashboard.'],
]

export function Faq() {
  return (
    <section className="mx-auto w-full max-w-3xl py-6">
      <Reveal>
        <h2 className="text-center text-2xl font-extrabold tracking-[-0.02em] sm:text-4xl">Questions, answered</h2>
      </Reveal>
      <Reveal delay={80} className="mt-6 rounded-3xl border bg-card px-5 shadow-card sm:px-7">
        <Accordion type="single" collapsible>
          {FAQS.map(([q, a], i) => (
            <AccordionItem key={q} value={`q${i}`}>
              <AccordionTrigger className="text-base font-bold">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  )
}

export function FinalCta() {
  return (
    <Reveal
      as="section"
      className="relative isolate overflow-hidden rounded-3xl bg-brand-deep p-8 text-center text-white sm:p-14"
    >
      <img src={SHOTS.sweets} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover opacity-20 mix-blend-luminosity" />
      <div className="dots absolute inset-0 -z-10 opacity-40" />
      <span aria-hidden className="animate-float absolute top-4 left-[8%] -z-10 text-6xl opacity-40" style={{ '--r': '-10deg' }}>
        🥗
      </span>
      <span aria-hidden className="animate-float absolute right-[8%] bottom-4 -z-10 text-7xl opacity-40" style={{ '--r': '12deg', animationDelay: '1.5s' }}>
        🍛
      </span>
      <h2 className="mx-auto max-w-2xl text-3xl leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">
        Good food should not go to waste. <span className="text-shine">Rescue some tonight.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-md text-white/75">Fresh surplus is listed every day by sellers near you.</p>
      <Button onClick={scrollToFood} className="mt-7 h-13 rounded-2xl px-8 text-base font-extrabold shadow-hover">
        Find food near me
      </Button>
      <p className="mt-5 text-sm text-white/70">
        Selling surplus?{' '}
        <Link to="/register?role=seller" className="font-bold text-white underline underline-offset-4">
          List it in 2 minutes
        </Link>
      </p>
    </Reveal>
  )
}

export function Footer() {
  return (
    <footer className="mt-4 flex flex-col items-center gap-2 border-t py-8 text-center text-sm text-muted-foreground">
      <Logo />
      <p>Eat well. Waste less. Made with 💚 for a hunger-free, waste-free city.</p>
      <p className="text-xs">
        Photos from{' '}
        <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Unsplash
        </a>{' '}
        · &copy; {new Date().getFullYear()} MealMate
      </p>
    </footer>
  )
}
