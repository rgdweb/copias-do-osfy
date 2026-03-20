'use client'

import { useEffect, useState, useRef } from 'react'
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
  Package,
  X,
  Check,
  Barcode,
  User,
  Receipt,
  Grid3X3,
  ListFilter,
  Tag
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
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface Produto {
  id: string
  nome: string
  codigoBarras: string | null
  precoVenda: number
  estoque: number
  categoriaId: string | null
  categoria?: { id: string; nome: string } | null
  imagem?: string | null
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
  subtotal: number
  desconto: number
  total: number
  formaPagamento: string
  valorPago: number | null
  troco: number | null
  clienteNome?: string
  itens: Array<{
    descricao: string
    quantidade: number
    precoUnitario: number
    total: number
  }>
}

interface LojaInfo {
  nome: string
  endereco: string
  telefone: string
}

interface Cliente {
  id: string
  nome: string
}

interface Categoria {
  id: string
  nome: string
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

  // Estados do PDV
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [loja, setLoja] = useState<LojaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [barcodeBuffer, setBarcodeBuffer] = useState('')
  const [showBarcodeInput, setShowBarcodeInput] = useState(false)

  // Estados do carrinho
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [desconto, setDesconto] = useState(0)
  const [showDescontoInput, setShowDescontoInput] = useState(false)

  // Estados de produtos (grid principal)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [loadingProdutos, setLoadingProdutos] = useState(false)

  // Estados de cliente
  const [clienteBusca, setClienteBusca] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)

  // Estados de pagamento
  const [showPagamento, setShowPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('')
  const [valorPago, setValorPago] = useState('')

  // Estados de venda avulsa
  const [showVendaAvulsa, setShowVendaAvulsa] = useState(false)
  const [avulsaDescricao, setAvulsaDescricao] = useState('')
  const [avulsaValor, setAvulsaValor] = useState('')

  // Estado da venda concluída
  const [vendaConcluida, setVendaConcluida] = useState<VendaRealizada | null>(null)
  const [showVendaConcluida, setShowVendaConcluida] = useState(false)

  // Estados de fechar caixa
  const [showFecharCaixa, setShowFecharCaixa] = useState(false)
  const [saldoFinalInput, setSaldoFinalInput] = useState('')
  const [observacaoFechamento, setObservacaoFechamento] = useState('')
  const [fechandoCaixa, setFechandoCaixa] = useState(false)

  // Estado para caixa existente
  const [showCaixaExistente, setShowCaixaExistente] = useState(false)
  const [novoSaldoInicial, setNovoSaldoInicial] = useState(0)

  // Estado para cadastrar produto
  const [showCadastrarProduto, setShowCadastrarProduto] = useState(false)
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    precoVenda: '',
    estoque: '1',
    codigoBarras: '',
    categoriaId: ''
  })
  const [cadastrandoProduto, setCadastrandoProduto] = useState(false)

  // Estado para cadastrar categoria
  const [showCadastrarCategoria, setShowCadastrarCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [cadastrandoCategoria, setCadastrandoCategoria] = useState(false)
  const [produtoSemCategoria, setProdutoSemCategoria] = useState<Produto | null>(null)

  // Calcular totais
  const subtotal = itens.reduce((acc, item) => acc + item.total, 0)
  const total = subtotal - desconto
  const troco = valorPago && parseFloat(valorPago) > total ? parseFloat(valorPago) - total : 0

  // Carregar dados iniciais
  useEffect(() => {
    loadCaixa()
    loadLoja()
  }, [])

  // Carregar produtos e categorias quando abrir o caixa
  useEffect(() => {
    if (caixa) {
      loadProdutos()
      loadCategorias()
    }
  }, [caixa])

  // Alerta ao sair da página com itens no carrinho
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (itens.length > 0) {
        e.preventDefault()
        e.returnValue = 'Você tem itens no carrinho. Sair da página irá perder a venda. Deseja continuar?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [itens.length])

  // Alerta ao tentar navegar dentro do app
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (link && itens.length > 0) {
        const href = link.getAttribute('href')
        if (href && !href.includes('/painel/pdv')) {
          e.preventDefault()
          if (confirm('Você tem itens no carrinho. Sair da página irá perder a venda. Deseja continuar?')) {
            setItens([])
            router.push(href)
          }
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [itens.length, router])

  // Listener para código de barras via keyboard
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // F2 abre campo de código de barras
      if (e.key === 'F2') {
        e.preventDefault()
        setShowBarcodeInput(true)
        setTimeout(() => barcodeInputRef.current?.focus(), 100)
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
      if (e.key.length === 1) {
        setBarcodeBuffer(prev => {
          const newBuffer = prev + e.key
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => setBarcodeBuffer(''), 50)
          return newBuffer
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeoutId)
    }
  }, [barcodeBuffer, itens.length])

  // Filtrar produtos
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProdutos()
    }, 300)
    return () => clearTimeout(timeout)
  }, [buscaProduto, categoriaFiltro])

  const loadCaixa = async () => {
    try {
      const res = await fetch('/api/painel/pdv/caixa')
      const data = await res.json()
      if (data.success) {
        setCaixa(data.caixaAberto || null)
      }
    } catch {
      toast.error('Erro ao carregar caixa')
    } finally {
      setLoading(false)
    }
  }

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

  const loadProdutos = async () => {
    setLoadingProdutos(true)
    try {
      const params = new URLSearchParams()
      if (buscaProduto) params.append('busca', buscaProduto)
      if (categoriaFiltro && categoriaFiltro !== 'todas') {
        params.append('categoria', categoriaFiltro)
      }
      params.append('ativo', 'true')

      const res = await fetch(`/api/painel/pdv/produtos?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setProdutos(data.produtos || [])
      }
    } catch {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoadingProdutos(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const res = await fetch('/api/painel/pdv/categorias')
      const data = await res.json()
      if (data.success) {
        setCategorias(data.categorias || [])
      }
    } catch {
      // Silencioso
    }
  }

  const abrirCaixa = async (saldoInicial: number) => {
    try {
      const checkRes = await fetch('/api/painel/pdv/caixa')
      const checkData = await checkRes.json()

      if (checkData.success && checkData.caixaAberto) {
        setNovoSaldoInicial(saldoInicial)
        setShowCaixaExistente(true)
        return
      }

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

  const fecharEAbrirNovoCaixa = async () => {
    if (!caixa) return

    setFechandoCaixa(true)
    try {
      const fecharRes = await fetch('/api/painel/pdv/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caixaId: caixa.id,
          saldoFinal: caixa.saldoInicial,
          observacao: 'Fechado automaticamente para abrir novo caixa'
        })
      })

      if (!fecharRes.ok) {
        toast.error('Erro ao fechar caixa anterior')
        return
      }

      const abrirRes = await fetch('/api/painel/pdv/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saldoInicial: novoSaldoInicial })
      })
      const abrirData = await abrirRes.json()

      if (abrirData.success) {
        setCaixa(abrirData.caixa)
        setShowCaixaExistente(false)
        toast.success('Caixa anterior fechado e novo caixa aberto!')
      } else {
        toast.error(abrirData.error || 'Erro ao abrir novo caixa')
      }
    } catch {
      toast.error('Erro ao processar operação')
    } finally {
      setFechandoCaixa(false)
    }
  }

  const buscarProdutoPorCodigo = async (codigo: string) => {
    try {
      const res = await fetch(`/api/painel/pdv/produtos?codigo_barras=${encodeURIComponent(codigo)}`)
      const data = await res.json()

      if (data.success && data.produto) {
        adicionarItem(data.produto)
      } else {
        toast.error('Produto não encontrado')
      }
    } catch {
      toast.error('Erro ao buscar produto')
    }
  }

  const buscarClientes = async (termo: string) => {
    if (!termo.trim()) {
      setClientesEncontrados([])
      return
    }
    try {
      const res = await fetch(`/api/painel/clientes?busca=${encodeURIComponent(termo)}`)
      const data = await res.json()
      if (data.success) {
        setClientesEncontrados(data.clientes || [])
      }
    } catch {
      // Silencioso
    }
  }

  const adicionarItem = (produto: Produto) => {
    // Verificar se produto está sem categoria
    if (!produto.categoriaId && produtoSemCategoria === null) {
      setProdutoSemCategoria(produto)
      // Adiciona o item mesmo assim
      adicionarItemAoCarrinho(produto)
      return
    }

    adicionarItemAoCarrinho(produto)
  }

  const adicionarItemAoCarrinho = (produto: Produto) => {
    const existente = itens.find(item => item.produtoId === produto.id)

    if (existente) {
      setItens(itens.map(item =>
        item.id === existente.id
          ? { ...item, quantidade: item.quantidade + 1, total: (item.quantidade + 1) * item.precoUnitario }
          : item
      ))
    } else {
      setItens([...itens, {
        id: Date.now().toString(),
        produtoId: produto.id,
        descricao: produto.nome,
        quantidade: 1,
        precoUnitario: produto.precoVenda,
        total: produto.precoVenda,
        tipo: 'produto'
      }])
    }
    toast.success(`${produto.nome} adicionado`)
  }

  const adicionarItemAvulso = () => {
    if (!avulsaDescricao.trim() || !avulsaValor) {
      toast.error('Preencha descrição e valor')
      return
    }

    const valor = parseFloat(avulsaValor)
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor inválido')
      return
    }

    setItens([...itens, {
      id: Date.now().toString(),
      descricao: avulsaDescricao.trim(),
      quantidade: 1,
      precoUnitario: valor,
      total: valor,
      tipo: 'avulso'
    }])

    setAvulsaDescricao('')
    setAvulsaValor('')
    setShowVendaAvulsa(false)
    toast.success('Item adicionado')
  }

  const atualizarQuantidade = (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) {
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
    if (itens.length > 0) {
      if (confirm('Tem certeza que deseja limpar o carrinho?')) {
        setItens([])
        setDesconto(0)
        setClienteSelecionado(null)
      }
    }
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
          clienteNome: clienteSelecionado?.nome || null
        })
      })

      const data = await res.json()

      if (data.success) {
        setVendaConcluida({
          ...data.venda,
          clienteNome: clienteSelecionado?.nome || undefined
        })
        setShowPagamento(false)
        setShowVendaConcluida(true)
        setItens([])
        setDesconto(0)
        setValorPago('')
        setFormaPagamento('')
        setClienteSelecionado(null)
        toast.success('Venda realizada com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao finalizar venda')
      }
    } catch {
      toast.error('Erro ao finalizar venda')
    }
  }

  const cadastrarProduto = async () => {
    if (!novoProduto.nome.trim()) {
      toast.error('Nome do produto é obrigatório')
      return
    }

    if (!novoProduto.precoVenda || parseFloat(novoProduto.precoVenda) <= 0) {
      toast.error('Preço de venda é obrigatório')
      return
    }

    // Se não tem categoria, perguntar se quer cadastrar
    if (!novoProduto.categoriaId) {
      setShowCadastrarProduto(false)
      setProdutoSemCategoria({
        id: 'temp',
        nome: novoProduto.nome,
        codigoBarras: novoProduto.codigoBarras || null,
        precoVenda: parseFloat(novoProduto.precoVenda),
        estoque: parseInt(novoProduto.estoque) || 0,
        categoriaId: null,
        categoria: null
      })
      return
    }

    await salvarProduto()
  }

  const salvarProduto = async (categoriaId?: string) => {
    setCadastrandoProduto(true)
    try {
      const res = await fetch('/api/painel/pdv/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoProduto.nome,
          precoVenda: parseFloat(novoProduto.precoVenda),
          estoque: parseInt(novoProduto.estoque) || 0,
          codigoBarras: novoProduto.codigoBarras || null,
          categoriaId: categoriaId || novoProduto.categoriaId || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Produto cadastrado com sucesso!')
        setShowCadastrarProduto(false)
        setNovoProduto({ nome: '', precoVenda: '', estoque: '1', codigoBarras: '', categoriaId: '' })
        loadProdutos()
      } else {
        toast.error(data.error || 'Erro ao cadastrar produto')
      }
    } catch {
      toast.error('Erro ao cadastrar produto')
    } finally {
      setCadastrandoProduto(false)
    }
  }

  const cadastrarCategoria = async () => {
    if (!novaCategoria.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    setCadastrandoCategoria(true)
    try {
      const res = await fetch('/api/painel/pdv/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novaCategoria })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Categoria cadastrada com sucesso!')
        await loadCategorias()

        // Se estava cadastrando produto, associa a categoria
        if (produtoSemCategoria && produtoSemCategoria.id === 'temp') {
          setNovoProduto(prev => ({ ...prev, categoriaId: data.categoria.id }))
          setShowCadastrarCategoria(false)
          setNovaCategoria('')
          setProdutoSemCategoria(null)
          setShowCadastrarProduto(true)
        } else {
          setShowCadastrarCategoria(false)
          setNovaCategoria('')
          setProdutoSemCategoria(null)
        }
      } else {
        toast.error(data.error || 'Erro ao cadastrar categoria')
      }
    } catch {
      toast.error('Erro ao cadastrar categoria')
    } finally {
      setCadastrandoCategoria(false)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const compartilharVenda = () => {
    if (navigator.share && vendaConcluida) {
      navigator.share({
        title: `Venda #${vendaConcluida.numeroVenda}`,
        text: `Venda realizada no valor de ${formatarMoeda(vendaConcluida.total)}`,
        url: window.location.href
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`Venda #${vendaConcluida?.numeroVenda} - Total: ${formatarMoeda(vendaConcluida?.total || 0)}`)
      toast.success('Informações copiadas!')
    }
  }

  const fecharCaixa = async () => {
    if (!saldoFinalInput) {
      toast.error('Informe o saldo final')
      return
    }

    setFechandoCaixa(true)
    try {
      const res = await fetch('/api/painel/pdv/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caixaId: caixa?.id,
          saldoFinal: parseFloat(saldoFinalInput),
          observacao: observacaoFechamento
        })
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Caixa fechado com sucesso!')
        setCaixa(null)
        setShowFecharCaixa(false)
        setSaldoFinalInput('')
        setObservacaoFechamento('')
      } else {
        toast.error(data.error || 'Erro ao fechar caixa')
      }
    } catch {
      toast.error('Erro ao fechar caixa')
    } finally {
      setFechandoCaixa(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!caixa) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Banknote className="w-8 h-8 text-emerald-600" />
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
      {/* ==================== COLUNA ESQUERDA - GRID DE PRODUTOS ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header com busca e ações */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar produto..."
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-[180px]">
              <ListFilter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowBarcodeInput(true)}
            className="gap-2"
          >
            <Barcode className="w-4 h-4" />
            Código
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowVendaAvulsa(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Avulso (F3)
          </Button>

          {/* BOTÃO VERDE + PARA CADASTRAR PRODUTO */}
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowCadastrarProduto(true)}
          >
            <Plus className="w-4 h-4" />
            Produto
          </Button>
        </div>

        {/* CARD COM GRID DE PRODUTOS */}
        <Card className="flex-1 min-h-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-emerald-600" />
              Produtos
              <Badge variant="secondary" className="ml-2">
                {produtos.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            {loadingProdutos ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : produtos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Package className="w-16 h-16 mb-4" />
                <p className="text-lg">Nenhum produto encontrado</p>
                <p className="text-sm">Cadastre produtos para começar</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-320px)]">
                {/* GRID DE PRODUTOS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-4">
                  {produtos.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => adicionarItem(produto)}
                      className="bg-white border border-slate-200 rounded-lg p-3 text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all hover:shadow-md active:scale-95"
                    >
                      <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {produto.imagem ? (
                          <img
                            src={produto.imagem}
                            alt={produto.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <p className="font-medium text-sm truncate" title={produto.nome}>
                        {produto.nome}
                      </p>
                      {produto.categoria && (
                        <p className="text-xs text-slate-400 truncate">{produto.categoria.nome}</p>
                      )}
                      <p className="text-emerald-600 font-bold text-sm mt-1">
                        {formatarMoeda(produto.precoVenda)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Estoque: {produto.estoque}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================== COLUNA DIREITA - CARRINHO ==================== */}
      <div className="w-full lg:w-80 flex flex-col gap-2">
        {/* TOPO: Cliente + Botões de ação */}
        <div className="flex gap-2">
          {/* Busca de Cliente */}
          <div className="flex-1 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cliente (opcional)"
              value={clienteBusca}
              onChange={(e) => {
                setClienteBusca(e.target.value)
                buscarClientes(e.target.value)
              }}
              className="pl-9 h-10"
            />
            {clientesEncontrados.length > 0 && clienteBusca && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {clientesEncontrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    className="w-full px-4 py-2 text-left hover:bg-slate-100 text-sm"
                    onClick={() => {
                      setClienteSelecionado(cliente)
                      setClienteBusca(cliente.nome)
                      setClientesEncontrados([])
                    }}
                  >
                    {cliente.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Botões Produtos e Vendas */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => router.push('/painel/pdv/produtos')}
            title="Produtos"
          >
            <Package className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => router.push('/painel/pdv/vendas')}
            title="Vendas"
          >
            <Receipt className="w-4 h-4" />
          </Button>
        </div>
        {clienteSelecionado && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
            <User className="w-3 h-3" />
            <span className="flex-1 truncate">{clienteSelecionado.nome}</span>
            <button onClick={() => { setClienteSelecionado(null); setClienteBusca('') }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Carrinho - LISTA GRANDE */}
        <Card className="flex-1 min-h-0">
          <CardContent className="p-0 h-full flex flex-col">
            {itens.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p>Carrinho vazio</p>
                <p className="text-xs">Clique nos produtos para adicionar</p>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1">
                  <div className="divide-y">
                    {itens.map((item) => (
                      <div key={item.id} className="p-3 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.descricao}</p>
                          <p className="text-xs text-slate-500">{formatarMoeda(item.precoUnitario)} cada</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantidade}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <p className="font-bold text-sm">{formatarMoeda(item.total)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => removerItem(item.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {/* Limpar carrinho */}
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={limparCarrinho}
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar carrinho
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Área inferior: Total + Desconto + Finalizar */}
        <div className="space-y-2">
          {/* Subtotal e Desconto */}
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-slate-500">Subtotal:</span>
            <span className="text-sm">{formatarMoeda(subtotal)}</span>
          </div>

          {/* Desconto como linha clicável */}
          {showDescontoInput ? (
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-slate-500">Desconto:</span>
              <Input
                type="number"
                step="0.01"
                value={desconto || ''}
                onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="h-8 w-24 text-sm"
                autoFocus
              />
              <Button variant="ghost" size="sm" onClick={() => setShowDescontoInput(false)}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 px-2"
              onClick={() => setShowDescontoInput(true)}
            >
              <Tag className="w-4 h-4" />
              {desconto > 0 ? `Desconto: -${formatarMoeda(desconto)}` : 'Adicionar desconto'}
            </button>
          )}

          {/* TOTAL - Caixa menor com números maiores */}
          <Card className="bg-emerald-600 text-white py-2 px-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-100">TOTAL:</span>
              <span className="text-3xl font-bold">{formatarMoeda(total)}</span>
            </div>
          </Card>

          {/* Botão Finalizar */}
          <Button
            className="h-14 text-lg font-bold w-full"
            disabled={itens.length === 0}
            onClick={() => setShowPagamento(true)}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Finalizar Venda (F4)
          </Button>

          {/* Fechar Caixa */}
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-10"
            onClick={() => setShowFecharCaixa(true)}
          >
            <Banknote className="w-4 h-4 mr-2" />
            Fechar Caixa
          </Button>
        </div>
      </div>

      {/* Modal de Código de Barras */}
      <Dialog open={showBarcodeInput} onOpenChange={setShowBarcodeInput}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ler Código de Barras</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={barcodeInputRef}
              placeholder="Escaneie ou digite o código..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const value = (e.target as HTMLInputElement).value
                  if (value.trim()) {
                    buscarProdutoPorCodigo(value.trim())
                    setShowBarcodeInput(false)
                  }
                }
              }}
              autoFocus
            />
            <p className="text-sm text-slate-500 text-center">
              Posicione o leitor e escaneie o código
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Venda Avulsa */}
      <Dialog open={showVendaAvulsa} onOpenChange={setShowVendaAvulsa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Venda Avulsa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={avulsaDescricao}
                onChange={(e) => setAvulsaDescricao(e.target.value)}
                placeholder="Ex: Serviço de instalação"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={avulsaValor}
                onChange={(e) => setAvulsaValor(e.target.value)}
                placeholder="0,00"
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

      {/* Modal de Cadastrar Produto */}
      <Dialog open={showCadastrarProduto} onOpenChange={setShowCadastrarProduto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Cadastrar Produto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço Venda *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={novoProduto.precoVenda}
                  onChange={(e) => setNovoProduto({ ...novoProduto, precoVenda: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={novoProduto.estoque}
                  onChange={(e) => setNovoProduto({ ...novoProduto, estoque: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input
                value={novoProduto.codigoBarras}
                onChange={(e) => setNovoProduto({ ...novoProduto, codigoBarras: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex gap-2">
                <Select value={novoProduto.categoriaId} onValueChange={(v) => setNovoProduto({ ...novoProduto, categoriaId: v })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCadastrarCategoria(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCadastrarProduto(false)}>
              Cancelar
            </Button>
            <Button onClick={cadastrarProduto} disabled={cadastrandoProduto}>
              {cadastrandoProduto ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastrar Categoria */}
      <Dialog open={showCadastrarCategoria} onOpenChange={setShowCadastrarCategoria}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Ex: Acessórios"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCadastrarCategoria(false)}>
              Cancelar
            </Button>
            <Button onClick={cadastrarCategoria} disabled={cadastrandoCategoria}>
              {cadastrandoCategoria ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Produto sem Categoria */}
      <Dialog open={!!produtoSemCategoria && produtoSemCategoria?.id !== 'temp'} onOpenChange={() => setProdutoSemCategoria(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Produto sem Categoria</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            O produto <strong>{produtoSemCategoria?.nome}</strong> não possui categoria. Deseja cadastrar uma categoria para ele?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdutoSemCategoria(null)}>
              Não, continuar sem categoria
            </Button>
            <Button onClick={() => setShowCadastrarCategoria(true)}>
              Cadastrar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Produto Temporário sem Categoria */}
      <Dialog open={!!produtoSemCategoria && produtoSemCategoria?.id === 'temp'} onOpenChange={() => setProdutoSemCategoria(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Produto sem Categoria</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Deseja cadastrar o produto <strong>{produtoSemCategoria?.nome}</strong> sem categoria?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setProdutoSemCategoria(null)
              setShowCadastrarProduto(true)
            }}>
              Cancelar
            </Button>
            <Button onClick={() => {
              salvarProduto()
              setProdutoSemCategoria(null)
            }}>
              Cadastrar sem Categoria
            </Button>
            <Button onClick={() => setShowCadastrarCategoria(true)}>
              Cadastrar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={showPagamento} onOpenChange={setShowPagamento}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-slate-600">Total a pagar</p>
              <p className="text-3xl font-bold text-emerald-600">{formatarMoeda(total)}</p>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {formasPagamento.map((forma) => (
                  <Button
                    key={forma.value}
                    type="button"
                    variant={formaPagamento === forma.value ? 'default' : 'outline'}
                    className={`h-16 flex-col ${formaPagamento === forma.value ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    onClick={() => setFormaPagamento(forma.value)}
                  >
                    <forma.icon className="w-5 h-5 mb-1" />
                    {forma.label}
                  </Button>
                ))}
              </div>
            </div>

            {formaPagamento === 'dinheiro' && (
              <div className="space-y-2">
                <Label>Valor Pago (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  placeholder="0,00"
                />
                {troco > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">Troco: <strong>{formatarMoeda(troco)}</strong></p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPagamento(false)}>
              Cancelar
            </Button>
            <Button onClick={finalizarVenda} disabled={!formaPagamento}>
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Venda Concluída */}
      <Dialog open={showVendaConcluida} onOpenChange={setShowVendaConcluida}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600">Venda Realizada!</DialogTitle>
          </DialogHeader>
          {vendaConcluida && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-slate-600">Venda #{vendaConcluida.numeroVenda}</p>
                <p className="text-3xl font-bold text-emerald-600">{formatarMoeda(vendaConcluida.total)}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Forma:</span>
                  <span className="font-medium">
                    {vendaConcluida.formaPagamento === 'dinheiro' && 'Dinheiro'}
                    {vendaConcluida.formaPagamento === 'pix' && 'PIX'}
                    {vendaConcluida.formaPagamento === 'cartao_credito' && 'Cartão Crédito'}
                    {vendaConcluida.formaPagamento === 'cartao_debito' && 'Cartão Débito'}
                  </span>
                </div>
                {vendaConcluida.troco && vendaConcluida.troco > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Troco:</span>
                    <span className="font-medium">{formatarMoeda(vendaConcluida.troco)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/painel/pdv/recibo/${vendaConcluida.id}`)}
                >
                  Imprimir Recibo
                </Button>
                <Button onClick={compartilharVenda}>
                  Compartilhar
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowVendaConcluida(false)} className="w-full">
              Nova Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Caixa Existente */}
      <Dialog open={showCaixaExistente} onOpenChange={setShowCaixaExistente}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Caixa Já Aberto</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Já existe um caixa aberto. Deseja fechar o caixa atual e abrir um novo?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCaixaExistente(false)}>
              Cancelar
            </Button>
            <Button onClick={fecharEAbrirNovoCaixa} disabled={fechandoCaixa}>
              {fechandoCaixa ? 'Processando...' : 'Fechar e Abrir Novo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Fechar Caixa */}
      <Dialog open={showFecharCaixa} onOpenChange={setShowFecharCaixa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Saldo Inicial</p>
              <p className="text-xl font-bold">{formatarMoeda(caixa?.saldoInicial || 0)}</p>
            </div>

            <div className="space-y-2">
              <Label>Saldo Final (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={saldoFinalInput}
                onChange={(e) => setSaldoFinalInput(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Input
                value={observacaoFechamento}
                onChange={(e) => setObservacaoFechamento(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFecharCaixa(false)}>
              Cancelar
            </Button>
            <Button onClick={fecharCaixa} disabled={fechandoCaixa} variant="destructive">
              {fechandoCaixa ? 'Fechando...' : 'Fechar Caixa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
