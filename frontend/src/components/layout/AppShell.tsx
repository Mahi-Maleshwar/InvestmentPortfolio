import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Chatbot from '@/components/Chatbot'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Shield,
  UserRound,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-[hsl(222_40%_7%)] to-[hsl(220_35%_5%)]">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border/60 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">WealthFlow</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Portfolio</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-inner'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0 opacity-80" />
              {item.label}
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-40" />
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border border-border/50',
                  isActive ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              <Shield className="h-4 w-4" />
              Admin
            </NavLink>
          )}
        </nav>
        <div className="border-t border-border/60 p-4 text-xs text-muted-foreground">
          Local portfolio · PostgreSQL
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:px-8">
          <div className="md:hidden flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm">WealthFlow</p>
              <p className="text-[10px] text-muted-foreground">
                {location.pathname === '/' && 'Dashboard'}
                {location.pathname === '/portfolio' && 'Portfolio'}
                {location.pathname === '/analytics' && 'Analytics'}
                {location.pathname === '/profile' && 'Profile'}
                {location.pathname === '/admin' && 'Admin'}
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">
              {location.pathname === '/' && 'Overview'}
              {location.pathname === '/portfolio' && 'Holdings'}
              {location.pathname === '/analytics' && 'Insights'}
              {location.pathname === '/profile' && 'Account'}
              {location.pathname === '/admin' && 'Administration'}
            </p>
            <p className="font-display text-lg font-semibold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-border/80 bg-card/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-[120px] truncate sm:inline">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-border bg-card">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Investor'}</div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="text-danger"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border/60 bg-card/95 px-2 py-2 backdrop-blur-md md:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Shield className="h-5 w-5" />
            Admin
          </NavLink>
        )}
      </nav>
      <Chatbot />
    </div>
  )
}
