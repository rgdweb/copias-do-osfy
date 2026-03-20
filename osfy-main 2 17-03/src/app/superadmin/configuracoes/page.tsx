'use client'

import { useEffect, useState } from 'react'
import { Settings, Save, Loader2, Globe, DollarSign, Phone, Mail, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Configuracoes {
  siteNome: string
  siteDescricao: string
  sitePreco: string
  sitePrecoAnual: string
  siteWhatsapp: string
  siteEmail: string
  siteTermos: string
  sitePolitica: string
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  const [formData, setFormData] = useState<Configuracoes>({
    siteNome: '',
    siteDescricao: '',
    sitePreco: '',
    sitePrecoAnual: '',
    siteWhatsapp: '',
    siteEmail: '',
    siteTermos: '',
    sitePolitica: ''
  })

  useEffect(() => {
    fetch('/api/superadmin/configuracoes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFormData(data.configuracoes)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const response = await fetch('/api/superadmin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Erro ao salvar configurações')
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h1>
        <p className="text-slate-500">Personalize as informações do seu sistema</p>
      </div>

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* Informações do Site */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Informações do Site
            </CardTitle>
            <CardDescription>
              Dados que aparecem na página inicial e no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteNome">Nome do Sistema</Label>
              <Input
                id="siteNome"
                value={formData.siteNome}
                onChange={(e) => setFormData({ ...formData, siteNome: e.target.value })}
                placeholder="TecOS"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteDescricao">Descrição do Sistema</Label>
              <Textarea
                id="siteDescricao"
                value={formData.siteDescricao}
                onChange={(e) => setFormData({ ...formData, siteDescricao: e.target.value })}
                placeholder="Sistema de Ordens de Serviço para Assistências Técnicas"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preços */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Preços dos Planos
            </CardTitle>
            <CardDescription>
              Valores cobrados das lojas parceiras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sitePreco">Preço Mensal (R$)</Label>
                <Input
                  id="sitePreco"
                  type="number"
                  value={formData.sitePreco}
                  onChange={(e) => setFormData({ ...formData, sitePreco: e.target.value })}
                  placeholder="29"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sitePrecoAnual">Preço Anual (R$)</Label>
                <Input
                  id="sitePrecoAnual"
                  type="number"
                  value={formData.sitePrecoAnual}
                  onChange={(e) => setFormData({ ...formData, sitePrecoAnual: e.target.value })}
                  placeholder="290"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Contato do Sistema
            </CardTitle>
            <CardDescription>
              Informações de contato para suporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteWhatsapp">WhatsApp de Suporte</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="siteWhatsapp"
                  value={formData.siteWhatsapp}
                  onChange={(e) => setFormData({ ...formData, siteWhatsapp: e.target.value })}
                  placeholder="11999999999"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteEmail">Email de Suporte</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="siteEmail"
                  type="email"
                  value={formData.siteEmail}
                  onChange={(e) => setFormData({ ...formData, siteEmail: e.target.value })}
                  placeholder="suporte@tecos.com"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Termos e Política */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Termos e Políticas
            </CardTitle>
            <CardDescription>
              Textos legais exibidos no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteTermos">Termos de Uso</Label>
              <Textarea
                id="siteTermos"
                value={formData.siteTermos}
                onChange={(e) => setFormData({ ...formData, siteTermos: e.target.value })}
                placeholder="Digite os termos de uso..."
                rows={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sitePolitica">Política de Privacidade</Label>
              <Textarea
                id="sitePolitica"
                value={formData.sitePolitica}
                onChange={(e) => setFormData({ ...formData, sitePolitica: e.target.value })}
                placeholder="Digite a política de privacidade..."
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

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
              Salvar Configurações
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
