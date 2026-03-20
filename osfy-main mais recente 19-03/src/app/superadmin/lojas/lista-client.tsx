'use client'

import { useState } from 'react'
import { Loja } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Store,
  CheckCircle,
  XCircle,
  RotateCcw,
  ExternalLink,
  Edit,
  Trash2,
  Loader2
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

export function LojasLista({ lojas: initialLojas }: LojasListProps) {
  const [lojas, setLojas] = useState(initialLojas)
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loading, setLoading] = useState<string | null>(null)
  
  // Estados do modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editandoLoja, setEditandoLoja] = useState<LojaWithCount | null>(null)
  const [salvando, setSalvando] = useState(false)
  
  // Estados do modal de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [excluindoLoja, setExcluindoLoja] = useState<LojaWithCount | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Estados do formulário de edição
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    responsavel: '',
    telefone: '',
    whatsapp: '',
    email: '',
    senha: '',
    cidade: '',
    estado: '',
    endereco: '',
    descricao: '',
    horarioAtendimento: '',
    tiposServico: '',
    status: ''
  })

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

  const abrirModalEdicao = (loja: LojaWithCount) => {
    setEditandoLoja(loja)
    setFormData({
      nome: loja.nome,
      slug: loja.slug,
      responsavel: loja.responsavel,
      telefone: loja.telefone,
      whatsapp: loja.whatsapp,
      email: loja.email,
      senha: '',
      cidade: loja.cidade,
      estado: loja.estado,
      endereco: loja.endereco,
      descricao: loja.descricao || '',
      horarioAtendimento: loja.horarioAtendimento || '',
      tiposServico: loja.tiposServico || '',
      status: loja.status
    })
    setEditModalOpen(true)
  }

  const handleSalvarEdicao = async () => {
    if (!editandoLoja) return
    
    setSalvando(true)
    
    try {
      const response = await fetch(`/api/superadmin/lojas/${editandoLoja.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Loja atualizada com sucesso!')
        setLojas(prev => prev.map(l => 
          l.id === editandoLoja.id ? { ...l, ...data.loja } : l
        ))
        setEditModalOpen(false)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Erro ao salvar alterações')
    } finally {
      setSalvando(false)
    }
  }

  const abrirModalExclusao = (loja: LojaWithCount) => {
    setExcluindoLoja(loja)
    setDeleteModalOpen(true)
  }

  const handleExcluir = async () => {
    if (!excluindoLoja) return
    
    setExcluindo(true)
    
    try {
      const response = await fetch(`/api/superadmin/lojas/${excluindoLoja.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setLojas(prev => prev.filter(l => l.id !== excluindoLoja.id))
        setDeleteModalOpen(false)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Erro ao excluir loja')
    } finally {
      setExcluindo(false)
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
                      <div className="flex flex-wrap gap-2">
                        {/* Botão Editar */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => abrirModalEdicao(loja)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        
                        {/* Botões de Status */}
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
                        
                        {/* Botão Excluir */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => abrirModalExclusao(loja)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
            <DialogDescription>
              Edite os dados da loja. Deixe a senha em branco para manter a atual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Dados da Loja */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Loja *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ex: minha-loja"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha">Nova Senha</Label>
              <Input
                id="senha"
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                placeholder="Deixe em branco para manter"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="bloqueada">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horarioAtendimento">Horário de Atendimento</Label>
              <Input
                id="horarioAtendimento"
                value={formData.horarioAtendimento}
                onChange={(e) => setFormData({ ...formData, horarioAtendimento: e.target.value })}
                placeholder="Ex: Seg-Sex: 9h às 18h"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tiposServico">Tipos de Serviço</Label>
              <Input
                id="tiposServico"
                value={formData.tiposServico}
                onChange={(e) => setFormData({ ...formData, tiposServico: e.target.value })}
                placeholder="Ex: Celulares, Notebooks, TVs"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEdicao} disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Loja</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a loja <strong>"{excluindoLoja?.nome}"</strong>?
              <br /><br />
              Esta ação irá excluir permanentemente:
              <ul className="list-disc list-inside mt-2 text-red-600">
                <li>{excluindoLoja?._count.ordens} ordens de serviço</li>
                <li>{excluindoLoja?._count.clientes} clientes</li>
              </ul>
              <br />
              <span className="text-red-600 font-semibold">Esta ação não pode ser desfeita!</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              disabled={excluindo}
              className="bg-red-600 hover:bg-red-700"
            >
              {excluindo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : 'Sim, Excluir Loja'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
