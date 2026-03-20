'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Search,
  Calendar,
  Eye,
  Printer,
  Banknote,
  QrCode,
  Package,
  User,
  Receipt,
  Check,
  X,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface ItemVenda {
  id: string
  descricao: string
  quantidade: number
  precoUnitario: number
  total: number
  tipo: string
}

interface Venda {
  id: string
  numeroVenda: number
  clienteNome: string | null
  clienteCpf: string | null
  subtotal: number
  desconto: number
  total: number
  formaPagamento: string
  valorPago: number | null
  troco: number | null
  status: string
  tipo: string
  dataVenda: string
  observacao: string | null
  itens: ItemVenda[]
}

interface Estatisticas {
  totalVendas: number
  valorTotal: number
  vendasDinheiro: number
  vendasPix: number
  vendasCartaoCredito: number
  vendasCartaoDebito: number
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [stats, setStats] = useState<Estatisticas>({
    totalVendas: 0,
    valorTotal: 0,
    vendasDinheiro: 0,
    vendasPix: 0,
    vendasCartaoCredito: 0,
    vendasCartaoDebito: 0
  })

  // Modal de detalhes
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)

  useEffect(() => {
    // Definir período padrão (últimos 30 dias)
    const hoje = new Date()
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 30)

    setDataFim(hoje.toISOString().split('T')[0])
    setDataInicio(inicio.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (dataInicio && dataFim) {
      loadVendas()
    }
  }, [dataInicio, dataFim, filtroStatus])

  const loadVendas = async () => {
    try {
      const params = new URLSearchParams()
      params.append('dataInicio', dataInicio)
      params.append('dataFim', dataFim)
      if (filtroStatus) params.append('status', filtroStatus)

      const res = await fetch(`/api/painel/pdv/vendas?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setVendas(data.vendas)
        calcularEstatisticas(data.vendas)
      }
    } catch {
      toast.error('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const calcularEstatisticas = (vendasList: Venda[]) => {
    const stats: Estatisticas = {
      totalVendas: vendasList.filter(v => v.status === 'concluida').length,
      valorTotal: vendasList.filter(v => v.status === 'concluida').reduce((acc, v) => acc + v.total, 0),
      vendasDinheiro: 0,
      vendasPix: 0,
      vendasCartaoCredito: 0,
      vendasCartaoDebito: 0
    }

    vendasList.filter(v => v.status === 'concluida').forEach(venda => {
      switch (venda.formaPagamento) {
        case 'dinheiro':
          stats.vendasDinheiro += venda.total
          break
        case 'pix':
          stats.vendasPix += venda.total
          break
        case 'cartao_credito':
          stats.vendasCartaoCredito += venda.total
          break
        case 'cartao_debito':
          stats.vendasCartaoDebito += venda.total
          break
      }
    })

    setStats(stats)
  }

  const abrirDetalhes = (venda: Venda) => {
    setVendaSelecionada(venda)
    setShowDetalhes(true)
  }

  const imprimirCupom = (venda: Venda) => {
    const conteudo = `
      <html>
      <head>
        <title>Cupom Fiscal - Venda #${venda.numeroVenda}</title>
        <style>
          body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
          .header { text-align: center; margin-bottom: 15px; }
          .title { font-size: 16px; font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">TecOS PDV</div>
          <div>CUPOM NÃO FISCAL</div>
        </div>
        <div>Venda: #${venda.numeroVenda}</div>
        <div>Data: ${new Date(venda.dataVenda).toLocaleString('pt-BR')}</div>
        ${venda.clienteNome ? `<div>Cliente: ${venda.clienteNome}</div>` : ''}
        <div class="line"></div>
        ${venda.itens.map(item => `
          <div class="item">
            <span>${item.quantidade}x ${item.descricao.substring(0, 20)}</span>
            <span>${formatarMoeda(item.total)}</span>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="item">
          <span>Subtotal:</span>
          <span>${formatarMoeda(venda.subtotal)}</span>
        </div>
        ${venda.desconto > 0 ? `
          <div class="item">
            <span>Desconto:</span>
            <span>-${formatarMoeda(venda.desconto)}</span>
          </div>
        ` : ''}
        <div class="item total">
          <span>TOTAL:</span>
          <span>${formatarMoeda(venda.total)}</span>
        </div>
        <div>Forma: ${formatarFormaPagamento(venda.formaPagamento)}</div>
        ${venda.valorPago ? `<div>Pago: ${formatarMoeda(venda.valorPago)}</div>` : ''}
        ${venda.troco ? `<div>Troco: ${formatarMoeda(venda.troco)}</div>` : ''}
        <div class="line"></div>
        <div class="footer">
          Obrigado pela preferência!<br>
          TecOS - Sistema de Gestão
        </div>
      </body>
      </html>
    `

    const janela = window.open('', '_blank')
    if (janela) {
      janela.document.write(conteudo)
      janela.document.close()
      janela.print()
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarFormaPagamento = (forma: string) => {
    const formas: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_credito: 'Cartão Crédito',
      cartao_debito: 'Cartão Débito',
      boleto: 'Boleto',
      crediario: 'Crediário'
    }
    return formas[forma] || forma
  }

  const getIconeFormaPagamento = (forma: string) => {
    switch (forma) {
      case 'dinheiro':
        return Banknote
      case 'pix':
        return QrCode
      case 'cartao_credito':
      case 'cartao_debito':
        return CreditCard
      default:
        return Receipt
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluida':
        return <Badge className="bg-emerald-100 text-emerald-700 gap-1"><Check className="w-3 h-3" />Concluída</Badge>
      case 'cancelada':
        return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />Cancelada</Badge>
      case 'pendente':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico de Vendas</h1>
        <p className="text-slate-500">Consulte e gerencie as vendas realizadas</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Vendas</p>
            <p className="text-2xl font-bold">{stats.totalVendas}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-600">Valor Total</p>
            <p className="text-2xl font-bold text-emerald-600">{formatarMoeda(stats.valorTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-slate-500">Dinheiro</p>
              <p className="font-bold">{formatarMoeda(stats.vendasDinheiro)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-slate-500">PIX</p>
              <p className="font-bold">{formatarMoeda(stats.vendasPix)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-slate-500">Crédito</p>
              <p className="font-bold">{formatarMoeda(stats.vendasCartaoCredito)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-slate-500">Débito</p>
              <p className="font-bold">{formatarMoeda(stats.vendasCartaoDebito)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Label className="whitespace-nowrap">Período:</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-40"
              />
              <span className="text-slate-400">até</span>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-40"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Receipt className="w-16 h-16 mb-4" />
              <p className="text-lg">Nenhuma venda encontrada</p>
              <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-500px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venda</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda) => {
                    const IconePagamento = getIconeFormaPagamento(venda.formaPagamento)
                    return (
                      <TableRow key={venda.id}>
                        <TableCell>
                          <span className="font-bold text-emerald-600">#{venda.numeroVenda}</span>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {new Date(venda.dataVenda).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(venda.dataVenda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </TableCell>
                        <TableCell>
                          {venda.clienteNome ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              {venda.clienteNome}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span>{venda.itens.length} {venda.itens.length === 1 ? 'item' : 'itens'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconePagamento className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">{formatarFormaPagamento(venda.formaPagamento)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-bold text-lg">{formatarMoeda(venda.total)}</p>
                          {venda.troco && venda.troco > 0 && (
                            <p className="text-xs text-slate-500">
                              Troco: {formatarMoeda(venda.troco)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(venda.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirDetalhes(venda)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => imprimirCupom(venda)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Venda #{vendaSelecionada?.numeroVenda}
            </DialogTitle>
          </DialogHeader>
          {vendaSelecionada && (
            <div className="space-y-4">
              {/* Informações gerais */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Data/Hora</p>
                  <p className="font-medium">
                    {new Date(vendaSelecionada.dataVenda).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  {getStatusBadge(vendaSelecionada.status)}
                </div>
                {vendaSelecionada.clienteNome && (
                  <div>
                    <p className="text-slate-500">Cliente</p>
                    <p className="font-medium">{vendaSelecionada.clienteNome}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Pagamento</p>
                  <p className="font-medium">{formatarFormaPagamento(vendaSelecionada.formaPagamento)}</p>
                </div>
              </div>

              <Separator />

              {/* Itens */}
              <div className="space-y-2">
                <p className="font-medium">Itens da Venda</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {vendaSelecionada.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <div>
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantidade} x {formatarMoeda(item.precoUnitario)}
                        </p>
                      </div>
                      <p className="font-bold">{formatarMoeda(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatarMoeda(vendaSelecionada.subtotal)}</span>
                </div>
                {vendaSelecionada.desconto > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto</span>
                    <span>-{formatarMoeda(vendaSelecionada.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatarMoeda(vendaSelecionada.total)}</span>
                </div>
                {vendaSelecionada.valorPago && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor Pago</span>
                    <span>{formatarMoeda(vendaSelecionada.valorPago)}</span>
                  </div>
                )}
                {vendaSelecionada.troco && vendaSelecionada.troco > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Troco</span>
                    <span>{formatarMoeda(vendaSelecionada.troco)}</span>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => imprimirCupom(vendaSelecionada)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Cupom
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
