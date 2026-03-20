'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Lock, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface AdminProfile {
  id: string
  nome: string
  email: string
  criadoEm: string
  atualizadoEm: string
}

export default function PerfilPage() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })

  useEffect(() => {
    fetch('/api/superadmin/perfil')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.admin) {
          setAdmin(data.admin)
          setFormData(prev => ({
            ...prev,
            nome: data.admin.nome || '',
            email: data.admin.email || ''
          }))
        } else {
          toast.error(data.error || 'Erro ao carregar perfil')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Erro ao carregar perfil:', err)
        toast.error('Erro ao carregar perfil')
        setLoading(false)
      })
  }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      return
    }

    if (formData.novaSenha && formData.novaSenha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.novaSenha && formData.novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setSalvando(true)

    try {
      const response = await fetch('/api/superadmin/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senhaAtual: formData.senhaAtual || undefined,
          novaSenha: formData.novaSenha || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setAdmin(data.admin)
        setFormData(prev => ({
          ...prev,
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: ''
        }))
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Erro ao salvar perfil')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais</p>
      </div>

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* Informações Pessoais */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize seu nome e email de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Deixe em branco para manter a senha atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={formData.senhaAtual}
                onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={formData.novaSenha}
                onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </CardContent>
        </Card>

        {/* Info da conta */}
        {admin && (
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-500 space-y-1">
                <p>Conta criada em: {new Date(admin.criadoEm).toLocaleDateString('pt-BR')}</p>
                <p>Última atualização: {new Date(admin.atualizadoEm).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Salvar */}
        <Button 
          type="submit" 
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          disabled={salvando}
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
      </form>
    </div>
  )
}
