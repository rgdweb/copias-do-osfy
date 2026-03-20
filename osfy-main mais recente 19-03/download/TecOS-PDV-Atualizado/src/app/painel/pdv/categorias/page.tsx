'use client'

import { useEffect, useState } from 'react'
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Package,
  MoreHorizontal,
  Check
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Categoria {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  criadoEm: string
  _count?: {
    produtos: number
  }
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de categoria
  const [showModal, setShowModal] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  })

  // Modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoriaExcluindo, setCategoriaExcluindo] = useState<Categoria | null>(null)

  useEffect(() => {
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    try {
      const res = await fetch('/api/painel/pdv/categorias')
      const data = await res.json()

      if (data.success) {
        setCategorias(data.categorias)
      }
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const abrirModalNovo = () => {
    setCategoriaEditando(null)
    setFormData({
      nome: '',
      descricao: ''
    })
    setShowModal(true)
  }

  const abrirModalEditar = (categoria: Categoria) => {
    setCategoriaEditando(categoria)
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || ''
    })
    setShowModal(true)
  }

  const salvarCategoria = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    try {
      const url = categoriaEditando
        ? `/api/painel/pdv/categorias/${categoriaEditando.id}`
        : '/api/painel/pdv/categorias'

      const method = categoriaEditando ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(categoriaEditando ? 'Categoria atualizada!' : 'Categoria cadastrada!')
        setShowModal(false)
        loadCategorias()
      } else {
        toast.error(data.error || 'Erro ao salvar categoria')
      }
    } catch {
      toast.error('Erro ao salvar categoria')
    }
  }

  const excluirCategoria = async () => {
    if (!categoriaExcluindo) return

    try {
      const res = await fetch(`/api/painel/pdv/categorias/${categoriaExcluindo.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Categoria excluída!')
        setShowDeleteModal(false)
        setCategoriaExcluindo(null)
        loadCategorias()
      } else {
        toast.error(data.error || 'Erro ao excluir categoria')
      }
    } catch {
      toast.error('Erro ao excluir categoria')
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
          <p className="text-slate-500">Organize seus produtos em categorias</p>
        </div>
        <Button onClick={abrirModalNovo} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Tag className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total de Categorias</p>
              <p className="text-2xl font-bold">{categorias.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ativas</p>
              <p className="text-2xl font-bold">
                {categorias.filter(c => c.ativo).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total de Produtos</p>
              <p className="text-2xl font-bold">
                {categorias.reduce((acc, c) => acc + (c._count?.produtos || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Categorias</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Tag className="w-16 h-16 mb-4" />
              <p className="text-lg">Nenhuma categoria cadastrada</p>
              <p className="text-sm">Clique em "Nova Categoria" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Produtos</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{categoria.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-slate-500 text-sm max-w-xs truncate">
                        {categoria.descricao || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {categoria._count?.produtos || 0} produtos
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={categoria.ativo ? 'default' : 'secondary'}
                        className={categoria.ativo ? 'bg-emerald-100 text-emerald-700' : ''}
                      >
                        {categoria.ativo ? 'Ativa' : 'Inativa'}
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
                          <DropdownMenuItem onClick={() => abrirModalEditar(categoria)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCategoriaExcluindo(categoria)
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
          )}
        </CardContent>
      </Card>

      {/* Modal de Categoria */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome da categoria"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição opcional..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarCategoria}>
              {categoriaEditando ? 'Salvar Alterações' : 'Cadastrar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria "{categoriaExcluindo?.nome}"?
              {categoriaExcluindo?._count?.produtos && categoriaExcluindo._count.produtos > 0 && (
                <span className="block mt-2 text-amber-600">
                  Esta categoria possui {categoriaExcluindo._count.produtos} produto(s) vinculado(s).
                  Os produtos ficarão sem categoria.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={excluirCategoria}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
