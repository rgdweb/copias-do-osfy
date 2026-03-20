'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Gift, Clock, AlertTriangle, CheckCircle, XCircle, MoreVertical,
  Calendar, CreditCard, Search, Filter, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Loja {
  id: string
  nome: string
  slug: string
  responsavel: string
  email: string
  telefone: string
  status: string
  plano: string
  precoPlano: number
  trialAte: string | null
  trialUsado: boolean
  criadoEm: string
  expiraEm: string | null
  _count?: {
    faturas: number
  }
}

interface Stats {
  totalLojas: number
  emTrial: number
  trialExpirandoHoje: number
  trialExpirando7Dias: number
  ativas: number
  pendentes: number
  atrasadas: number
  bloqueadas: number
}

export default function GerenciarTrialsPage() {
  const [loading, setLoading] = useState(true)
  const [lojas, setLojas] = useState<Loja[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'trial' | 'expirando' | 'pendentes' | 'atrasados'>('todos')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  
  // Estados do modal
  const [modalAberto, setModalAberto] = useState(false)
  const [lojaSelecionada, setLojaSelecionada] = useState<Loja | null>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    carregarLojas()
  }, [filtro, pagina])

  const carregarLojas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        filtro,
        pagina: pagina.toString(),
        busca
      })
      
      const response = await fetch(`/api/superadmin/trials?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setLojas(data.lojas)
        setStats(data.stats)
        setTotalPaginas(data.totalPaginas)
      }
    } catch (error) {
      toast.error('Erro ao carregar lojas')
    } finally {
      setLoading(false)
    }
  }

  const buscarLojas = () => {
    setPagina(1)
    carregarLojas()
  }

  const estenderTrial = async (dias: number) => {
    if (!lojaSelecionada) return
    
    setProcessando(true)
    try {
      const response = await fetch('/api/superadmin/trials/estender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lojaId: lojaSelecionada.id,
          dias
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Trial estendido por ${dias} dias!`)
        setModalAberto(false)
        carregarLojas()
      } else {
        toast.error(data.error || 'Erro ao estender trial')
      }
    } catch (error) {
      toast.error('Erro ao estender trial')
    } finally {
      setProcessando(false)
    }
  }

  const ativarLoja = async () => {
    if (!lojaSelecionada) return
    
    setProcessando(true)
    try {
      const response = await fetch('/api/superadmin/trials/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lojaId: lojaSelecionada.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Loja ativada com sucesso!')
        setModalAberto(false)
        carregarLojas()
      } else {
        toast.error(data.error || 'Erro ao ativar loja')
      }
    } catch (error) {
      toast.error('Erro ao ativar loja')
    } finally {
      setProcessando(false)
    }
  }

  const calcularDiasRestantes = (trialAte: string | null) => {
    if (!trialAte) return 0
    const agora = new Date()
    const fim = new Date(trialAte)
    const diffMs = fim.getTime() - agora.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (loja: Loja) => {
    const diasRestantes = calcularDiasRestantes(loja.trialAte)
    
    if (diasRestantes > 0) {
      return (
        <Badge className="bg-amber-100 text-amber-800">
          <Gift className="w-3 h-3 mr-1" />
          Trial ({diasRestantes}d)
        </Badge>
      )
    }
    
    switch (loja.status) {
      case 'ativa':
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativa
          </Badge>
        )
      case 'pendente':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      case 'bloqueada':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Bloqueada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{loja.status}</Badge>
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gerenciar Trials</h1>
        <p className="text-slate-500">Controle os períodos de teste e status das lojas</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Lojas</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalLojas}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-600">Em Trial</p>
              <p className="text-2xl font-bold text-amber-700">{stats.emTrial}</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-sm text-orange-600">Expirando Hoje</p>
              <p className="text-2xl font-bold text-orange-700">{stats.trialExpirandoHoje}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-600">Expirando 7 dias</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.trialExpirando7Dias}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-600">Ativas</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.ativas}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Pendentes</p>
              <p className="text-2xl font-bold text-blue-700">{stats.pendentes}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Atrasadas</p>
              <p className="text-2xl font-bold text-red-700">{stats.atrasadas}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, email ou slug..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarLojas()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filtro === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('todos')}
                className={filtro === 'todos' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Todos
              </Button>
              <Button
                variant={filtro === 'trial' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('trial')}
                className={filtro === 'trial' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                <Gift className="w-4 h-4 mr-1" />
                Em Trial
              </Button>
              <Button
                variant={filtro === 'expirando' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('expirando')}
                className={filtro === 'expirando' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Expirando
              </Button>
              <Button
                variant={filtro === 'pendentes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('pendentes')}
                className={filtro === 'pendentes' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Pendentes
              </Button>
              <Button
                variant={filtro === 'atrasados' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('atrasados')}
                className={filtro === 'atrasados' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Atrasados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Lojas */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : lojas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Nenhuma loja encontrada
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {lojas.map((loja) => {
                const diasRestantes = calcularDiasRestantes(loja.trialAte)
                
                return (
                  <div
                    key={loja.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {loja.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{loja.nome}</p>
                          {getStatusBadge(loja)}
                        </div>
                        <p className="text-sm text-slate-500">{loja.email}</p>
                        {diasRestantes > 0 && (
                          <p className="text-xs text-amber-600">
                            Trial termina em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-slate-900">
                          R$ {loja.precoPlano?.toFixed(2).replace('.', ',') || '0,00'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {loja.plano === 'anual' ? 'Anual' : 'Mensal'}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/lojas/${loja.id}`}>
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setLojaSelecionada(loja)
                              setModalAberto(true)
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Estender Trial
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setLojaSelecionada(loja)
                              setModalAberto(true)
                            }}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Gerenciar Pagamento
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setLojaSelecionada(loja)
                              setModalAberto(true)
                            }}
                            className="text-emerald-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Ativar Loja
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Ações */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lojaSelecionada?.nome}</DialogTitle>
            <DialogDescription>
              Gerenciar trial e status da loja
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Informações da Loja</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Email:</strong> {lojaSelecionada?.email}</p>
                <p><strong>Plano:</strong> {lojaSelecionada?.plano}</p>
                <p><strong>Status:</strong> {lojaSelecionada?.status}</p>
                <p><strong>Trial:</strong> {lojaSelecionada?.trialAte ? new Date(lojaSelecionada.trialAte).toLocaleDateString('pt-BR') : 'Não definido'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Estender Trial</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => estenderTrial(7)} disabled={processando}>
                  +7 dias
                </Button>
                <Button variant="outline" onClick={() => estenderTrial(15)} disabled={processando}>
                  +15 dias
                </Button>
                <Button variant="outline" onClick={() => estenderTrial(30)} disabled={processando}>
                  +30 dias
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col gap-2">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={ativarLoja}
              disabled={processando}
            >
              {processando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Ativar Loja Manualmente
            </Button>
            <Button variant="outline" onClick={() => setModalAberto(false)} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
