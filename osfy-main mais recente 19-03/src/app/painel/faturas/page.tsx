'use client'

import { useEffect, useState } from 'react'
import { 
  CreditCard, 
  QrCode, 
  FileText, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Fatura {
  id: string
  numeroFatura: number
  valor: number
  status: string
  formaPagamento: string | null
  codigoPix: string | null
  qrCodePix: string | null
  linkBoleto: string | null
  codigoBoleto: string | null
  linkPagamento: string | null
  dataVencimento: string
  dataPagamento: string | null
  referencia: string | null
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  paga: 'bg-green-100 text-green-700',
  vencida: 'bg-red-100 text-red-700',
  cancelada: 'bg-gray-100 text-gray-700'
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  paga: 'Pago',
  vencida: 'Vencida',
  cancelada: 'Cancelada'
}

export default function FaturasPage() {
  const [loading, setLoading] = useState(true)
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [contagem, setContagem] = useState<Record<string, number>>({})

  useEffect(() => {
    loadFaturas()
  }, [])

  const loadFaturas = async () => {
    try {
      const res = await fetch('/api/painel/faturas')
      const data = await res.json()
      if (data.success) {
        setFaturas(data.faturas)
        setContagem(data.contagem || {})
      }
    } catch {
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const copiarPix = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    toast.success('Código PIX copiado!')
  }

  const faturasPendentes = faturas.filter(f => f.status === 'pendente' || f.status === 'vencida')
  const faturasPagas = faturas.filter(f => f.status === 'paga')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Faturas e Pagamentos</h1>
        <p className="text-slate-500">Gerencie suas faturas e realize pagamentos</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {contagem['pendente'] || 0}
            </div>
            <p className="text-sm text-slate-500">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {contagem['vencida'] || 0}
            </div>
            <p className="text-sm text-slate-500">Vencidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {contagem['paga'] || 0}
            </div>
            <p className="text-sm text-slate-500">Pagas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-700">
              {formatarMoeda(faturasPendentes.reduce((acc, f) => acc + f.valor, 0))}
            </div>
            <p className="text-sm text-slate-500">Total a Pagar</p>
          </CardContent>
        </Card>
      </div>

      {/* Faturas Pendentes */}
      {faturasPendentes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Faturas Pendentes
          </h2>
          
          {faturasPendentes.map((fatura) => (
            <Card key={fatura.id} className={fatura.status === 'vencida' ? 'border-red-300' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Fatura #{fatura.numeroFatura}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {fatura.referencia || 'Mensalidade'}
                    </p>
                  </div>
                  <Badge className={statusColors[fatura.status]}>
                    {statusLabels[fatura.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Valor</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatarMoeda(fatura.valor)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Vencimento</p>
                    <p className={`font-medium ${fatura.status === 'vencida' ? 'text-red-600' : ''}`}>
                      {formatarData(fatura.dataVencimento)}
                    </p>
                  </div>
                </div>

                {/* Opções de Pagamento */}
                <div className="border-t pt-4 space-y-3">
                  {/* Link Asaas */}
                  {fatura.linkPagamento && (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => window.open(fatura.linkPagamento!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Pagar Agora
                    </Button>
                  )}

                  {/* PIX */}
                  {fatura.codigoPix && (
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Código PIX</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copiarPix(fatura.codigoPix!)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <code className="text-xs break-all block">
                        {fatura.codigoPix}
                      </code>
                    </div>
                  )}

                  {/* Boleto */}
                  {fatura.linkBoleto && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(fatura.linkBoleto!, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Boleto
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Faturas Pagas */}
      {faturasPagas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Histórico de Pagamentos
          </h2>
          
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Fatura</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Referência</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">Valor</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">Data Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {faturasPagas.map((fatura) => (
                    <tr key={fatura.id}>
                      <td className="p-4">
                        <span className="font-medium">#{fatura.numeroFatura}</span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {fatura.referencia || '-'}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatarMoeda(fatura.valor)}
                      </td>
                      <td className="p-4 text-right text-slate-500">
                        {fatura.dataPagamento ? formatarData(fatura.dataPagamento) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sem faturas */}
      {faturas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma fatura encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
