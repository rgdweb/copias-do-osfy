'use client'

import { useState } from 'react'
import { Loja } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Store,
  CheckCircle,
  XCircle,
  RotateCcw,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface LojaWithCount extends Loja {
  _count: {
    ordens: number
    clientes: number
  }
}

interface LojasListProps {
  lojas: LojaWithCount[]
}

export function LojasList({ lojas: initialLojas }: LojasListProps) {
  const [lojas, setLojas] = useState(initialLojas)
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredLojas = lojas.filter(loja => {
    const matchBusca = !busca || 
      loja.nome.toLowerCase().includes(busca.toLowerCase()) ||
      loja.email.toLowerCase().includes(busca.toLowerCase()) ||
      loja.responsavel.toLowerCase().includes(busca.toLowerCase())
    
    const matchStatus = statusFilter === 'todos' || loja.status === statusFilter
    
    return matchBusca && matchStatus
  })

  const handleAcao = async (lojaId: string, acao: 'aprovar' | 'bloquear' | 'ativar') => {
    setLoading(lojaId)
    
    try {
      const response = await fetch(`/api/superadmin/lojas/${lojaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: acao })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        // Atualizar lista local
        setLojas(prev => prev.map(l => 
          l.id === lojaId ? { ...l, status: data.loja.status } : l
        ))
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Erro ao processar ação')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciar Lojas</h1>
          <p className="text-slate-500">{lojas.length} lojas cadastradas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, email ou responsável..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="bloqueada">Bloqueada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Loja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Responsável</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Localização</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">OS/Clientes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cadastro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLojas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Nenhuma loja encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredLojas.map((loja) => (
                  <tr key={loja.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{loja.nome}</div>
                      <div className="text-sm text-slate-500">{loja.email}</div>
                      <a 
                        href={`/loja/${loja.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        Ver página <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{loja.responsavel}</div>
                      <div className="text-sm text-slate-500">{loja.telefone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{loja.cidade}</div>
                      <div className="text-sm text-slate-500">{loja.estado}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        loja.status === 'ativa' ? 'bg-green-100 text-green-700' :
                        loja.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {loja.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{loja._count.ordens} OS</div>
                      <div className="text-sm text-slate-500">{loja._count.clientes} clientes</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {formatDate(loja.criadoEm)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {loja.status === 'pendente' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleAcao(loja.id, 'aprovar')}
                            disabled={loading === loja.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        {loja.status === 'ativa' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleAcao(loja.id, 'bloquear')}
                            disabled={loading === loja.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Bloquear
                          </Button>
                        )}
                        {loja.status === 'bloqueada' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleAcao(loja.id, 'ativar')}
                            disabled={loading === loja.id}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
