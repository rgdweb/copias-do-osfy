'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  User,
  Smartphone,
  FileText,
  DollarSign,
  Clock,
  ExternalLink,
  QrCode,
  MessageCircle,
  Printer,
  CreditCard,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, STATUS_COLORS, type StatusOS } from '@/types'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { OrdemServico, Cliente, HistoricoOS, FotoOS, Assinatura, Usuario, Loja } from '@prisma/client'

interface OSDetailPageProps {
  os: OrdemServico & {
    cliente: Cliente
    tecnico: { id: string; nome: string } | null
    historico: HistoricoOS[]
    fotos: FotoOS[]
    assinatura: Assinatura | null
    loja: { slug: string; nome: string; telefone?: string; endereco?: string; cidade?: string; estado?: string }
  }
}

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'crediario', label: 'Crediário' },
]

// Função para imprimir a OS em duas vias (A4 Paisagem)
const imprimirOS = (os: OSDetailPageProps['os']) => {
  const valorTotal = (os.valorServico || 0) + (os.valorPecas || 0)
  
  const conteudo = `
<!DOCTYPE html>
<html>
<head>
  <title>OS #${os.numeroOs} - ${os.loja.nome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { 
      size: A4 landscape; 
      margin: 0;
    }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 11px; 
      display: flex;
      justify-content: center;
      align-items: flex-start;
      background: #f0f0f0;
      padding: 10mm;
      min-height: 100vh;
    }
    .container {
      display: flex;
      gap: 10mm;
      width: 277mm;
      height: 190mm;
    }
    .via {
      flex: 1;
      background: white;
      padding: 8mm;
      border: 1px solid #ccc;
      display: flex;
      flex-direction: column;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #10b981;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .header h1 { font-size: 16px; color: #10b981; margin-bottom: 3px; }
    .header p { color: #666; font-size: 9px; }
    .via-titulo {
      text-align: center;
      padding: 5px;
      margin-bottom: 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
    }
    .via-cliente { background: #d1fae5; color: #065f46; }
    .via-loja { background: #dbeafe; color: #1e40af; }
    .os-numero {
      text-align: right;
      font-size: 11px;
      color: #666;
      margin-bottom: 8px;
    }
    .os-numero strong { font-size: 14px; color: #333; }
    .section { margin-bottom: 8px; }
    .section-title {
      background: #f3f4f6;
      padding: 4px 8px;
      font-weight: bold;
      border-radius: 3px;
      margin-bottom: 5px;
      font-size: 10px;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
    .field { margin-bottom: 4px; }
    .field-label { font-weight: bold; color: #666; font-size: 8px; text-transform: uppercase; }
    .field-value { color: #333; font-size: 10px; }
    .problema-box {
      border: 1px solid #e5e7eb;
      padding: 6px;
      border-radius: 3px;
      background: #fafafa;
      font-size: 10px;
    }
    .valores { margin-top: 8px; border-top: 1px dashed #ccc; padding-top: 8px; }
    .valor-linha { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
    .valor-total { font-weight: bold; font-size: 12px; border-top: 2px solid #333; padding-top: 5px; margin-top: 3px; }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 15px;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9px;
    }
    .pago-info {
      margin-top: 5px;
      padding: 5px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    .pago { background: #d1fae5; color: #065f46; }
    .pendente { background: #fef3c7; color: #92400e; }
    .assinatura-area {
      margin-top: auto;
      border-top: 1px solid #333;
      padding-top: 8px;
      text-align: center;
    }
    .assinatura-linha {
      margin-top: 25px;
      border-top: 1px solid #333;
      padding-top: 3px;
      font-size: 9px;
    }
    .assinatura-img {
      max-height: 40px;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 8px;
      border-top: 1px solid #e5e7eb;
      padding-top: 5px;
      font-size: 8px;
      color: #666;
      text-align: center;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { border: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- VIA DO CLIENTE -->
    <div class="via">
      <div class="via-titulo via-cliente">VIA DO CLIENTE</div>
      <div class="header">
        <h1>${os.loja.nome}</h1>
        <p>${os.loja.endereco || ''} ${os.loja.cidade ? `- ${os.loja.cidade}` : ''} ${os.loja.estado ? `/ ${os.loja.estado}` : ''}</p>
        <p>${os.loja.telefone || ''}</p>
      </div>
      
      <div class="os-numero">
        OS: <strong>#${os.numeroOs}</strong> | Data: ${formatDateTime(os.dataCriacao)}
      </div>
      
      <div class="section">
        <div class="section-title">CLIENTE</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Nome</div>
            <div class="field-value">${os.cliente.nome}</div>
          </div>
          <div class="field">
            <div class="field-label">Telefone</div>
            <div class="field-value">${os.cliente.telefone}</div>
          </div>
          ${os.cliente.cpf ? `
          <div class="field">
            <div class="field-label">CPF</div>
            <div class="field-value">${os.cliente.cpf}</div>
          </div>
          ` : ''}
          ${os.cliente.endereco ? `
          <div class="field">
            <div class="field-label">Endereço</div>
            <div class="field-value">${os.cliente.endereco}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">EQUIPAMENTO</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Equipamento</div>
            <div class="field-value">${os.equipamento}</div>
          </div>
          <div class="field">
            <div class="field-label">Marca/Modelo</div>
            <div class="field-value">${os.marca || '-'} ${os.modelo || ''}</div>
          </div>
          ${os.imeiSerial ? `
          <div class="field">
            <div class="field-label">IMEI/Serial</div>
            <div class="field-value">${os.imeiSerial}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">PROBLEMA</div>
        <div class="problema-box">
          ${os.problema}
          ${os.acessorios ? `<br><strong>Acessórios:</strong> ${os.acessorios}` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">STATUS</div>
        <p><span class="status-badge" style="background: ${STATUS_COLORS[os.status as StatusOS].replace('bg-', '').replace('-100', '')}20; color: ${STATUS_COLORS[os.status as StatusOS].replace('bg-', '').replace('-500', '')};">
          ${STATUS_LABELS[os.status as StatusOS]}
        </span></p>
      </div>
      
      ${valorTotal > 0 ? `
      <div class="valores">
        <div class="section-title">VALORES</div>
        ${os.orcamento ? `<div class="valor-linha"><span>Orçamento:</span><span>${formatCurrency(os.orcamento)}</span></div>` : ''}
        ${os.valorServico ? `<div class="valor-linha"><span>Serviço:</span><span>${formatCurrency(os.valorServico)}</span></div>` : ''}
        ${os.valorPecas ? `<div class="valor-linha"><span>Peças:</span><span>${formatCurrency(os.valorPecas)}</span></div>` : ''}
        <div class="valor-linha valor-total"><span>TOTAL:</span><span>${formatCurrency(valorTotal)}</span></div>
        ${os.formaPagamento ? `<div class="valor-linha"><span>Forma Pgto:</span><span>${FORMAS_PAGAMENTO.find(f => f.value === os.formaPagamento)?.label || os.formaPagamento}</span></div>` : ''}
        <div class="pago-info ${os.pago ? 'pago' : 'pendente'}">
          ${os.pago ? 'PAGO' : 'PENDENTE'}
        </div>
      </div>
      ` : ''}
      
      <div class="assinatura-area">
        <p style="font-size: 9px;">Assinatura do Cliente:</p>
        ${os.assinatura ? `<img src="${os.assinatura.imagem}" class="assinatura-img" alt="Assinatura" />` : ''}
        <div class="assinatura-linha">_________________________________</div>
      </div>
      
      <div class="footer">
        <p>TecOS - Acompanhe sua OS em: https://tec-os.vercel.app/os/${os.id}</p>
      </div>
    </div>
    
    <!-- VIA DA LOJA -->
    <div class="via">
      <div class="via-titulo via-loja">VIA DA LOJA</div>
      <div class="header">
        <h1>${os.loja.nome}</h1>
        <p>${os.loja.endereco || ''} ${os.loja.cidade ? `- ${os.loja.cidade}` : ''} ${os.loja.estado ? `/ ${os.loja.estado}` : ''}</p>
        <p>${os.loja.telefone || ''}</p>
      </div>
      
      <div class="os-numero">
        OS: <strong>#${os.numeroOs}</strong> | Data: ${formatDateTime(os.dataCriacao)}
      </div>
      
      <div class="section">
        <div class="section-title">CLIENTE</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Nome</div>
            <div class="field-value">${os.cliente.nome}</div>
          </div>
          <div class="field">
            <div class="field-label">Telefone</div>
            <div class="field-value">${os.cliente.telefone}</div>
          </div>
          ${os.cliente.cpf ? `
          <div class="field">
            <div class="field-label">CPF</div>
            <div class="field-value">${os.cliente.cpf}</div>
          </div>
          ` : ''}
          ${os.cliente.endereco ? `
          <div class="field">
            <div class="field-label">Endereço</div>
            <div class="field-value">${os.cliente.endereco}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">EQUIPAMENTO</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Equipamento</div>
            <div class="field-value">${os.equipamento}</div>
          </div>
          <div class="field">
            <div class="field-label">Marca/Modelo</div>
            <div class="field-value">${os.marca || '-'} ${os.modelo || ''}</div>
          </div>
          ${os.imeiSerial ? `
          <div class="field">
            <div class="field-label">IMEI/Serial</div>
            <div class="field-value">${os.imeiSerial}</div>
          </div>
          ` : ''}
          ${os.senhaAparelho ? `
          <div class="field">
            <div class="field-label">Senha</div>
            <div class="field-value">${os.senhaAparelho}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">PROBLEMA</div>
        <div class="problema-box">
          ${os.problema}
          ${os.acessorios ? `<br><strong>Acessórios:</strong> ${os.acessorios}` : ''}
          ${os.estadoAparelho ? `<br><strong>Estado:</strong> ${os.estadoAparelho}` : ''}
        </div>
      </div>
      
      ${os.diagnostico ? `
      <div class="section">
        <div class="section-title">DIAGNÓSTICO</div>
        <div class="problema-box">${os.diagnostico}</div>
      </div>
      ` : ''}
      
      ${os.solucao ? `
      <div class="section">
        <div class="section-title">SOLUÇÃO</div>
        <div class="problema-box">${os.solucao}</div>
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">STATUS</div>
        <p><span class="status-badge" style="background: ${STATUS_COLORS[os.status as StatusOS].replace('bg-', '').replace('-100', '')}20; color: ${STATUS_COLORS[os.status as StatusOS].replace('bg-', '').replace('-500', '')};">
          ${STATUS_LABELS[os.status as StatusOS]}
        </span></p>
      </div>
      
      ${valorTotal > 0 ? `
      <div class="valores">
        <div class="section-title">VALORES</div>
        ${os.orcamento ? `<div class="valor-linha"><span>Orçamento:</span><span>${formatCurrency(os.orcamento)}</span></div>` : ''}
        ${os.valorServico ? `<div class="valor-linha"><span>Serviço:</span><span>${formatCurrency(os.valorServico)}</span></div>` : ''}
        ${os.valorPecas ? `<div class="valor-linha"><span>Peças:</span><span>${formatCurrency(os.valorPecas)}</span></div>` : ''}
        <div class="valor-linha valor-total"><span>TOTAL:</span><span>${formatCurrency(valorTotal)}</span></div>
        ${os.formaPagamento ? `<div class="valor-linha"><span>Forma Pgto:</span><span>${FORMAS_PAGAMENTO.find(f => f.value === os.formaPagamento)?.label || os.formaPagamento}</span></div>` : ''}
        <div class="pago-info ${os.pago ? 'pago' : 'pendente'}">
          ${os.pago ? 'PAGO' : 'PENDENTE'}
        </div>
      </div>
      ` : ''}
      
      <div class="assinatura-area">
        <p style="font-size: 9px;">Assinatura do Técnico:</p>
        <div class="assinatura-linha">_________________________________</div>
      </div>
      
      <div class="footer">
        <p>TecOS - Sistema de Gestão de Ordens de Serviço</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(conteudo)
    printWindow.document.close()
    printWindow.print()
  }
}

export function OSDetailPage({ os }: OSDetailPageProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(os.status)
  const [orcamento, setOrcamento] = useState(os.orcamento?.toString() || '')
  const [diagnostico, setDiagnostico] = useState(os.diagnostico || '')
  const [solucao, setSolucao] = useState(os.solucao || '')
  const [valorServico, setValorServico] = useState(os.valorServico?.toString() || '')
  const [valorPecas, setValorPecas] = useState(os.valorPecas?.toString() || '')
  const [formaPagamento, setFormaPagamento] = useState(os.formaPagamento || '')
  const [pago, setPago] = useState(os.pago)

  const handlePrint = () => {
    imprimirOS(os)
  }

  const handleUpdateStatus = async () => {
    if (status === os.status) return

    setLoading(true)
    try {
      const response = await fetch(`/api/painel/os/${os.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Status atualizado com sucesso!')
        window.location.reload()
      } else {
        toast.error(data.error || 'Erro ao atualizar status')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrcamento = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/painel/os/${os.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orcamento: parseFloat(orcamento) || null,
          diagnostico,
          solucao,
          valorServico: parseFloat(valorServico) || null,
          valorPecas: parseFloat(valorPecas) || null,
          formaPagamento: formaPagamento || null,
          pago
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Dados atualizados com sucesso!')
        window.location.reload()
      } else {
        toast.error(data.error || 'Erro ao atualizar dados')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarWhatsApp = () => {
    const linkOS = `${window.location.origin}/os/${os.id}`
    const mensagem = `Olá ${os.cliente.nome}!

Sua ordem de serviço #${os.numeroOs} foi criada.

Equipamento: ${os.equipamento}
Status: ${STATUS_LABELS[os.status as StatusOS]}

Acompanhe seu reparo em tempo real:
${linkOS}

${os.loja.nome}`
    
    const telefone = os.cliente.telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank')
  }

  const valorTotal = (parseFloat(valorServico) || 0) + (parseFloat(valorPecas) || 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/painel/os">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">OS #{os.numeroOs}</h1>
              <Badge className={`${STATUS_COLORS[os.status as StatusOS]} text-white`}>
                {STATUS_LABELS[os.status as StatusOS]}
              </Badge>
            </div>
            <p className="text-slate-500">Criada em {formatDateTime(os.dataCriacao)}</p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleEnviarWhatsApp}>
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <a href={`/os/${os.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver como Cliente
            </Button>
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Atualizar Status */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Atualizar Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={loading || status === os.status}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Diagnóstico e Orçamento */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Diagnóstico e Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Textarea
                  id="diagnostico"
                  placeholder="Descreva o diagnóstico do problema..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="solucao">Solução Aplicada</Label>
                <Textarea
                  id="solucao"
                  placeholder="Descreva a solução aplicada..."
                  value={solucao}
                  onChange={(e) => setSolucao(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orcamento">Orçamento (R$)</Label>
                  <Input
                    id="orcamento"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={orcamento}
                    onChange={(e) => setOrcamento(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorServico">Valor Serviço (R$)</Label>
                  <Input
                    id="valorServico"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorServico}
                    onChange={(e) => setValorServico(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorPecas">Valor Peças (R$)</Label>
                  <Input
                    id="valorPecas"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorPecas}
                    onChange={(e) => setValorPecas(e.target.value)}
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Forma de Pagamento
                  </Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status do Pagamento</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="pago" 
                      checked={pago} 
                      onCheckedChange={(checked) => setPago(checked as boolean)}
                    />
                    <label 
                      htmlFor="pago" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      {pago ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Pago
                        </span>
                      ) : (
                        <span className="text-amber-600">Pendente</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Total */}
              {valorTotal > 0 && (
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {formatCurrency(valorTotal)}
                    </span>
                  </div>
                </div>
              )}
              
              {os.aprovado !== null && (
                <div className={`p-3 rounded-lg ${os.aprovado ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={os.aprovado ? 'text-green-700' : 'text-red-700'}>
                    {os.aprovado ? 'Orçamento aprovado pelo cliente' : 'Orçamento recusado pelo cliente'}
                    {os.dataAprovacao && ` em ${formatDateTime(os.dataAprovacao)}`}
                  </p>
                </div>
              )}

              {/* Assinatura do Cliente */}
              {os.assinatura && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium mb-2">OS assinada pelo cliente</p>
                  <img 
                    src={os.assinatura.imagem} 
                    alt="Assinatura" 
                    className="max-h-16 bg-white rounded border"
                  />
                  {os.assinatura.nome && (
                    <p className="text-xs text-green-600 mt-1">
                      Assinado por: {os.assinatura.nome} em {formatDateTime(os.assinatura.criadoEm)}
                    </p>
                  )}
                </div>
              )}
              
              <Button 
                onClick={handleUpdateOrcamento}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {os.historico.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {index < os.historico.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-slate-500">{formatDateTime(item.criadoEm)}</p>
                      <p className="text-slate-900">{item.descricao}</p>
                      {item.status && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {STATUS_LABELS[item.status as StatusOS]}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Cliente */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium text-slate-900">{os.cliente.nome}</p>
              <p className="text-slate-600">{os.cliente.telefone}</p>
              {os.cliente.cpf && (
                <p className="text-slate-600">CPF: {os.cliente.cpf}</p>
              )}
              {os.cliente.email && (
                <p className="text-slate-600">{os.cliente.email}</p>
              )}
              {os.cliente.endereco && (
                <p className="text-slate-600">{os.cliente.endereco}</p>
              )}
            </CardContent>
          </Card>

          {/* Equipamento */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-slate-500">Equipamento</p>
                <p className="font-medium text-slate-900">{os.equipamento}</p>
              </div>
              {os.marca && (
                <div>
                  <p className="text-sm text-slate-500">Marca</p>
                  <p className="text-slate-900">{os.marca}</p>
                </div>
              )}
              {os.modelo && (
                <div>
                  <p className="text-sm text-slate-500">Modelo</p>
                  <p className="text-slate-900">{os.modelo}</p>
                </div>
              )}
              {os.imeiSerial && (
                <div>
                  <p className="text-sm text-slate-500">IMEI/Serial</p>
                  <p className="font-mono text-sm text-slate-900">{os.imeiSerial}</p>
                </div>
              )}
              {os.senhaAparelho && (
                <div>
                  <p className="text-sm text-slate-500">Senha</p>
                  <p className="text-slate-900">{os.senhaAparelho}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Problema */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Problema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-700">{os.problema}</p>
              {os.acessorios && (
                <>
                  <Separator />
                  <p className="text-sm"><span className="text-slate-500">Acessórios:</span> {os.acessorios}</p>
                </>
              )}
              {os.estadoAparelho && (
                <p className="text-sm"><span className="text-slate-500">Estado:</span> {os.estadoAparelho}</p>
              )}
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/os/${os.id}`)}`}
                alt="QR Code"
                className="w-32 h-32"
              />
              <p className="text-sm text-slate-500 mt-2">Escaneie para acessar a OS</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
