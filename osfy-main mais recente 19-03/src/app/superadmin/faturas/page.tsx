'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Search, Filter, Loader2, CheckCircle, Clock, XCircle,
  AlertTriangle, Calendar, DollarSign, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Fatura {
  id: string
  numeroFatura: number
  valor: number
  status: string
  formaPagamento: string | null
  dataVencimento: string
  dataPagamento: string | null
  referencia: string | null
  loja: {
    id: string
    nome: string
    email: string
  }
}

interface Stats {
  total: number
  pendentes: number
  pagas: number
  vencidas: number
  valorTotalMes: number
}

export default function FaturasPage() {
  const [loading, setLoading] = useState(true)
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'pagas' | 'vencidas'>('todas')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  useEffect(() => {
    carregarFaturas()
  }, [filtro, pagina])

  const carregarFaturas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        filtro,
        pagina: pagina.toString(),
        busca
      })
      
      const response = await fetch(`/api/superadmin/faturas?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setFaturas(data.faturas)
        setStats(data.stats)
        setTotalPaginas(data.totalPaginas)
      }
    } catch (error) {
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
    }
  }

  const buscarFaturas = () => {
    setPagina(1)
    carregarFaturas()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paga':
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paga
          </Badge>
        )
      case 'pendente':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      case 'vencida':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Vencida
          </Badge>
        )
      case 'cancelada':
        return (
          <Badge className="bg-slate-100 text-slate-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Faturas</h1>
        <p className="text-slate-500">Gerencie todas as faturas do sistema</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Pendentes</p>
              <p className="text-2xl font-bold text-blue-700">{stats.pendentes}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-600">Pagas</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.pagas}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-700">{stats.vencidas}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Mês</p>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {stats.valorTotalMes?.toFixed(2).replace('.', ',') || '0,00'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por loja..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarFaturas()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtro === 'todas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('todas')}
                className={filtro === 'todas' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Todas
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
                variant={filtro === 'pagas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('pagas')}
                className={filtro === 'pagas' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Pagas
              </Button>
              <Button
                variant={filtro === 'vencidas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('vencidas')}
                className={filtro === 'vencidas' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Vencidas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : faturas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Nenhuma fatura encontrada
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {faturas.map((fatura) => (
                <div
                  key={fatura.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          Fatura #{fatura.numeroFatura}
                        </p>
                        {getStatusBadge(fatura.status)}
                      </div>
                      <p className="text-sm text-slate-500">
                        {fatura.loja.nome} • {fatura.referencia || 'Sem referência'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      R$ {fatura.valor.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {fatura.status === 'paga' 
                        ? `Paga em ${fatura.dataPagamento ? new Date(fatura.dataPagamento).toLocaleDateString('pt-BR') : '-'}`
                        : `Vence em ${new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
              ))}
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
    </div>
  )
}
