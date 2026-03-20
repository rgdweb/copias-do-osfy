'use client'

import { useEffect, useState, useRef } from 'react'
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
  Clock,
  FileText
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

interface LojaInfo {
  nome: string
  endereco: string
  telefone: string
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
  const [loja, setLoja] = useState<LojaInfo>({ nome: 'TecOS PDV', endereco: '', telefone: '' })

  // Modal de detalhes
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)

  // Modal de impressão
  const [showImpressao, setShowImpressao] = useState(false)
  const [vendaImpressao, setVendaImpressao] = useState<Venda | null>(null)
  const [tipoImpressao, setTipoImpressao] = useState<'termica' | 'a4'>('termica')
  const [tamanhoTermica, setTamanhoTermica] = useState<'58mm' | '80mm'>('80mm')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Definir período padrão (últimos 30 dias)
    const hoje = new Date()
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 30)

    setDataFim(hoje.toISOString().split('T')[0])
    setDataInicio(inicio.toISOString().split('T')[0])
    
    // Carregar dados da loja
    loadLoja()
  }, [])

  useEffect(() => {
    if (dataInicio && dataFim) {
      loadVendas()
    }
  }, [dataInicio, dataFim, filtroStatus])

  const loadLoja = async () => {
    try {
      const res = await fetch('/api/painel/configuracoes')
      const data = await res.json()
      if (data.success && data.loja) {
        setLoja({
          nome: data.loja.nome || 'TecOS PDV',
          endereco: data.loja.endereco || '',
          telefone: data.loja.telefone || ''
        })
      }
    } catch {
      // Silencioso
    }
  }

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

  const abrirImpressao = (venda: Venda) => {
    setVendaImpressao(venda)
    setShowImpressao(true)
  }

  const imprimirDireto = () => {
    window.print()
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
    <>
      {/* CONTEÚDO PRINCIPAL - OCULTO NA IMPRESSÃO */}
      <div className="space-y-6 print:hidden">
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
                                onClick={() => abrirImpressao(venda)}
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
                    onClick={() => {
                      setShowDetalhes(false)
                      abrirImpressao(vendaSelecionada)
                    }}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir Cupom
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Impressão */}
        <Dialog open={showImpressao} onOpenChange={setShowImpressao}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Imprimir Cupom - Venda #{vendaImpressao?.numeroVenda}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Seleção de tipo de impressão */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Tipo de Impressão</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={tipoImpressao === 'termica' ? 'default' : 'outline'}
                      className={`flex-1 h-12 ${tipoImpressao === 'termica' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      onClick={() => setTipoImpressao('termica')}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Térmica
                    </Button>
                    <Button
                      variant={tipoImpressao === 'a4' ? 'default' : 'outline'}
                      className={`flex-1 h-12 ${tipoImpressao === 'a4' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      onClick={() => setTipoImpressao('a4')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      A4
                    </Button>
                  </div>
                </div>

                {/* Tamanho - só para térmica */}
                {tipoImpressao === 'termica' && (
                  <div>
                    <Label className="text-sm font-medium">Tamanho do Papel</Label>
                    <Select value={tamanhoTermica} onValueChange={(v) => setTamanhoTermica(v as '58mm' | '80mm')}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80mm">80mm (padrão)</SelectItem>
                        <SelectItem value="58mm">58mm (mini)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Pré-visualização do recibo */}
              <div className="border rounded-lg p-2 bg-slate-100">
                <p className="text-xs text-slate-500 mb-2 text-center">Pré-visualização do Recibo</p>
                <div className="bg-white rounded shadow-sm overflow-auto max-h-[400px]">
                  {vendaImpressao && (
                    <ReciboPreview 
                      venda={vendaImpressao} 
                      loja={loja}
                      tipoImpressao={tipoImpressao}
                      tamanhoTermica={tamanhoTermica}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowImpressao(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button 
                onClick={imprimirDireto}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ÁREA DE IMPRESSÃO - VISÍVEL APENAS NA IMPRESSÃO */}
      {vendaImpressao && (
        <div className="hidden print:block">
          <ReciboPrint 
            venda={vendaImpressao} 
            loja={loja}
            tipoImpressao={tipoImpressao}
            tamanhoTermica={tamanhoTermica}
          />
        </div>
      )}

      {/* ESTILOS DE IMPRESSÃO */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print:block,
          .print:block * {
            visibility: visible;
          }
          .print:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          @page {
            size: auto;
            margin: 0;
          }
          
          @page landscape {
            size: A4 landscape;
          }
        }
      `}</style>
    </>
  )
}

// Componente de Pré-visualização do Recibo
function ReciboPreview({ 
  venda, 
  loja, 
  tipoImpressao, 
  tamanhoTermica 
}: { 
  venda: Venda
  loja: LojaInfo
  tipoImpressao: 'termica' | 'a4'
  tamanhoTermica: '58mm' | '80mm'
}) {
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
      cartao_debito: 'Cartão Débito'
    }
    return formas[forma] || forma
  }

  if (tipoImpressao === 'a4') {
    return (
      <div style={{ 
        fontFamily: 'Arial, sans-serif', 
        padding: '20px',
        maxWidth: '297mm',
        minHeight: '210mm'
      }}>
        {/* Cabeçalho A4 */}
        <div style={{ 
          borderBottom: '3px solid #059669', 
          paddingBottom: '15px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{loja.nome}</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '5px 0' }}>{loja.endereco}</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{loja.telefone}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>CUPOM NÃO FISCAL</h2>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: '5px 0' }}>Venda #{venda.numeroVenda}</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              {new Date(venda.dataVenda).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Informações do Cliente */}
        {venda.clienteNome && (
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '10px', 
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            <span style={{ fontWeight: 'bold' }}>Cliente:</span> {venda.clienteNome}
            {venda.clienteCpf && <span style={{ marginLeft: '20px' }}><span style={{ fontWeight: 'bold' }}>CPF:</span> {venda.clienteCpf}</span>}
          </div>
        )}

        {/* Tabela de Produtos */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          marginBottom: '20px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#059669', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #047857' }}>Item</th>
              <th style={{ padding: '10px', textAlign: 'center', width: '80px', borderBottom: '2px solid #047857' }}>Qtd</th>
              <th style={{ padding: '10px', textAlign: 'right', width: '100px', borderBottom: '2px solid #047857' }}>Unitário</th>
              <th style={{ padding: '10px', textAlign: 'right', width: '100px', borderBottom: '2px solid #047857' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item, idx) => (
              <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '500' }}>{item.descricao}</span>
                  {item.tipo === 'avulso' && <span style={{ 
                    fontSize: '10px', 
                    backgroundColor: '#fef3c7', 
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    marginLeft: '8px'
                  }}>Avulso</span>}
                </td>
                <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{item.quantidade}</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>{formatarMoeda(item.precoUnitario)}</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{formatarMoeda(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totais */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginBottom: '20px'
        }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Subtotal:</span>
              <span>{formatarMoeda(venda.subtotal)}</span>
            </div>
            {venda.desconto > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#dc2626' }}>
                <span>Desconto:</span>
                <span>-{formatarMoeda(venda.desconto)}</span>
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '10px', 
              backgroundColor: '#059669', 
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '5px'
            }}>
              <span>TOTAL:</span>
              <span>{formatarMoeda(venda.total)}</span>
            </div>
          </div>
        </div>

        {/* Pagamento */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>Forma de Pagamento:</span>
            <span>{formatarFormaPagamento(venda.formaPagamento)}</span>
          </div>
          {venda.valorPago && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>Valor Pago:</span>
              <span>{formatarMoeda(venda.valorPago)}</span>
            </div>
          )}
          {venda.troco && venda.troco > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ea580c', fontWeight: 'bold' }}>
              <span>Troco:</span>
              <span>{formatarMoeda(venda.troco)}</span>
            </div>
          )}
        </div>

        {/* Assinatura */}
        <div style={{ 
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            width: '250px', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
            <span style={{ fontSize: '12px' }}>Assinatura do Cliente</span>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '11px'
        }}>
          <p>Obrigado pela preferência!</p>
          <p>TecOS - Sistema de Gestão para Assistências Técnicas</p>
        </div>
      </div>
    )
  }

  // Layout Térmica
  const largura = tamanhoTermica === '58mm' ? '58mm' : '80mm'
  const fontSize = tamanhoTermica === '58mm' ? '10px' : '12px'

  return (
    <div style={{ 
      fontFamily: "'Courier New', monospace", 
      fontSize,
      width: largura,
      maxWidth: '400px',
      margin: '0 auto',
      padding: '10px'
    }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{loja.nome}</div>
        <div style={{ fontSize: '10px', color: '#666' }}>CUPOM NÃO FISCAL</div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Informações */}
      <div style={{ fontSize: '11px' }}>
        <div><strong>Venda:</strong> #{venda.numeroVenda}</div>
        <div><strong>Data:</strong> {new Date(venda.dataVenda).toLocaleString('pt-BR')}</div>
        {venda.clienteNome && <div><strong>Cliente:</strong> {venda.clienteNome}</div>}
        {loja.endereco && <div><strong>End:</strong> {loja.endereco}</div>}
        {loja.telefone && <div><strong>Tel:</strong> {loja.telefone}</div>}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Itens */}
      <div style={{ fontSize: '10px', fontWeight: 'bold', display: 'flex', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
        <div style={{ flex: 1 }}>ITEM</div>
        <div style={{ width: '40px', textAlign: 'center' }}>QTD</div>
        <div style={{ width: '70px', textAlign: 'right' }}>UNIT</div>
        <div style={{ width: '70px', textAlign: 'right' }}>TOTAL</div>
      </div>
      {venda.itens.map((item, idx) => (
        <div key={item.id} style={{ fontSize: '11px', display: 'flex', padding: '3px 0', borderBottom: '1px dotted #eee' }}>
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {idx + 1}. {item.descricao.substring(0, 18)}
          </div>
          <div style={{ width: '40px', textAlign: 'center' }}>{item.quantidade}</div>
          <div style={{ width: '70px', textAlign: 'right' }}>{formatarMoeda(item.precoUnitario)}</div>
          <div style={{ width: '70px', textAlign: 'right' }}>{formatarMoeda(item.total)}</div>
        </div>
      ))}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Totais */}
      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{formatarMoeda(venda.subtotal)}</span>
        </div>
        {venda.desconto > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
            <span>Desconto:</span>
            <span>-{formatarMoeda(venda.desconto)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
          <span>TOTAL:</span>
          <span>{formatarMoeda(venda.total)}</span>
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Pagamento */}
      <div style={{ fontSize: '11px' }}>
        <div><strong>Forma:</strong> {formatarFormaPagamento(venda.formaPagamento)}</div>
        {venda.valorPago && <div><strong>Pago:</strong> {formatarMoeda(venda.valorPago)}</div>}
        {venda.troco && venda.troco > 0 && (
          <div style={{ color: '#ea580c', fontWeight: 'bold' }}><strong>Troco:</strong> {formatarMoeda(venda.troco)}</div>
        )}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Rodapé */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
        <div>Obrigado pela preferência!</div>
        <div>TecOS - Sistema de Gestão</div>
      </div>
    </div>
  )
}

// Componente para Impressão Real (usa window.print)
function ReciboPrint({ 
  venda, 
  loja, 
  tipoImpressao, 
  tamanhoTermica 
}: { 
  venda: Venda
  loja: LojaInfo
  tipoImpressao: 'termica' | 'a4'
  tamanhoTermica: '58mm' | '80mm'
}) {
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
      cartao_debito: 'Cartão Débito'
    }
    return formas[forma] || forma
  }

  if (tipoImpressao === 'a4') {
    return (
      <div style={{ 
        fontFamily: 'Arial, sans-serif', 
        padding: '20mm',
        width: '297mm',
        minHeight: '210mm',
        boxSizing: 'border-box'
      }}>
        {/* Cabeçalho A4 */}
        <div style={{ 
          borderBottom: '3px solid #059669', 
          paddingBottom: '15px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{loja.nome}</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '5px 0' }}>{loja.endereco}</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{loja.telefone}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>CUPOM NÃO FISCAL</h2>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: '5px 0' }}>Venda #{venda.numeroVenda}</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              {new Date(venda.dataVenda).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Informações do Cliente */}
        {venda.clienteNome && (
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '10px', 
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            <span style={{ fontWeight: 'bold' }}>Cliente:</span> {venda.clienteNome}
            {venda.clienteCpf && <span style={{ marginLeft: '20px' }}><span style={{ fontWeight: 'bold' }}>CPF:</span> {venda.clienteCpf}</span>}
          </div>
        )}

        {/* Tabela de Produtos */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          marginBottom: '20px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#059669', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #047857' }}>Item</th>
              <th style={{ padding: '10px', textAlign: 'center', width: '80px', borderBottom: '2px solid #047857' }}>Qtd</th>
              <th style={{ padding: '10px', textAlign: 'right', width: '100px', borderBottom: '2px solid #047857' }}>Unitário</th>
              <th style={{ padding: '10px', textAlign: 'right', width: '100px', borderBottom: '2px solid #047857' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item, idx) => (
              <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '500' }}>{item.descricao}</span>
                  {item.tipo === 'avulso' && <span style={{ 
                    fontSize: '10px', 
                    backgroundColor: '#fef3c7', 
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    marginLeft: '8px'
                  }}>Avulso</span>}
                </td>
                <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{item.quantidade}</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>{formatarMoeda(item.precoUnitario)}</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{formatarMoeda(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totais */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginBottom: '20px'
        }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Subtotal:</span>
              <span>{formatarMoeda(venda.subtotal)}</span>
            </div>
            {venda.desconto > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#dc2626' }}>
                <span>Desconto:</span>
                <span>-{formatarMoeda(venda.desconto)}</span>
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '10px', 
              backgroundColor: '#059669', 
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '5px'
            }}>
              <span>TOTAL:</span>
              <span>{formatarMoeda(venda.total)}</span>
            </div>
          </div>
        </div>

        {/* Pagamento */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>Forma de Pagamento:</span>
            <span>{formatarFormaPagamento(venda.formaPagamento)}</span>
          </div>
          {venda.valorPago && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>Valor Pago:</span>
              <span>{formatarMoeda(venda.valorPago)}</span>
            </div>
          )}
          {venda.troco && venda.troco > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ea580c', fontWeight: 'bold' }}>
              <span>Troco:</span>
              <span>{formatarMoeda(venda.troco)}</span>
            </div>
          )}
        </div>

        {/* Assinatura */}
        <div style={{ 
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            width: '250px', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
            <span style={{ fontSize: '12px' }}>Assinatura do Cliente</span>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '11px'
        }}>
          <p>Obrigado pela preferência!</p>
          <p>TecOS - Sistema de Gestão para Assistências Técnicas</p>
        </div>
      </div>
    )
  }

  // Layout Térmica para Impressão
  const largura = tamanhoTermica === '58mm' ? '58mm' : '80mm'
  const fontSize = tamanhoTermica === '58mm' ? '10px' : '12px'

  return (
    <div style={{ 
      fontFamily: "'Courier New', monospace", 
      fontSize,
      width: largura,
      margin: '0 auto',
      padding: '5mm'
    }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{loja.nome}</div>
        <div style={{ fontSize: '10px', color: '#666' }}>CUPOM NÃO FISCAL</div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Informações */}
      <div style={{ fontSize: '11px' }}>
        <div><strong>Venda:</strong> #{venda.numeroVenda}</div>
        <div><strong>Data:</strong> {new Date(venda.dataVenda).toLocaleString('pt-BR')}</div>
        {venda.clienteNome && <div><strong>Cliente:</strong> {venda.clienteNome}</div>}
        {loja.endereco && <div><strong>End:</strong> {loja.endereco}</div>}
        {loja.telefone && <div><strong>Tel:</strong> {loja.telefone}</div>}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Itens */}
      <div style={{ fontSize: '10px', fontWeight: 'bold', display: 'flex', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
        <div style={{ flex: 1 }}>ITEM</div>
        <div style={{ width: '40px', textAlign: 'center' }}>QTD</div>
        <div style={{ width: '70px', textAlign: 'right' }}>UNIT</div>
        <div style={{ width: '70px', textAlign: 'right' }}>TOTAL</div>
      </div>
      {venda.itens.map((item, idx) => (
        <div key={item.id} style={{ fontSize: '11px', display: 'flex', padding: '3px 0', borderBottom: '1px dotted #eee' }}>
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {idx + 1}. {item.descricao.substring(0, 18)}
          </div>
          <div style={{ width: '40px', textAlign: 'center' }}>{item.quantidade}</div>
          <div style={{ width: '70px', textAlign: 'right' }}>{formatarMoeda(item.precoUnitario)}</div>
          <div style={{ width: '70px', textAlign: 'right' }}>{formatarMoeda(item.total)}</div>
        </div>
      ))}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Totais */}
      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{formatarMoeda(venda.subtotal)}</span>
        </div>
        {venda.desconto > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
            <span>Desconto:</span>
            <span>-{formatarMoeda(venda.desconto)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
          <span>TOTAL:</span>
          <span>{formatarMoeda(venda.total)}</span>
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Pagamento */}
      <div style={{ fontSize: '11px' }}>
        <div><strong>Forma:</strong> {formatarFormaPagamento(venda.formaPagamento)}</div>
        {venda.valorPago && <div><strong>Pago:</strong> {formatarMoeda(venda.valorPago)}</div>}
        {venda.troco && venda.troco > 0 && (
          <div style={{ color: '#ea580c', fontWeight: 'bold' }}><strong>Troco:</strong> {formatarMoeda(venda.troco)}</div>
        )}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Rodapé */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
        <div>Obrigado pela preferência!</div>
        <div>TecOS - Sistema de Gestão</div>
      </div>
    </div>
  )
}
