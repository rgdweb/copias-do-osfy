'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Wrench,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AuthUser } from '@/lib/auth/auth'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface PainelLayoutProps {
  children: React.ReactNode
  user: AuthUser
  loja: {
    id: string
    nome: string
    slug: string
    logo: string | null
  }
}

const menuItems = [
  { href: '/painel', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/painel/os', label: 'Ordens de Serviço', icon: Wrench },
  { href: '/painel/clientes', label: 'Clientes', icon: Users },
  { href: '/painel/configuracoes', label: 'Configurações', icon: Settings },
]

export function PainelLayout({ children, user, loja }: PainelLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === href || (href !== '/painel' && pathname.startsWith(href))
    
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
          ${isActive 
            ? 'bg-emerald-100 text-emerald-700 font-medium' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-slate-200 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b border-slate-200 -mx-6 px-6">
            <Link href="/painel" className="flex items-center gap-3">
              {loja.logo ? (
                <img src={loja.logo} alt={loja.nome} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">{loja.nome}</p>
                <p className="text-xs text-slate-500">TecOS</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-1">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} />
                </li>
              ))}
            </ul>

            {/* Link público */}
            <div className="mt-auto pt-4 border-t border-slate-200">
              <a
                href={`/loja/${loja.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Ver página pública</span>
              </a>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
                  {loja.logo ? (
                    <img src={loja.logo} alt={loja.nome} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{loja.nome}</p>
                    <p className="text-xs text-slate-500">TecOS</p>
                  </div>
                </div>
                <nav className="flex-1 p-4">
                  <ul className="space-y-1">
                    {menuItems.map((item) => (
                      <li key={item.href}>
                        <NavLink {...item} />
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="p-4 border-t border-slate-200">
                  <a
                    href={`/loja/${loja.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Ver página pública</span>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="h-6 w-px bg-slate-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-slate-900">
                {menuItems.find(item => pathname === item.href || (item.href !== '/painel' && pathname.startsWith(item.href)))?.label || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  0
                </span>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" />
                      <AvatarFallback className={getAvatarColor(user.nome)}>
                        {getInitials(user.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-slate-700">
                      {user.nome}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user.nome}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/painel/configuracoes">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
