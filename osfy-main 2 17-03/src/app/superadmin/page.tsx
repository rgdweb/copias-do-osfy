'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, CheckCircle, XCircle, RotateCcw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Stats {
  totalLojas: number
  lojasAtivas: number
  lojasPendentes: number
  lojasBloqueadas: number
  totalOS: number
  faturamentoTotal: number
  lojasRecentes: Array<{
    id: string
    nome: string
    email: string
    responsavel: string
    cidade: string
    estado: string
    status: string
    _count: { ordens: number }
  }>
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleAcao = async (lojaId: string, acao: 'aprovar' | 'bloquear' | 'ativar') => {
    try {
      const response = await fetch(`/api/superadmin/lojas/${lojaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: acao })
      })
      const data = await response.json()
      if (data.success) {
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-slate-500">
        Erro ao carregar dados
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Super Admin</h1>
        <p className="text-slate-500">Visão geral do sistema TecOS</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900">{stats.totalLojas}</div>
          <div className="text-slate-500">Total de Lojas</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-green-600">{stats.lojasAtivas}</div>
          <div className="text-slate-500">Lojas Ativas</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-amber-600">{stats.lojasPendentes}</div>
          <div className="text-slate-500">Aguardando Aprovação</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-red-600">{stats.lojasBloqueadas}</div>
          <div className="text-slate-500">Lojas Bloqueadas</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-emerald-600">{stats.totalOS}</div>
          <div className="text-slate-500">Total de OS no Sistema</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-emerald-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamentoTotal || 0)}
          </div>
          <div className="text-slate-500">Faturamento Total</div>
        </div>
      </div>

      {/* Lojas Recentes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Lojas Recentes</h2>
          <Link href="/superadmin/lojas">
            <Button variant="outline" size="sm">Ver Todas</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Loja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Responsável</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.lojasRecentes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Nenhuma loja cadastrada</p>
                  </td>
                </tr>
              ) : (
                stats.lojasRecentes.map((loja) => (
                  <tr key={loja.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{loja.nome}</div>
                      <div className="text-sm text-slate-500">{loja.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{loja.responsavel}</td>
                    <td className="px-6 py-4 text-slate-600">{loja.cidade}/{loja.estado}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        loja.status === 'ativa' ? 'bg-green-100 text-green-700' :
                        loja.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {loja.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{loja._count.ordens}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {loja.status === 'pendente' && (
                          <button
                            onClick={() => handleAcao(loja.id, 'aprovar')}
                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </button>
                        )}
                        {loja.status === 'ativa' && (
                          <button
                            onClick={() => handleAcao(loja.id, 'bloquear')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Bloquear
                          </button>
                        )}
                        {loja.status === 'bloqueada' && (
                          <button
                            onClick={() => handleAcao(loja.id, 'ativar')}
                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reativar
                          </button>
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
