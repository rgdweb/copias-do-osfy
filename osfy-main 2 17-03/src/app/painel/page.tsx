'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Wrench, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowRight,
  Plus,
  ShoppingCart,
  Wallet,
  Tag,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS, type StatusOS } from '@/types'
import { formatCurrency, formatDateTime, getRelativeTime } from '@/lib/utils'

interface DashboardStats {
  totalOs: number
  osAbertas: number
  osEmManutencao: number
  osAguardandoPeca: number
  osProntas: number
  osEntregues: number
  clientesCount: number
  faturamentoMes: number
  // PDV Stats
  produtosCount: number
  vendasHoje: number
  totalVendasHoje: number
  caixaAberto: boolean
}

interface UltimaOS {
  id: string
  numeroOs: number
  equipamento: string
  status: string
  dataCriacao: string
  cliente: {
    nome: string
  }
}

export default function PainelPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ultimasOs, setUltimasOs] = useState<UltimaOS[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/painel/dashboard')
        const data = await response.json()
        
        if (data.success) {
          setStats(data.stats)
          setUltimasOs(data.ultimasOs)
        }
      } catch {
        // Silently handle error
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statusCards = [
    {
      title: 'OS em Aberto',
      value: stats?.osAbertas || 0,
      icon: Clock,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Em Manutenção',
      value: stats?.osEmManutencao || 0,
      icon: Wrench,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    {
      title: 'Aguardando Peça',
      value: stats?.osAguardandoPeca || 0,
      icon: Package,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Prontas',
      value: stats?.osProntas || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/painel/os/nova" className="flex-1 sm:flex-none">
          <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-5 h-5" />
            Nova Ordem de Serviço
          </Button>
        </Link>
        <Link href="/painel/os" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto gap-2">
            Ver Todas as OS
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* PDV Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/painel/pdv">
          <Card className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stats?.caixaAberto ? 'bg-green-50' : 'bg-red-50'}`}>
                  <Wallet className={`w-6 h-6 ${stats?.caixaAberto ? 'text-green-700' : 'text-red-700'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Caixa</p>
                  <p className={`text-lg font-bold ${stats?.caixaAberto ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.caixaAberto ? 'Aberto' : 'Fechado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/painel/pdv/produtos">
          <Card className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-50">
                  <Package className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats?.produtosCount || 0}</p>
                  <p className="text-sm text-slate-500">Produtos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/painel/pdv/vendas">
          <Card className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <ShoppingCart className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats?.vendasHoje || 0}</p>
                  <p className="text-sm text-slate-500">Vendas Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <DollarSign className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(stats?.totalVendasHoje || 0)}
                </p>
                <p className="text-sm text-slate-500">Total Hoje (PDV)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <Card key={card.title} className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-sm text-slate-500">{card.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Total de OS</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalOs || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Desde o início</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Clientes</CardDescription>
            <CardTitle className="text-3xl">{stats?.clientesCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Cadastrados</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Faturamento do Mês</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {formatCurrency(stats?.faturamentoMes || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span>OS pagas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas OS */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimas Ordens de Serviço</CardTitle>
              <CardDescription>As OS mais recentes da sua loja</CardDescription>
            </div>
            <Link href="/painel/os">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {ultimasOs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhuma ordem de serviço cadastrada</p>
              <Link href="/painel/os/nova">
                <Button variant="link" className="mt-2 text-emerald-600">
                  Criar primeira OS
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ultimasOs.map((os) => (
                <Link
                  key={os.id}
                  href={`/painel/os/${os.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="font-mono font-bold text-slate-700">
                        #{os.numeroOs}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{os.cliente.nome}</p>
                      <p className="text-sm text-slate-500">{os.equipamento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-slate-500">{getRelativeTime(os.dataCriacao)}</p>
                    </div>
                    <Badge className={`${STATUS_COLORS[os.status as StatusOS]} text-white`}>
                      {STATUS_LABELS[os.status as StatusOS]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
