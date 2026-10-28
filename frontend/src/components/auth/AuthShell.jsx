import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { SHOTS } from '@/lib/images'

const COLLAGE = [
  { e: '🍛', cls: 'top-[8%] left-[10%] text-7xl', r: '-8deg', d: '0s' },
  { e: '🥐', cls: 'top-[14%] right-[12%] text-8xl', r: '10deg', d: '1s' },
  { e: '🍮', cls: 'top-[44%] left-[6%] text-6xl', r: '12deg', d: '2s' },
  { e: '🥭', cls: 'top-[50%] right-[8%] text-7xl', r: '-10deg', d: '1.5s' },
  { e: '🌮', cls: 'bottom-[10%] left-[22%] text-6xl', r: '6deg', d: '0.5s' },
  { e: '🧋', cls: 'bottom-[8%] right-[24%] text-6xl', r: '-6deg', d: '2.5s' },
]

const BULLETS = [
  ['🍱', 'Meals up to 70% off, or free'],
  ['🌍', 'Every pickup keeps food out of the bin'],
  ['🤝', 'Sellers and NGOs, one friendly marketplace'],
]

/** Full-screen split layout: gradient brand panel (lg+) and the form on the right. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand-deep p-10 text-white lg:flex">
        <img src={SHOTS.platter} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-25 mix-blend-luminosity" />
        <div className="dots absolute inset-0 -z-10 opacity-40" />
        {COLLAGE.map((c) => (
          <span
            key={c.e}
            aria-hidden
            className={`animate-float pointer-events-none absolute -z-10 opacity-45 select-none ${c.cls}`}
            style={{ '--r': c.r, animationDelay: c.d }}
          >
            {c.e}
          </span>
        ))}
        <Logo light />
        <div>
          <h2 className="text-5xl leading-[1.05] font-extrabold tracking-tight">Eat well.<br />Waste less.</h2>
          <ul className="mt-8 space-y-3">
            {BULLETS.map(([emoji, text]) => (
              <li key={text} className="flex items-center gap-3 text-base font-semibold">
                <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-white/20 text-xl backdrop-blur">
                  {emoji}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/80">&copy; {new Date().getFullYear()} MealMate</p>
      </aside>

      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="animate-rise mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  )
}
