'use client'

import { useEffect, useState } from 'react'
import { 
  Settings, 
  Save, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  DollarSign,
  CreditCard,
  QrCode,
  Shield,
  Link 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface ConfiguracaoPagamento {
  id: string
  asaasApiKey: string | null
  asaasAmbiente: string
  chavePix: string | null
  tipoChavePix: string | null
  nomeRecebedor: string | null
  valorMensalidade: number
  valorAnuidade: number
  diaVencimento: number
  diasBloqueio: number
  diasTolerancia: number
  webhookSecret: string | null
  ativo: boolean
}

export default function PagamentosPage() {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)
  const [conexaoStatus, setConexaoStatus] = useState<'sucesso' | 'erro' | null>(null)
  
  const [formData, setFormData] = useState<ConfiguracaoPagamento>({
    id: '',
    asaasApiKey: '',
    asaasAmbiente: 'sandbox',
    chavePix: '',
    tipoChavePix: '',
    nomeRecebedor: '',
    valorMensalidade: 29.90,
    valorAnuidade: 290.00,
    diaVencimento: 10,
    diasBloqueio: 20,
    diasTolerancia: 3,
    webhookSecret: '',
    ativo: false
  })

  useEffect(() => {
    loadConfiguracoes()
  }, [])

  const loadConfiguracoes = async () => {
    try {
      const res = await fetch('/api/superadmin/pagamentos')
      const data = await res.json()
      if (data.success) {
        setFormData(data.configuracao)
      }
    } catch {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const response = await fetch('/api/superadmin/pagamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Configurações salvas com sucesso!')
        setFormData(data.configuracao)
      } else {
        toast.error(data.error || 'Erro ao salvar configurações')
      }
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSalvando(false)
    }
  }

  const testarConexao = async () => {
    if (!formData.asaasApiKey) {
      toast.error('Digite a API Key do Asaas primeiro')
      return
    }

    setTestando(true)
    setConexaoStatus(null)

    try {
      const response = await fetch('/api/superadmin/asaas/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: formData.asaasApiKey,
          ambiente: formData.asaasAmbiente
        })
      })

      const data = await response.json()

      if (data.success) {
        setConexaoStatus('sucesso')
        toast.success(data.message || 'Conexão bem-sucedida!')
      } else {
        setConexaoStatus('erro')
        toast.error(data.error || 'Falha na conexão')
      }
    } catch {
      setConexaoStatus('erro')
      toast.error('Erro ao testar conexão')
    } finally {
      setTestando(false)
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações de Pagamento</h1>
          <p className="text-slate-500">Configure a integração com Asaas para cobranças</p>
        </div>
        <div className="flex items-center gap-2">
          {formData.ativo ? (
            <Badge className="bg-green-100 text-green-700">Sistema Ativo</Badge>
          ) : (
            <Badge variant="secondary">Sistema Inativo</Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* Asaas API */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Integração Asaas
            </CardTitle>
            <CardDescription>
              Configure sua conta Asaas para receber pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select 
                  value={formData.asaasAmbiente} 
                  onValueChange={(v) => setFormData({ ...formData, asaasAmbiente: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Key do Asaas</Label>
                <Input
                  type="password"
                  value={formData.asaasApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, asaasApiKey: e.target.value })}
                  placeholder="$a8a8..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={testarConexao}
                disabled={testando}
              >
                {testando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
              {conexaoStatus === 'sucesso' && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="w-4 h-4" /> Conectado
                </span>
              )}
              {conexaoStatus === 'erro' && (
                <span className="flex items-center gap-1 text-red-600 text-sm">
                  <X className="w-4 h-4" /> Falha na conexão
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PIX */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              Configuração PIX
            </CardTitle>
            <CardDescription>
              Configure sua chave PIX para pagamentos manuais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo da Chave</Label>
                <Select 
                  value={formData.tipoChavePix || ''} 
                  onValueChange={(v) => setFormData({ ...formData, tipoChavePix: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="TELEFONE">Telefone</SelectItem>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="ALEATORIA">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input
                  value={formData.chavePix || ''}
                  onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                  placeholder="Digite sua chave PIX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome do Recebedor</Label>
              <Input
                value={formData.nomeRecebedor || ''}
                onChange={(e) => setFormData({ ...formData, nomeRecebedor: e.target.value })}
                placeholder="Nome que aparecerá no PIX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Valores e Vencimentos
            </CardTitle>
            <CardDescription>
              Configure os valores das mensalidades e regras de vencimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Mensalidade (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valorMensalidade}
                  onChange={(e) => setFormData({ ...formData, valorMensalidade: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Anuidade (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valorAnuidade}
                  onChange={(e) => setFormData({ ...formData, valorAnuidade: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dia do Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.diaVencimento}
                  onChange={(e) => setFormData({ ...formData, diaVencimento: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Dias para Bloqueio</Label>
                <Input
                  type="number"
                  value={formData.diasBloqueio}
                  onChange={(e) => setFormData({ ...formData, diasBloqueio: parseInt(e.target.value) })}
                />
                <p className="text-xs text-slate-500">Após vencimento</p>
              </div>

              <div className="space-y-2">
                <Label>Dias de Tolerância</Label>
                <Input
                  type="number"
                  value={formData.diasTolerancia}
                  onChange={(e) => setFormData({ ...formData, diasTolerancia: parseInt(e.target.value) })}
                />
                <p className="text-xs text-slate-500">Antes de cobrar juros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Webhook
            </CardTitle>
            <CardDescription>
              Configure o webhook para confirmação automática de pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <Label className="text-sm font-medium">URL do Webhook (copie e cole no Asaas)</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-slate-100 p-2 rounded">
                  https://tec-os.vercel.app/api/webhooks/asaas
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText('https://tec-os.vercel.app/api/webhooks/asaas')
                    toast.success('URL copiada!')
                  }}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Cole esta URL no painel do Asaas em Configurações → Webhooks → Adicionar Webhook
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Como configurar no Asaas:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Acesse Configurações → Webhooks</li>
                <li>Clique em "Adicionar Webhook"</li>
                <li>Cole a URL acima no campo "URL do Webhook"</li>
                <li>Selecione o evento <strong>Cobranças</strong></li>
                <li>Copie o token gerado e cole no campo abaixo</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label>Token de Autenticação do Webhook</Label>
              <Input
                type="password"
                value={formData.webhookSecret || ''}
                onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                placeholder="Token gerado no Asaas"
              />
              <p className="text-xs text-slate-500">
                Cole aqui o token que o Asaas gerou ao criar o webhook
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ativar Sistema */}
        <Card className="border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Ativar Sistema de Cobrança</Label>
                <p className="text-sm text-slate-500">
                  Quando ativo, as lojas receberão faturas mensais
                </p>
              </div>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
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
