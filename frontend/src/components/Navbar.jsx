import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Package, Search, ShoppingBag, Store, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import Logo from '@/components/Logo'
import LocationChip from '@/components/LocationChip'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { ROLE_LABEL } from '@/lib/categories'
import { initials } from '@/lib/format'

export default function Navbar() {
  const { user, isSeller, logout } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const submit = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/')
  }


  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[2000px] items-center gap-3 px-4 sm:px-6 lg:px-10 xl:px-14">
        <Logo to={isSeller ? '/seller' : '/'} />

        {!isSeller && <LocationChip className="hidden md:flex" />}

        {!isSeller ? (
          <form onSubmit={submit} className="relative mx-2 hidden max-w-md flex-1 md:block">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search biryani, bakery, free food…"
              className="h-10 rounded-full bg-secondary pl-10"
            />
          </form>
        ) : (
          <nav className="mx-4 hidden items-center gap-1 md:flex">
            {[
              ['/seller', 'Dashboard'],
              ['/seller/orders', 'Orders'],
              ['/seller/listings', 'Listings'],
            ].map(([to, label]) => (
              <Button key={to} asChild variant="ghost" className="rounded-full font-semibold">
                <Link to={to}>{label}</Link>
              </Button>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          {!isSeller && (
            <Button variant="ghost" size="icon" className="relative" aria-label="Open cart" onClick={cart.openCart}>
              <ShoppingBag className="size-5" />
              {cart.count > 0 && (
                <span
                  key={cart.count}
                  className="animate-pop absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                >
                  {cart.count}
                </span>
              )}
            </Button>
          )}

          {!user ? (
            <div className="ml-1 flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden rounded-full font-semibold sm:inline-flex">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full px-5 font-bold">
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary font-bold text-primary-foreground">{initials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>
                  <div className="font-bold">{user.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {ROLE_LABEL[user.role]} · {user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isSeller ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/seller')}>
                      <LayoutDashboard /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/seller/profile')}>
                      <Store /> Shop profile
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Package /> My orders
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <LogOut /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!user && <User className="hidden" />}
        </div>
      </div>
    </header>
  )
}
