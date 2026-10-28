import { useState } from 'react'
import { categoryMeta } from '@/lib/categories'
import { foodPhoto } from '@/lib/images'
import { cn } from '@/lib/utils'

/**
 * Food photo tile. Pass `item` (listing / order item) to show its photo; the gradient + emoji tile is the
 * fallback while loading or if the photo fails. Children render as overlays (chips, ribbons).
 */
export default function FoodTile({ item, category, className, emojiClassName, children }) {
  const [failed, setFailed] = useState(false)
  const { emoji, from, to } = categoryMeta(category ?? item?.category)
  const photo = item && !failed ? foodPhoto(item) : null

  return (
    <div
      className={cn('group/tile relative isolate overflow-hidden', className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {photo ? (
        <>
          <img
            src={photo}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover/tile:scale-105"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
        </>
      ) : (
        <>
          <div className="dots absolute inset-0 -z-10 opacity-60" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -bottom-6 -z-10 -rotate-12 text-[8rem] leading-none opacity-20 select-none"
          >
            {emoji}
          </span>
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 flex items-center justify-center text-6xl drop-shadow-lg transition-transform duration-300 select-none group-hover/tile:scale-110 group-hover/tile:rotate-3',
              emojiClassName,
            )}
          >
            {emoji}
          </span>
        </>
      )}
      {children}
    </div>
  )
}
