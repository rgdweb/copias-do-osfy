'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Wrench,
  Users,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  ExternalLink,
  ShoppingCart,
  Package,
  Tag,
  CreditCard,
  Wallet,
  AlertTriangle,
  Calendar,
  QrCode,
  FileText,
  Copy,
  User
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AvisoPendencia } from '@/components/painel/AvisoPendencia'

const menuItems = [
  { href: '/painel', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/painel/os', label: 'Ordens de Serviço', icon: Wrench },
  { href: '/painel/clientes', label: 'Clientes', icon: Users },
  { href: '/painel/pagamento', label: 'Pagamento', icon: CreditCard },
  { href: '/painel/faturas', label: 'Faturas', icon: FileText },
  { href: '/painel/configuracoes', label: 'Configurações', icon: Settings },
]

const pdvMenuItems = [
  { href: '/painel/pdv', label: 'Frente de Caixa', icon: ShoppingCart },
  { href: '/painel/pdv/produtos', label: 'Produtos', icon: Package },
  { href: '/painel/pdv/categorias', label: 'Categorias', icon: Tag },
  { href: '/painel/pdv/vendas', label: 'Vendas', icon: CreditCard },
]

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ nome: string; email: string; lojaId: string; foto?: string | null } | null>(null)
  const [loja, setLoja] = useState<{ nome: string; slug: string } | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados para diálogo de logout com caixa aberto
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<{ id: string; saldoInicial: number } | null>(null)
  const [processandoLogout, setProcessandoLogout] = useState(false)
  
  // Estados para pendências/faturas
  const [pendencia, setPendencia] = useState<{
    temPendencia: boolean
    faturasVencidas: number
    valorTotal: number
    proximaFatura?: {
      id: string
      valor: number
      dataVencimento: string
      codigoPix?: string
      qrCodePix?: string
      linkBoleto?: string
      linkPagamento?: string
    }
  } | null>(null)
  const [showPendenciaModal, setShowPendenciaModal] = useState(false)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated || !data.user?.lojaId) {
          router.push('/')
        } else {
          setUser(data.user)
          // Buscar dados da loja, pendências e status de pagamento
          Promise.all([
            fetch('/api/painel/dashboard').then(r => r.json()),
            fetch('/api/painel/faturas/pendencias').then(r => r.json().catch(() => ({ success: false }))),
            fetch('/api/painel/status-pagamento').then(r => r.json().catch(() => ({ success: false })))
          ])
            .then(([lojaData, pendenciasData, statusData]) => {
              setLoja({ nome: lojaData.loja?.nome || 'Minha Loja', slug: lojaData.loja?.slug || '' })
              if (pendenciasData?.success) {
                setPendencia(pendenciasData)
              }
              
              // Verificar se está bloqueado e redirecionar
              if (statusData?.success && statusData.status === 'bloqueado') {
                // Páginas permitidas mesmo quando bloqueado
                const paginasPermitidas = ['/painel/bloqueado', '/painel/pagamento', '/painel/faturas']
                if (!paginasPermitidas.some(p => pathname.startsWith(p))) {
                  router.push('/painel/bloqueado')
                  return
                }
              }
              
              setLoading(false)
            })
            .catch(() => setLoading(false))
        }
      })
      .catch(() => router.push('/'))
  }, [router, pathname])

  // Verificar se há caixa aberto antes de deslogar
  const handleLogoutClick = async () => {
    try {
      const res = await fetch('/api/painel/pdv/caixa')
      const data = await res.json()
      
      if (data.success && data.caixaAberto) {
        // Há caixa aberto - mostrar diálogo de confirmação
        setCaixaAberto(data.caixaAberto)
        setShowLogoutDialog(true)
      } else {
        // Sem caixa aberto - deslogar diretamente
        await performLogout()
      }
    } catch {
      // Em caso de erro, deslogar mesmo assim
      await performLogout()
    }
  }

  const performLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  // Fechar caixa e deslogar
  const fecharCaixaELogout = async () => {
    if (!caixaAberto) return
    
    setProcessandoLogout(true)
    try {
      // Fechar o caixa
      const res = await fetch('/api/painel/pdv/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caixaId: caixaAberto.id,
          saldoFinal: caixaAberto.saldoInicial,
          observacao: 'Fechado automaticamente ao sair do sistema'
        })
      })
      
      if (res.ok) {
        toast.success('Caixa fechado com sucesso')
      }
      
      // Deslogar
      await performLogout()
    } catch {
      toast.error('Erro ao fechar caixa, mas você será deslogado')
      await performLogout()
    } finally {
      setProcessandoLogout(false)
      setShowLogoutDialog(false)
    }
  }

  // Deslogar sem fechar caixa
  const logoutSemFechar = async () => {
    setShowLogoutDialog(false)
    await performLogout()
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === href || (href !== '/painel' && pathname.startsWith(href))
    
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-emerald-100 text-emerald-700 font-medium' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
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
          <div className="flex h-16 shrink-0 items-center border-b border-slate-200 -mx-6 px-6">
            <Link href="/painel" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{loja?.nome || 'Minha Loja'}</p>
                <p className="text-xs text-slate-500">TecOS</p>
              </div>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-1">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} />
                </li>
              ))}
            </ul>

            {/* PDV Section */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                PDV - Ponto de Venda
              </p>
              <ul className="space-y-1">
                {pdvMenuItems.map((item) => (
                  <li key={item.href}>
                    <NavLink {...item} />
                  </li>
                ))}
              </ul>
            </div>

            {loja?.slug && (
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
            )}
          </nav>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{loja?.nome || 'Minha Loja'}</p>
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
                  
                  {/* PDV Section Mobile */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      PDV - Ponto de Venda
                    </p>
                    <ul className="space-y-1">
                      {pdvMenuItems.map((item) => (
                        <li key={item.href}>
                          <NavLink {...item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-slate-900">
                {[...menuItems, ...pdvMenuItems].find(item => pathname === item.href || (item.href !== '/painel' && pathname.startsWith(item.href)))?.label || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      {user.foto ? (
                        <AvatarImage src={user.foto} alt={user.nome} />
                      ) : null}
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {user.nome.charAt(0).toUpperCase()}
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
                    <Link href="/painel/perfil">
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/painel/configuracoes">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogoutClick} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Banner de Pendência - Trial, Pendente, Atrasado */}
        <AvisoPendencia />

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Diálogo de confirmação de logout com caixa aberto */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Caixa Aberto Detectado
            </DialogTitle>
            <DialogDescription>
              Há um caixa aberto no momento. Deseja fechá-lo antes de sair?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Caixa em Aberto</p>
                <p className="text-sm text-amber-600">
                  Saldo inicial: R$ {caixaAberto?.saldoInicial?.toFixed(2) || '0,00'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              onClick={logoutSemFechar}
              disabled={processandoLogout}
              className="w-full sm:w-auto"
            >
              Sair sem Fechar
            </Button>
            <Button 
              onClick={fecharCaixaELogout}
              disabled={processandoLogout}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              {processandoLogout ? 'Processando...' : 'Fechar Caixa e Sair'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pendência - Fatura Vencida */}
      <Dialog open={showPendenciaModal} onOpenChange={setShowPendenciaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Calendar className="w-5 h-5" />
              Seu boleto venceu!
            </DialogTitle>
            <DialogDescription>
              Realize o pagamento para continuar utilizando o sistema sem interrupções.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Valor</p>
                  <p className="text-xl font-bold text-red-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendencia?.valorTotal || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Vencimento</p>
                  <p className="text-lg font-medium">
                    {pendencia?.proximaFatura?.dataVencimento 
                      ? new Date(pendencia.proximaFatura.dataVencimento).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center">
                {pendencia?.proximaFatura?.qrCodePix ? (
                  <img 
                    src={`data:image/png;base64,${pendencia.proximaFatura.qrCodePix}`}
                    alt="QR Code PIX"
                    className="w-32 h-32 mx-auto mb-2"
                  />
                ) : (
                  <QrCode className="w-24 h-24 mx-auto mb-2 text-slate-400" />
                )}
                <p className="text-sm text-slate-500">QR Code PIX</p>
              </div>
            </div>

            {pendencia?.proximaFatura?.codigoPix && (
              <div className="bg-slate-100 p-3 rounded-lg">
                <code className="text-xs break-all text-slate-600">
                  {pendencia.proximaFatura.codigoPix.substring(0, 50)}...
                </code>
              </div>
            )}

            <p className="text-center text-sm text-slate-500">
              Clique em &quot;Pagar Agora&quot; para ver todas as opções de pagamento
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => {
                setShowPendenciaModal(false)
                router.push('/painel/pagamento')
              }}
            >
              <CreditCard className="w-4 h-4" />
              Ver Faturas
            </Button>
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => {
                setShowPendenciaModal(false)
                router.push('/painel/pagamento')
              }}
            >
              <FileText className="w-4 h-4" />
              Pagar Agora
            </Button>
          </DialogFooter>
          
          <div className="text-center">
            <Button
              variant="ghost"
              className="text-slate-500"
              onClick={() => setShowPendenciaModal(false)}
            >
              ← Ir para o Sistema
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
