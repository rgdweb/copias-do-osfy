'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  Package,
  X,
  Check,
  AlertCircle,
  Barcode,
  Keyboard,
  Wallet,
  Calculator,
  User,
  Eye,
  Printer,
  Lock
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
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface Produto {
  id: string
  nome: string
  codigoBarras: string | null
  precoVenda: number
  estoque: number
  categoria?: { nome: string } | null
}

interface ItemCarrinho {
  id: string
  produtoId?: string
  descricao: string
  quantidade: number
  precoUnitario: number
  total: number
  tipo: 'produto' | 'avulso'
}

interface Caixa {
  id: string
  status: string
  saldoInicial: number
}

interface VendaRealizada {
  id: string
  numeroVenda: number
  total: number
  formaPagamento: string
  valorPago: number | null
  troco: number | null
  itens: Array<{
    descricao: string
    quantidade: number
    precoUnitario: number
    total: number
  }>
}

const formasPagamento = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
  { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
]

export default function FrenteDeCaixa() {
  const router = useRouter()
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Estados do PDV
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [loading, setLoading] = useState(true)
  const [barcodeBuffer, setBarcodeBuffer] = useState('')
  const [showBarcodeInput, setShowBarcodeInput] = useState(false)

  // Estados do carrinho
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [desconto, setDesconto] = useState(0)

  // Estados de busca
  const [busca, setBusca] = useState('')
  const [produtosBusca, setProdutosBusca] = useState<Produto[]>([])
  const [showBuscaProdutos, setShowBuscaProdutos] = useState(false)

  // Estados de pagamento
  const [showPagamento, setShowPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('')
  const [valorPago, setValorPago] = useState('')
  const [clienteNome, setClienteNome] = useState('')

  // Estados de venda avulsa
  const [showVendaAvulsa, setShowVendaAvulsa] = useState(false)
  const [avulsaDescricao, setAvulsaDescricao] = useState('')
  const [avulsaValor, setAvulsaValor] = useState('')

  // Estado da última venda
  const [ultimaVenda, setUltimaVenda] = useState<VendaRealizada | null>(null)
  const [showCupom, setShowCupom] = useState(false)
  
  // Estado do tipo de impressão
  const [tipoImpressao, setTipoImpressao] = useState<'58mm' | '80mm' | 'A4'>('80mm')

  // Estados de fechar caixa
  const [showFecharCaixa, setShowFecharCaixa] = useState(false)
  const [saldoFinalInput, setSaldoFinalInput] = useState('')
  const [observacaoFechamento, setObservacaoFechamento] = useState('')
  const [fechandoCaixa, setFechandoCaixa] = useState(false)
  const [resumoFechamento, setResumoFechamento] = useState<{
    totalVendas: number
    totalDinheiro: number
    totalPix: number
    totalCartaoCredito: number
    totalCartaoDebito: number
  } | null>(null)

  // Calcular totais
  const subtotal = itens.reduce((acc, item) => acc + item.total, 0)
  const total = subtotal - desconto
  const troco = valorPago && parseFloat(valorPago) > total ? parseFloat(valorPago) - total : 0

  // Carregar caixa
  useEffect(() => {
    loadCaixa()
  }, [])

  // Focar no input de barcode quando abrir
  useEffect(() => {
    if (showBarcodeInput && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [showBarcodeInput])

  // Listener para código de barras via keyboard
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em um input ou textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // F2 abre busca de produtos
      if (e.key === 'F2') {
        e.preventDefault()
        setShowBuscaProdutos(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
        return
      }

      // F3 abre venda avulsa
      if (e.key === 'F3') {
        e.preventDefault()
        setShowVendaAvulsa(true)
        return
      }

      // F4 abre pagamento
      if (e.key === 'F4') {
        e.preventDefault()
        if (itens.length > 0) {
          setShowPagamento(true)
        }
        return
      }

      // Enter processa o buffer como código de barras
      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        e.preventDefault()
        buscarProdutoPorCodigo(barcodeBuffer)
        setBarcodeBuffer('')
        return
      }

      // Acumular caracteres para código de barras
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setBarcodeBuffer(prev => prev + e.key)

        // Reset buffer após 100ms sem digitação
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setBarcodeBuffer('')
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeoutId)
    }
  }, [barcodeBuffer, itens])

  const loadCaixa = async () => {
    try {
      const res = await fetch('/api/painel/pdv/caixa?status=aberto&hoje=true')
      const data = await res.json()

      if (data.success && data.caixaAberto) {
        setCaixa(data.caixaAberto)
      }
    } catch {
      toast.error('Erro ao carregar caixa')
    } finally {
      setLoading(false)
    }
  }

  const abrirCaixa = async (saldoInicial: number) => {
    try {
      const res = await fetch('/api/painel/pdv/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saldoInicial })
      })

      const data = await res.json()

      if (data.success) {
        setCaixa(data.caixa)
        toast.success('Caixa aberto com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao abrir caixa')
      }
    } catch {
      toast.error('Erro ao abrir caixa')
    }
  }

  const fecharCaixa = async () => {
    if (!caixa) return

    setFechandoCaixa(true)
    try {
      const res = await fetch('/api/painel/pdv/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caixaId: caixa.id,
          saldoFinal: saldoFinalInput || null,
          observacaoFechamento: observacaoFechamento || null
        })
      })

      const data = await res.json()

      if (data.success) {
        setResumoFechamento(data.totais)
        toast.success('Caixa fechado com sucesso!')
        // Não fecha o modal ainda, mostra o resumo
      } else {
        toast.error(data.error || 'Erro ao fechar caixa')
        setFechandoCaixa(false)
      }
    } catch {
      toast.error('Erro ao fechar caixa')
      setFechandoCaixa(false)
    }
  }

  const finalizarFechamento = () => {
    setShowFecharCaixa(false)
    setCaixa(null)
    setResumoFechamento(null)
    setSaldoFinalInput('')
    setObservacaoFechamento('')
    setFechandoCaixa(false)
  }

  const buscarProdutoPorCodigo = async (codigo: string) => {
    try {
      const res = await fetch(`/api/painel/pdv/produtos?codigo_barras=${encodeURIComponent(codigo)}`)
      const data = await res.json()

      if (data.success && data.produto) {
        adicionarProduto(data.produto)
        toast.success(`Produto adicionado: ${data.produto.nome}`)
      } else {
        toast.error('Produto não encontrado')
      }
    } catch {
      toast.error('Erro ao buscar produto')
    }
  }

  const buscarProdutos = async (termo: string) => {
    if (!termo.trim()) {
      setProdutosBusca([])
      return
    }

    try {
      const res = await fetch(`/api/painel/pdv/produtos?busca=${encodeURIComponent(termo)}&ativo=true`)
      const data = await res.json()

      if (data.success) {
        setProdutosBusca(data.produtos)
      }
    } catch {
      toast.error('Erro ao buscar produtos')
    }
  }

  const adicionarProduto = (produto: Produto) => {
    const itemExistente = itens.find(item => item.produtoId === produto.id)

    if (itemExistente) {
      setItens(itens.map(item =>
        item.produtoId === produto.id
          ? {
              ...item,
              quantidade: item.quantidade + 1,
              total: (item.quantidade + 1) * item.precoUnitario
            }
          : item
      ))
    } else {
      const novoItem: ItemCarrinho = {
        id: `temp-${Date.now()}`,
        produtoId: produto.id,
        descricao: produto.nome,
        quantidade: 1,
        precoUnitario: produto.precoVenda,
        total: produto.precoVenda,
        tipo: 'produto'
      }
      setItens([...itens, novoItem])
    }
  }

  const adicionarItemAvulso = () => {
    if (!avulsaDescricao.trim() || !avulsaValor || parseFloat(avulsaValor) <= 0) {
      toast.error('Preencha descrição e valor')
      return
    }

    const novoItem: ItemCarrinho = {
      id: `avulso-${Date.now()}`,
      descricao: avulsaDescricao.trim(),
      quantidade: 1,
      precoUnitario: parseFloat(avulsaValor),
      total: parseFloat(avulsaValor),
      tipo: 'avulso'
    }

    setItens([...itens, novoItem])
    setAvulsaDescricao('')
    setAvulsaValor('')
    setShowVendaAvulsa(false)
    toast.success('Item avulso adicionado')
  }

  const atualizarQuantidade = (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(itemId)
      return
    }

    setItens(itens.map(item =>
      item.id === itemId
        ? { ...item, quantidade: novaQuantidade, total: novaQuantidade * item.precoUnitario }
        : item
    ))
  }

  const removerItem = (itemId: string) => {
    setItens(itens.filter(item => item.id !== itemId))
  }

  const limparCarrinho = () => {
    setItens([])
    setDesconto(0)
  }

  const finalizarVenda = async () => {
    if (!formaPagamento) {
      toast.error('Selecione a forma de pagamento')
      return
    }

    if (formaPagamento === 'dinheiro' && (!valorPago || parseFloat(valorPago) < total)) {
      toast.error('Valor pago insuficiente')
      return
    }

    try {
      const res = await fetch('/api/painel/pdv/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caixaId: caixa?.id,
          itens: itens.map(item => ({
            produtoId: item.produtoId,
            descricao: item.descricao,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            tipo: item.tipo
          })),
          desconto,
          formaPagamento,
          valorPago: formaPagamento === 'dinheiro' ? parseFloat(valorPago) : null,
          clienteNome: clienteNome || null
        })
      })

      const data = await res.json()

      if (data.success) {
        setUltimaVenda(data.venda)
        setShowPagamento(false)
        setShowCupom(true)
        limparCarrinho()
        setValorPago('')
        setClienteNome('')
        setFormaPagamento('')
        toast.success('Venda realizada com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao finalizar venda')
      }
    } catch {
      toast.error('Erro ao finalizar venda')
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const imprimirCupom = (tamanho?: '58mm' | '80mm' | 'A4') => {
    if (!ultimaVenda) return

    const formato = tamanho || tipoImpressao
    
    // Configurações por tamanho
    const config = {
      '58mm': { width: '58mm', fontSize: '10px', padding: '5px', titleSize: '14px' },
      '80mm': { width: '80mm', fontSize: '12px', padding: '10px', titleSize: '16px' },
      'A4': { width: '210mm', fontSize: '14px', padding: '20px', titleSize: '20px' }
    }
    
    const c = config[formato]
    
    const conteudo = `
      <html>
      <head>
        <title>Cupom Não Fiscal</title>
        <style>
          @page { 
            size: ${formato === 'A4' ? 'A4' : formato}; 
            margin: 0;
          }
          @media print {
            body { margin: 0; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: ${c.fontSize}; 
            width: ${c.width}; 
            margin: 0 auto; 
            padding: ${c.padding};
            background: white;
          }
          .header { text-align: center; margin-bottom: 15px; }
          .title { font-size: ${c.titleSize}; font-weight: bold; }
          .subtitle { font-size: ${c.fontSize}; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: ${c.titleSize}; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          .info { margin: 3px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">TecOS PDV</div>
          <div class="subtitle">CUPOM NÃO FISCAL</div>
        </div>
        <div class="line"></div>
        <div class="info"><strong>Venda:</strong> #${ultimaVenda.numeroVenda}</div>
        <div class="info"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</div>
        ${ultimaVenda.clienteNome ? `<div class="info"><strong>Cliente:</strong> ${ultimaVenda.clienteNome}</div>` : ''}
        <div class="line"></div>
        ${ultimaVenda.itens.map(item => `
          <div class="item">
            <span>${item.quantidade}x ${item.descricao.substring(0, 20)}</span>
            <span>${formatarMoeda(item.total)}</span>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="item total">
          <span>TOTAL:</span>
          <span>${formatarMoeda(ultimaVenda.total)}</span>
        </div>
        <div class="line"></div>
        <div class="info"><strong>Forma:</strong> ${formaPagamento.replace('_', ' ').toUpperCase()}</div>
        ${ultimaVenda.valorPago ? `<div class="info"><strong>Pago:</strong> ${formatarMoeda(ultimaVenda.valorPago)}</div>` : ''}
        ${ultimaVenda.troco ? `<div class="info"><strong>Troco:</strong> ${formatarMoeda(ultimaVenda.troco)}</div>` : ''}
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
      setTimeout(() => janela.print(), 250)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Se não tem caixa aberto, mostrar tela de abertura
  if (!caixa) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Wallet className="w-8 h-8 text-emerald-600" />
              Abrir Caixa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-500 mb-4">
              Não há caixa aberto. Abra o caixa para iniciar as vendas.
            </p>
            <div className="space-y-2">
              <Label>Saldo Inicial</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                defaultValue="0"
                id="saldoInicial"
              />
            </div>
            <Button
              className="w-full h-12 text-lg"
              onClick={() => {
                const input = document.getElementById('saldoInicial') as HTMLInputElement
                abrirCaixa(parseFloat(input.value) || 0)
              }}
            >
              <Check className="w-5 h-5 mr-2" />
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4">
      {/* Coluna Esquerda - Produtos/Carrinho */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header com ações */}
        <div className="flex flex-wrap gap-1 mb-4">
          {/* Botões de seleção de tipo de impressão */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mr-2">
            <Printer className="w-4 h-4 mr-1" />
            Impressão:
          </div>
          <div className="flex gap-1">
            <Button
              variant={tipoImpressao === '58mm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoImpressao('58mm')}
              className={tipoImpressao === '58mm' ? 'bg-emerald-600' : ''}
            >
              58mm
            </Button>
            <Button
              variant={tipoImpressao === '80mm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoImpressao('80mm')}
              className={tipoImpressao === '80mm' ? 'bg-emerald-600' : ''}
            >
              80mm
            </Button>
            <Button
              variant={tipoImpressao === 'A4' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoImpressao('A4')}
              className={tipoImpressao === 'A4' ? 'bg-emerald-600' : ''}
            >
              A4
            </Button>
          </div>
          
          {/* Botões de ação existentes */}
          <Button
            variant="outline"
            onClick={() => setShowBarcodeInput(true)}
            className="gap-2"
          >
            <Barcode className="w-4 h-4" />
            Código de Barras
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowBuscaProdutos(true)
              setTimeout(() => searchInputRef.current?.focus(), 100)
            }}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Buscar (F2)
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowVendaAvulsa(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Avulso (F3)
          </Button>
          {itens.length > 0 && (
            <Button
              variant="destructive"
              onClick={limparCarrinho}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Lista de itens do carrinho */}
        <Card className="flex-1 min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho
              {itens.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {itens.reduce((acc, item) => acc + item.quantidade, 0)} itens
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {itens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Package className="w-16 h-16 mb-4" />
                <p className="text-lg">Carrinho vazio</p>
                <p className="text-sm">Escaneie ou busque produtos</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="divide-y">
                  {itens.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{item.descricao}</p>
                          {item.tipo === 'avulso' && (
                            <Badge variant="outline" className="text-xs">Avulso</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {formatarMoeda(item.precoUnitario)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantidade}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="w-28 text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatarMoeda(item.total)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita - Totais e Pagamento */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Resumo */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between text-lg">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatarMoeda(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Desconto</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={desconto || ''}
                  onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right"
                  placeholder="0,00"
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-3xl font-bold">
              <span>TOTAL</span>
              <span className="text-emerald-600">{formatarMoeda(total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Botão de pagamento */}
        <Button
          className="h-20 text-xl font-bold gap-3"
          disabled={itens.length === 0}
          onClick={() => setShowPagamento(true)}
        >
          <CreditCard className="w-8 h-8" />
          FINALIZAR VENDA (F4)
        </Button>

        {/* Informações do caixa */}
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium">Caixa Aberto</span>
              </div>
              <span className="text-sm text-slate-500">
                Inicial: {formatarMoeda(caixa.saldoInicial)}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowFecharCaixa(true)}
            >
              <Lock className="w-4 h-4" />
              Fechar Caixa
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Código de Barras */}
      <Dialog open={showBarcodeInput} onOpenChange={setShowBarcodeInput}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5" />
              Ler Código de Barras
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={barcodeInputRef}
              placeholder="Posicione o scanner e leia o código..."
              className="text-lg h-14"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value
                  if (value.trim()) {
                    buscarProdutoPorCodigo(value.trim())
                    setShowBarcodeInput(false)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
            <p className="text-sm text-slate-500 text-center">
              Use o leitor ou digite manualmente e pressione Enter
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sheet de Busca de Produtos */}
      <Sheet open={showBuscaProdutos} onOpenChange={setShowBuscaProdutos}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Buscar Produtos</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                buscarProdutos(e.target.value)
              }}
            />
            <ScrollArea className="h-[60vh]">
              <div className="space-y-2 pr-4">
                {produtosBusca.map((produto) => (
                  <button
                    key={produto.id}
                    className="w-full p-4 rounded-lg border hover:bg-emerald-50 hover:border-emerald-200 transition text-left"
                    onClick={() => {
                      adicionarProduto(produto)
                      toast.success(`${produto.nome} adicionado`)
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-slate-500">
                          {produto.categoria?.nome || 'Sem categoria'} • Estoque: {produto.estoque}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatarMoeda(produto.precoVenda)}
                      </p>
                    </div>
                  </button>
                ))}
                {busca && produtosBusca.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Venda Avulsa */}
      <Dialog open={showVendaAvulsa} onOpenChange={setShowVendaAvulsa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Item Avulso
            </DialogTitle>
            <DialogDescription>
              Adicione um item sem cadastrá-lo no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Serviço de instalação"
                value={avulsaDescricao}
                onChange={(e) => setAvulsaDescricao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={avulsaValor}
                onChange={(e) => setAvulsaValor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendaAvulsa(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionarItemAvulso}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={showPagamento} onOpenChange={setShowPagamento}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6" />
              Finalizar Venda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Total */}
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-slate-500 mb-1">Total a pagar</p>
              <p className="text-4xl font-bold text-emerald-600">{formatarMoeda(total)}</p>
            </div>

            {/* Nome do cliente */}
            <div className="space-y-2">
              <Label>Nome do Cliente (opcional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Nome do cliente"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Forma de pagamento */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {formasPagamento.map((forma) => {
                  const Icon = forma.icon
                  return (
                    <button
                      key={forma.value}
                      className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                        formaPagamento === forma.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setFormaPagamento(forma.value)}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{forma.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Valor pago (apenas dinheiro) */}
            {formaPagamento === 'dinheiro' && (
              <div className="space-y-2">
                <Label>Valor Recebido</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  className="text-xl h-14 text-center"
                />
                {valorPago && parseFloat(valorPago) >= total && (
                  <div className="p-4 bg-emerald-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Troco</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {formatarMoeda(troco)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPagamento(false)}>
              Cancelar
            </Button>
            <Button
              onClick={finalizarVenda}
              disabled={!formaPagamento || (formaPagamento === 'dinheiro' && (!valorPago || parseFloat(valorPago) < total))}
              className="min-w-32"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cupom */}
      <Dialog open={showCupom} onOpenChange={setShowCupom}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="w-6 h-6" />
              Venda Concluída!
            </DialogTitle>
          </DialogHeader>
          {ultimaVenda && (
            <div className="space-y-4 py-4">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-sm text-slate-500">Venda #{ultimaVenda.numeroVenda}</p>
                <p className="text-3xl font-bold text-emerald-600">{formatarMoeda(ultimaVenda.total)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500">Itens:</p>
                {ultimaVenda.itens.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantidade}x {item.descricao}</span>
                    <span>{formatarMoeda(item.total)}</span>
                  </div>
                ))}
              </div>

              {ultimaVenda.troco && ultimaVenda.troco > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Troco</p>
                  <p className="text-xl font-bold text-amber-600">{formatarMoeda(ultimaVenda.troco)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCupom(false)}>
              Fechar
            </Button>
            <Button onClick={imprimirCupom} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimir Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Fechar Caixa */}
      <Dialog open={showFecharCaixa} onOpenChange={setShowFecharCaixa}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Fechar Caixa
            </DialogTitle>
          </DialogHeader>
          
          {resumoFechamento ? (
            // Mostrar resumo após fechamento
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-green-700">Caixa Fechado!</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Total de Vendas:</span>
                  <span className="font-bold">{formatarMoeda(resumoFechamento.totalVendas)}</span>
                </div>
                <Separator />
                <p className="text-sm text-slate-500">Detalhamento por forma de pagamento:</p>
                <div className="flex justify-between">
                  <span className="text-slate-600">Dinheiro:</span>
                  <span>{formatarMoeda(resumoFechamento.totalDinheiro)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">PIX:</span>
                  <span>{formatarMoeda(resumoFechamento.totalPix)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cartão Crédito:</span>
                  <span>{formatarMoeda(resumoFechamento.totalCartaoCredito)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cartão Débito:</span>
                  <span>{formatarMoeda(resumoFechamento.totalCartaoDebito)}</span>
                </div>
              </div>
            </div>
          ) : (
            // Formulário de fechamento
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Saldo Inicial:</p>
                <p className="text-xl font-bold">{formatarMoeda(caixa?.saldoInicial || 0)}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Saldo Final em Caixa (dinheiro contado)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Digite o valor contado..."
                  value={saldoFinalInput}
                  onChange={(e) => setSaldoFinalInput(e.target.value)}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">
                  Deixe em branco para calcular automaticamente
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Observação (opcional)</Label>
                <Input
                  placeholder="Ex: Diferença de R$ 5,00..."
                  value={observacaoFechamento}
                  onChange={(e) => setObservacaoFechamento(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            {resumoFechamento ? (
              <Button onClick={finalizarFechamento} className="w-full">
                Concluir
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowFecharCaixa(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={fecharCaixa}
                  disabled={fechandoCaixa}
                >
                  {fechandoCaixa ? 'Fechando...' : 'Fechar Caixa'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
