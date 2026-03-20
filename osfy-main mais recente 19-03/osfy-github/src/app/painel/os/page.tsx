'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter,
  Wrench,
  Eye,
  Edit,
  MoreHorizontal,
  Clock,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { STATUS_LABELS, STATUS_COLORS, type StatusOS } from '@/types'
import { formatDateTime, getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

interface OrdemServico {
  id: string
  numeroOs: number
  equipamento: string
  marca: string | null
  modelo: string | null
  problema: string
  status: string
  dataCriacao: string
  cliente: {
    id: string
    nome: string
    telefone: string
  }
  tecnico: {
    id: string
    nome: string
  } | null
  fotos: { id: string }[]
  _count: {
    fotos: number
    historico: number
  }
}

const statusFilters = [
  { value: 'todos', label: 'Todos os Status' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação' },
  { value: 'aguardando_peca', label: 'Aguardando Peça' },
  { value: 'em_manutencao', label: 'Em Manutenção' },
  { value: 'em_testes', label: 'Em Testes' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'entregue', label: 'Entregue' },
]

export default function OrdensServicoPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')

  useEffect(() => {
    fetchOrdens()
  }, [statusFilter])

  async function fetchOrdens() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'todos') {
        params.set('status', statusFilter)
      }
      if (busca) {
        params.set('busca', busca)
      }

      const response = await fetch(`/api/painel/os?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrdens(data.ordens)
      }
    } catch {
      toast.error('Erro ao carregar ordens de serviço')
    } finally {
      setLoading(false)
    }
  }

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrdens()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ordens de Serviço</h1>
          <p className="text-slate-500">Gerencie todas as ordens de serviço da sua loja</p>
        </div>
        <Link href="/painel/os/nova">
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-5 h-5" />
            Nova OS
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleBusca} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por cliente, telefone ou OS..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de OS */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse border-slate-200">
              <CardContent className="pt-6">
                <div className="h-16 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ordens.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Nenhuma ordem de serviço encontrada
            </h3>
            <p className="text-slate-500 mb-6">
              {busca || statusFilter !== 'todos'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira ordem de serviço'}
            </p>
            <Link href="/painel/os/nova">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="w-5 h-5" />
                Criar OS
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordens.map((os) => (
            <Card key={os.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-slate-700 text-lg">
                      #{os.numeroOs}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{os.cliente.nome}</h3>
                        <p className="text-sm text-slate-500">{os.cliente.telefone}</p>
                      </div>
                      <Badge className={`${STATUS_COLORS[os.status as StatusOS]} text-white flex-shrink-0`}>
                        {STATUS_LABELS[os.status as StatusOS]}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-slate-700">
                        {os.equipamento}
                        {os.marca && ` - ${os.marca}`}
                        {os.modelo && ` ${os.modelo}`}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{getRelativeTime(os.dataCriacao)}</span>
                      {os._count.fotos > 0 && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{os._count.fotos} foto(s)</span>
                        </>
                      )}
                    </div>
                    
                    <p className="mt-2 text-sm text-slate-600 line-clamp-1">
                      {os.problema}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/painel/os/${os.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/painel/os/${os.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/os/${os.id}`} target="_blank">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver como cliente
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
