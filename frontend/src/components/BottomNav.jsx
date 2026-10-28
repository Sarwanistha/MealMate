import { NavLink } from 'react-router-dom'
import { ClipboardList, Home, LayoutDashboard, Package, Search, Store, User, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const buyerTabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/?focus=search', label: 'Search', icon: Search, end: true },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/login', authTo: '/orders', label: 'Profile', icon: User },
]

const sellerTabs = [
  { to: '/seller', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/seller/listings', label: 'Listings', icon: UtensilsCrossed },
  { to: '/seller/orders', label: 'Orders', icon: ClipboardList },
  { to: '/seller/profile', label: 'Shop', icon: Store },
]

/** Fixed bottom tab bar, mobile only. Role-aware. */
export default function BottomNav() {
  const { user, isSeller } = useAuth()
  const tabs = isSeller ? sellerTabs : buyerTabs

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ to, authTo, label, icon: Icon, end }) => (
          <li key={label}>
            <NavLink
              to={user && authTo ? authTo : to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground transition-colors',
                  isActive && label !== 'Search' && 'text-primary',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
