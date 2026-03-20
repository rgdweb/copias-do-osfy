'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Barcode,
  Tag,
  DollarSign,
  Boxes,
  Eye,
  EyeOff,
  MoreHorizontal,
  Image as ImageIcon
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Produto {
  id: string
  codigoBarras: string | null
  codigoInterno: string | null
  nome: string
  descricao: string | null
  precoCusto: number | null
  precoVenda: number
  estoque: number
  estoqueMinimo: number
  unidade: string
  localizacao: string | null
  ativo: boolean
  permiteVendaSemEstoque: boolean
  imagem: string | null
  categoria: { id: string; nome: string } | null
}

interface Categoria {
  id: string
  nome: string
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')

  // Modal de produto
  const [showModal, setShowModal] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    codigoBarras: '',
    codigoInterno: '',
    nome: '',
    descricao: '',
    categoriaId: '',
    precoCusto: '',
    precoVenda: '',
    estoque: '0',
    estoqueMinimo: '0',
    unidade: 'UN',
    localizacao: '',
    permiteVendaSemEstoque: true
  })

  // Modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [produtoExcluindo, setProdutoExcluindo] = useState<Produto | null>(null)

  useEffect(() => {
    loadProdutos()
    loadCategorias()
  }, [busca, filtroCategoria, filtroAtivo])

  const loadProdutos = async () => {
    try {
      const params = new URLSearchParams()
      if (busca) params.append('busca', busca)
      if (filtroCategoria) params.append('categoria', filtroCategoria)
      if (filtroAtivo) params.append('ativo', filtroAtivo)

      const res = await fetch(`/api/painel/pdv/produtos?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setProdutos(data.produtos)
      }
    } catch {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const res = await fetch('/api/painel/pdv/categorias')
      const data = await res.json()

      if (data.success) {
        setCategorias(data.categorias)
      }
    } catch {
      // Silencioso
    }
  }

  const abrirModalNovo = () => {
    setProdutoEditando(null)
    setFormData({
      codigoBarras: '',
      codigoInterno: '',
      nome: '',
      descricao: '',
      categoriaId: '',
      precoCusto: '',
      precoVenda: '',
      estoque: '0',
      estoqueMinimo: '0',
      unidade: 'UN',
      localizacao: '',
      permiteVendaSemEstoque: true
    })
    setShowModal(true)
  }

  const abrirModalEditar = (produto: Produto) => {
    setProdutoEditando(produto)
    setFormData({
      codigoBarras: produto.codigoBarras || '',
      codigoInterno: produto.codigoInterno || '',
      nome: produto.nome,
      descricao: produto.descricao || '',
      categoriaId: produto.categoria?.id || '',
      precoCusto: produto.precoCusto?.toString() || '',
      precoVenda: produto.precoVenda.toString(),
      estoque: produto.estoque.toString(),
      estoqueMinimo: produto.estoqueMinimo.toString(),
      unidade: produto.unidade,
      localizacao: produto.localizacao || '',
      permiteVendaSemEstoque: produto.permiteVendaSemEstoque
    })
    setShowModal(true)
  }

  const salvarProduto = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do produto é obrigatório')
      return
    }

    if (!formData.precoVenda || parseFloat(formData.precoVenda) <= 0) {
      toast.error('Preço de venda deve ser maior que zero')
      return
    }

    try {
      const url = produtoEditando
        ? `/api/painel/pdv/produtos/${produtoEditando.id}`
        : '/api/painel/pdv/produtos'

      const method = produtoEditando ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(produtoEditando ? 'Produto atualizado!' : 'Produto cadastrado!')
        setShowModal(false)
        loadProdutos()
      } else {
        toast.error(data.error || 'Erro ao salvar produto')
      }
    } catch {
      toast.error('Erro ao salvar produto')
    }
  }

  const toggleAtivo = async (produto: Produto) => {
    try {
      const res = await fetch(`/api/painel/pdv/produtos/${produto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !produto.ativo })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(produto.ativo ? 'Produto desativado!' : 'Produto ativado!')
        loadProdutos()
      } else {
        toast.error(data.error || 'Erro ao atualizar produto')
      }
    } catch {
      toast.error('Erro ao atualizar produto')
    }
  }

  const excluirProduto = async () => {
    if (!produtoExcluindo) return

    try {
      const res = await fetch(`/api/painel/pdv/produtos/${produtoExcluindo.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Produto excluído!')
        setShowDeleteModal(false)
        setProdutoExcluindo(null)
        loadProdutos()
      } else {
        toast.error(data.error || 'Erro ao excluir produto')
      }
    } catch {
      toast.error('Erro ao excluir produto')
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
          <p className="text-slate-500">Gerencie os produtos do seu estoque</p>
        </div>
        <Button onClick={abrirModalNovo} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, código de barras ou código interno..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Package className="w-16 h-16 mb-4" />
              <p className="text-lg">Nenhum produto encontrado</p>
              <p className="text-sm">Clique em "Novo Produto" para começar</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-380px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            {produto.imagem ? (
                              <img
                                src={produto.imagem}
                                alt={produto.nome}
                                className="w-10 h-10 object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            {produto.descricao && (
                              <p className="text-xs text-slate-500 truncate max-w-48">
                                {produto.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {produto.codigoBarras ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Barcode className="w-3 h-3" />
                            {produto.codigoBarras}
                          </div>
                        ) : produto.codigoInterno ? (
                          <Badge variant="outline">{produto.codigoInterno}</Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {produto.categoria ? (
                          <Badge variant="secondary">{produto.categoria.nome}</Badge>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-bold text-emerald-600">
                          {formatarMoeda(produto.precoVenda)}
                        </p>
                        {produto.precoCusto && (
                          <p className="text-xs text-slate-400">
                            Custo: {formatarMoeda(produto.precoCusto)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <span className={`font-medium ${
                            produto.estoque <= produto.estoqueMinimo
                              ? 'text-red-600'
                              : 'text-slate-900'
                          }`}>
                            {produto.estoque}
                          </span>
                          <span className="text-slate-400 text-xs ml-1">
                            {produto.unidade}
                          </span>
                        </div>
                        {produto.estoque <= produto.estoqueMinimo && (
                          <p className="text-xs text-red-500">Mínimo: {produto.estoqueMinimo}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={produto.ativo ? 'default' : 'secondary'}
                          className={produto.ativo ? 'bg-emerald-100 text-emerald-700' : ''}
                        >
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirModalEditar(produto)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleAtivo(produto)}>
                              {produto.ativo ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setProdutoExcluindo(produto)
                                setShowDeleteModal(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de Produto */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 pr-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome do produto"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoriaId}
                onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Escaneie ou digite..."
                  value={formData.codigoBarras}
                  onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código Interno</Label>
              <Input
                placeholder="Ex: PRD001"
                value={formData.codigoInterno}
                onChange={(e) => setFormData({ ...formData, codigoInterno: e.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição detalhada do produto..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Preço de Custo</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.precoCusto}
                  onChange={(e) => setFormData({ ...formData, precoCusto: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preço de Venda *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.precoVenda}
                  onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estoque Atual</Label>
              <div className="relative">
                <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estoque Mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={formData.unidade}
                onValueChange={(value) => setFormData({ ...formData, unidade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">Unidade (UN)</SelectItem>
                  <SelectItem value="KG">Quilograma (KG)</SelectItem>
                  <SelectItem value="L">Litro (L)</SelectItem>
                  <SelectItem value="MT">Metro (MT)</SelectItem>
                  <SelectItem value="PC">Peça (PC)</SelectItem>
                  <SelectItem value="CX">Caixa (CX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                placeholder="Ex: Prateleira A1"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="permiteVendaSemEstoque"
                checked={formData.permiteVendaSemEstoque}
                onChange={(e) => setFormData({ ...formData, permiteVendaSemEstoque: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <Label htmlFor="permiteVendaSemEstoque" className="text-sm">
                Permitir venda sem estoque
              </Label>
            </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarProduto}>
              {produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{produtoExcluindo?.nome}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={excluirProduto}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
