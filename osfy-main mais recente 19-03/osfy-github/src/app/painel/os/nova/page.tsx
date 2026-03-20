'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  User,
  Smartphone,
  FileText,
  Calendar,
  Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function NovaOSPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteCpf: '',
    clienteTelefone: '',
    clienteEmail: '',
    clienteEndereco: '',
    equipamento: '',
    marca: '',
    modelo: '',
    imeiSerial: '',
    senhaAparelho: '',
    problema: '',
    acessorios: '',
    estadoAparelho: '',
    dataPrevisao: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clienteNome || !formData.clienteTelefone || !formData.equipamento || !formData.problema) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/painel/os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`OS #${data.os.numeroOs} criada com sucesso!`)
        router.push(`/painel/os/${data.os.id}`)
      } else {
        toast.error(data.error || 'Erro ao criar OS')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/painel/os">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Ordem de Serviço</h1>
          <p className="text-slate-500">Preencha os dados para criar uma nova OS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Cliente */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteNome">Nome *</Label>
                <Input
                  id="clienteNome"
                  name="clienteNome"
                  placeholder="Nome completo do cliente"
                  value={formData.clienteNome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clienteCpf">CPF</Label>
                <Input
                  id="clienteCpf"
                  name="clienteCpf"
                  placeholder="000.000.000-00"
                  value={formData.clienteCpf}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteTelefone">Telefone *</Label>
                <Input
                  id="clienteTelefone"
                  name="clienteTelefone"
                  placeholder="(00) 00000-0000"
                  value={formData.clienteTelefone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clienteEmail">Email</Label>
                <Input
                  id="clienteEmail"
                  name="clienteEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.clienteEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clienteEndereco">Endereço</Label>
              <Input
                id="clienteEndereco"
                name="clienteEndereco"
                placeholder="Rua, número, bairro, cidade"
                value={formData.clienteEndereco}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados do Equipamento */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Dados do Equipamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipamento">Equipamento *</Label>
              <Input
                id="equipamento"
                name="equipamento"
                placeholder="Ex: iPhone 12, Samsung A20, PS5..."
                value={formData.equipamento}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  name="marca"
                  placeholder="Ex: Apple, Samsung, Sony..."
                  value={formData.marca}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  name="modelo"
                  placeholder="Ex: A2172, SM-A205M..."
                  value={formData.modelo}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imeiSerial">IMEI / Serial</Label>
                <Input
                  id="imeiSerial"
                  name="imeiSerial"
                  placeholder="Número de série ou IMEI"
                  value={formData.imeiSerial}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senhaAparelho">Senha do Aparelho</Label>
                <Input
                  id="senhaAparelho"
                  name="senhaAparelho"
                  placeholder="Senha de desbloqueio"
                  value={formData.senhaAparelho}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problema e Detalhes */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Problema e Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problema">Problema Relatado *</Label>
              <Textarea
                id="problema"
                name="problema"
                placeholder="Descreva o problema relatado pelo cliente..."
                value={formData.problema}
                onChange={handleInputChange}
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="acessorios">Acessórios Entregues</Label>
              <Input
                id="acessorios"
                name="acessorios"
                placeholder="Ex: Carregador, capa, película..."
                value={formData.acessorios}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estadoAparelho">Estado do Aparelho</Label>
              <Input
                id="estadoAparelho"
                name="estadoAparelho"
                placeholder="Ex: Arranhados na traseira, tela trincada..."
                value={formData.estadoAparelho}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataPrevisao">Previsão de Entrega</Label>
              <Input
                id="dataPrevisao"
                name="dataPrevisao"
                type="date"
                value={formData.dataPrevisao}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit" 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Criando...' : 'Criar Ordem de Serviço'}
          </Button>
          <Link href="/painel/os" className="flex-1 sm:flex-none">
            <Button type="button" variant="outline" className="w-full">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
