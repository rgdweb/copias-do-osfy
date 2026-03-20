'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Store,
  AlertTriangle,
  Filter
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
import { toast } from 'sonner'

interface Produto {
  id: string
  nome: string
  codigoBarras: string | null
  codigoInterno: string | null
  precoCusto: number | null
  precoVenda: number
  estoque: number
  estoqueMinimo: number
  ativo: boolean
  loja: {
    id: string
    nome: string
    slug: string
    status: string
  }
  categoria: {
    id: string
    nome: string
  } | null
}

interface Loja {
  id: string
  nome: string
  slug: string
  status: string
}

export default function SuperAdminProdutosPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroLoja, setFiltroLoja] = useState('todas')

  // Estados do modal de edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Estados do modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [produtoExcluindo, setProdutoExcluindo] = useState<Produto | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    loadProdutos()
    loadLojas()
  }, [busca, filtroLoja])

  const loadProdutos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.append('busca', busca)
      if (filtroLoja !== 'todas') params.append('lojaId', filtroLoja)

      const res = await fetch(`/api/superadmin/produtos?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setProdutos(data.produtos || [])
      }
    } catch {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const loadLojas = async () => {
    try {
      const res = await fetch('/api/superadmin/lojas')
      const data = await res.json()

      if (data.success) {
        setLojas(data.lojas || [])
      }
    } catch {
      // Silencioso
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const abrirModalEdicao = (produto: Produto) => {
    setProdutoEditando({ ...produto })
    setShowEditModal(true)
  }

  const abrirModalExclusao = (produto: Produto) => {
    setProdutoExcluindo(produto)
    setShowDeleteModal(true)
  }

  const salvarProduto = async () => {
    if (!produtoEditando) return

    setSalvando(true)
    try {
      const res = await fetch(`/api/superadmin/produtos/${produtoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: produtoEditando.nome,
          precoVenda: produtoEditando.precoVenda,
          precoCusto: produtoEditando.precoCusto,
          estoque: produtoEditando.estoque,
          estoqueMinimo: produtoEditando.estoqueMinimo,
          ativo: produtoEditando.ativo
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || 'Produto atualizado com sucesso!')
        setShowEditModal(false)
        setProdutoEditando(null)
        loadProdutos()
      } else {
        toast.error(data.error || 'Erro ao atualizar produto')
      }
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setSalvando(false)
    }
  }

  const excluirProduto = async () => {
    if (!produtoExcluindo) return

    setExcluindo(true)
    try {
      const res = await fetch(`/api/superadmin/produtos/${produtoExcluindo.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || 'Produto excluído com sucesso!')
        setShowDeleteModal(false)
        setProdutoExcluindo(null)
        loadProdutos()
      } else {
        toast.error(data.error || 'Erro ao excluir produto')
      }
    } catch {
      toast.error('Erro ao excluir produto')
    } finally {
      setExcluindo(false)
    }
  }

  // Estatísticas
  const totalProdutos = produtos.length
  const produtosAtivos = produtos.filter(p => p.ativo).length
  const produtosBaixoEstoque = produtos.filter(p => p.estoque <= p.estoqueMinimo).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Produtos de Todas as Lojas</h1>
        <p className="text-slate-500">Gerencie produtos de todas as lojas do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProdutos}</p>
                <p className="text-sm text-slate-500">Total de Produtos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{produtosAtivos}</p>
                <p className="text-sm text-slate-500">Produtos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{produtosBaixoEstoque}</p>
                <p className="text-sm text-slate-500">Estoque Baixo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filtroLoja} onValueChange={setFiltroLoja}>
              <SelectTrigger className="w-[250px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as lojas</SelectItem>
                {lojas.map((loja) => (
                  <SelectItem key={loja.id} value={loja.id}>
                    {loja.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package className="w-12 h-12 mb-3" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Produto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Loja</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Preço Custo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Preço Venda</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estoque</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{produto.nome}</p>
                          {produto.codigoBarras && (
                            <p className="text-xs text-slate-500">Cód: {produto.codigoBarras}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-700">{produto.loja.nome}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                produto.loja.status === 'ativa'
                                  ? 'border-green-300 text-green-700'
                                  : produto.loja.status === 'pendente'
                                  ? 'border-amber-300 text-amber-700'
                                  : 'border-red-300 text-red-700'
                              }`}
                            >
                              {produto.loja.status}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {produto.categoria ? (
                          <span className="text-sm text-slate-600">{produto.categoria.nome}</span>
                        ) : (
                          <span className="text-sm text-slate-400">Sem categoria</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {produto.precoCusto ? formatarMoeda(produto.precoCusto) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-emerald-600">
                          {formatarMoeda(produto.precoVenda)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${
                          produto.estoque <= produto.estoqueMinimo
                            ? 'text-amber-600'
                            : 'text-slate-700'
                        }`}>
                          {produto.estoque}
                          {produto.estoque <= produto.estoqueMinimo && (
                            <AlertTriangle className="w-4 h-4 inline ml-1" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={produto.ativo ? 'default' : 'secondary'}
                          className={produto.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}
                        >
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalEdicao(produto)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalExclusao(produto)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Produto
            </DialogTitle>
          </DialogHeader>

          {produtoEditando && (
            <div className="space-y-4">
              {/* Info da loja */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Loja</p>
                <p className="font-medium flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  {produtoEditando.loja.nome}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  ⚡ Alterações refletirão automaticamente no site da loja
                </p>
              </div>

              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input
                  value={produtoEditando.nome}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Custo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produtoEditando.precoCusto || ''}
                    onChange={(e) => setProdutoEditando({
                      ...produtoEditando,
                      precoCusto: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço de Venda *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produtoEditando.precoVenda}
                    onChange={(e) => setProdutoEditando({
                      ...produtoEditando,
                      precoVenda: parseFloat(e.target.value) || 0
                    })}
                    className="border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estoque</Label>
                  <Input
                    type="number"
                    value={produtoEditando.estoque}
                    onChange={(e) => setProdutoEditando({
                      ...produtoEditando,
                      estoque: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estoque Mínimo</Label>
                  <Input
                    type="number"
                    value={produtoEditando.estoqueMinimo}
                    onChange={(e) => setProdutoEditando({
                      ...produtoEditando,
                      estoqueMinimo: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={produtoEditando.ativo}
                  onChange={(e) => setProdutoEditando({
                    ...produtoEditando,
                    ativo: e.target.checked
                  })}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="ativo" className="cursor-pointer">
                  Produto ativo para venda
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarProduto}
              disabled={salvando}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>

          {produtoExcluindo && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="font-medium">{produtoExcluindo.nome}</p>
                <p className="text-sm text-slate-500">
                  Loja: {produtoExcluindo.loja.nome}
                </p>
                <p className="text-sm text-emerald-600">
                  Preço: {formatarMoeda(produtoExcluindo.precoVenda)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={excluirProduto}
              disabled={excluindo}
              className="bg-red-600 hover:bg-red-700"
            >
              {excluindo ? 'Excluindo...' : 'Excluir Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
