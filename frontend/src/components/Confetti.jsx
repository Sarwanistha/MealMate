import { useMemo } from 'react'

const PIECES = ['🥗', '🌱', '🍛', '🎉', '✨', '🍎', '🥐', '💚']

/** Emoji rain. Render it when something worth celebrating happens; it removes itself visually after ~3s. */
export default function Confetti({ count = 36 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: PIECES[i % PIECES.length],
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dx: (Math.random() - 0.5) * 160,
        size: 16 + Math.random() * 18,
      })),
    [count],
  )
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute top-0 opacity-0"
          style={{ left: `${p.left}%`, fontSize: p.size, animationDelay: `${p.delay}s`, '--dx': `${p.dx}px` }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
