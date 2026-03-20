'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, Building, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { UploadImagem } from '@/components/painel/UploadImagem'

interface UsuarioPerfil {
  id: string
  nome: string
  email: string
  foto: string | null
  tipo: string
  lojaId: string
  criadoEm: string
  loja: {
    id: string
    nome: string
    slug: string
    logo: string | null
  }
}

const TIPOS_USUARIO: Record<string, string> = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  vendedor: 'Vendedor',
  loja: 'Proprietário',
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null)
  const [nome, setNome] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [lojaId, setLojaId] = useState<string>('')

  useEffect(() => {
    loadPerfil()
  }, [])

  const loadPerfil = async () => {
    try {
      const response = await fetch('/api/painel/perfil')
      const data = await response.json()

      if (data.sucesso) {
        setUsuario(data.usuario)
        setNome(data.usuario.nome)
        setFoto(data.usuario.foto)
        setLojaId(data.usuario.lojaId)
      } else {
        toast.error('Erro ao carregar perfil')
      }
    } catch {
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSalvando(true)
    try {
      const response = await fetch('/api/painel/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, foto }),
      })

      const data = await response.json()

      if (data.sucesso) {
        toast.success('Perfil atualizado com sucesso!')
        // Recarregar perfil
        loadPerfil()
      } else {
        toast.error(data.erro || 'Erro ao salvar perfil')
      }
    } catch {
      toast.error('Erro ao salvar perfil')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Usuário não encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais</p>
      </div>

      {/* Card de Perfil */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Foto de Perfil */}
          {lojaId && (
            <>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200">
                    {foto ? (
                      <img
                        src={foto}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <UploadImagem
                    valorAtual={foto}
                    onUpload={(url) => {
                      setFoto(url)
                      toast.success('Foto atualizada!')
                    }}
                    onRemover={() => {
                      setFoto(null)
                      toast.success('Foto removida!')
                    }}
                    tipo="usuario"
                    lojaId={lojaId}
                    label="Foto de Perfil"
                    tamanhoPreview={96}
                  />
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                value={usuario.email}
                disabled
                className="pl-10 bg-slate-50"
              />
            </div>
            <p className="text-xs text-slate-500">O e-mail não pode ser alterado</p>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de Usuário</Label>
            <div>
              <Badge variant="secondary" className="text-sm">
                {TIPOS_USUARIO[usuario.tipo] || usuario.tipo}
              </Badge>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="pt-4">
            <Button
              onClick={handleSalvar}
              disabled={salvando || (nome === usuario.nome && foto === usuario.foto)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Loja */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            Informações da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {usuario.loja.logo ? (
              <img
                src={usuario.loja.logo}
                alt={usuario.loja.nome}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <Building className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900">{usuario.loja.nome}</p>
              <p className="text-sm text-slate-500">Slug: {usuario.loja.slug}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Membro desde {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
