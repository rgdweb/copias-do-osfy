'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Wrench,
  CheckCircle,
  Circle,
  User,
  Smartphone,
  Monitor,
  Tv,
  Gamepad2,
  QrCode,
  Camera,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  PenTool
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { STATUS_LABELS, STATUS_COLORS, type StatusOS } from '@/types'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { OrdemServico, Loja, Cliente, HistoricoOS, FotoOS, Assinatura } from '@prisma/client'
import { SignatureCanvas } from '@/components/ui/signature-canvas'

interface OSPageClientProps {
  os: OrdemServico & {
    loja: Loja
    cliente: Cliente
    historico: HistoricoOS[]
    fotos: FotoOS[]
    assinatura: Assinatura | null
  }
}

const STATUS_ORDER: StatusOS[] = [
  'recebido',
  'em_analise',
  'aguardando_aprovacao',
  'aguardando_peca',
  'em_manutencao',
  'em_testes',
  'pronto',
  'entregue'
]

const STATUS_ICONS: Record<StatusOS, React.ReactNode> = {
  recebido: <Circle className="w-5 h-5" />,
  em_analise: <FileText className="w-5 h-5" />,
  aguardando_aprovacao: <AlertCircle className="w-5 h-5" />,
  aguardando_peca: <Clock className="w-5 h-5" />,
  em_manutencao: <Wrench className="w-5 h-5" />,
  em_testes: <Monitor className="w-5 h-5" />,
  pronto: <CheckCircle className="w-5 h-5" />,
  entregue: <CheckCircle className="w-5 h-5" />
}

const FORMAS_PAGAMENTO: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto',
  crediario: 'Crediário'
}

// Função para imprimir a OS (1 via - recibo para o cliente)
const imprimirOS = (os: OSPageClientProps['os']) => {
  const valorTotal = (os.valorServico || 0) + (os.valorPecas || 0)
  
  const conteudo = `
<!DOCTYPE html>
<html>
<head>
  <title>OS #${os.numeroOs} - ${os.loja.nome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { 
      size: A4; 
      margin: 10mm;
    }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px; 
      background: white;
    }
    .via {
      background: white;
      padding: 5mm;
      max-width: 190mm;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #10b981;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header h1 { font-size: 20px; color: #10b981; margin-bottom: 5px; }
    .header p { color: #666; font-size: 11px; }
    .os-numero {
      text-align: right;
      font-size: 12px;
      color: #666;
      margin-bottom: 15px;
    }
    .os-numero strong { font-size: 16px; color: #333; }
    .section { margin-bottom: 12px; }
    .section-title {
      background: #f3f4f6;
      padding: 6px 10px;
      font-weight: bold;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .field { margin-bottom: 6px; }
    .field-label { font-weight: bold; color: #666; font-size: 10px; text-transform: uppercase; }
    .field-value { color: #333; font-size: 12px; }
    .problema-box {
      border: 1px solid #e5e7eb;
      padding: 10px;
      border-radius: 4px;
      background: #fafafa;
      font-size: 12px;
    }
    .valores { margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 12px; }
    .valor-linha { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
    .valor-total { font-weight: bold; font-size: 14px; border-top: 2px solid #333; padding-top: 8px; margin-top: 5px; }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
    }
    .pago-info {
      margin-top: 8px;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
    }
    .pago { background: #d1fae5; color: #065f46; }
    .pendente { background: #fef3c7; color: #92400e; }
    .assinatura-area {
      margin-top: 30px;
      border-top: 1px solid #333;
      padding-top: 10px;
      text-align: center;
    }
    .assinatura-linha {
      margin-top: 40px;
      border-top: 1px solid #333;
      padding-top: 5px;
      font-size: 11px;
    }
    .assinatura-img {
      max-height: 60px;
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="via">
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
      ${os.formaPagamento ? `<div class="valor-linha"><span>Forma de Pagamento:</span><span>${FORMAS_PAGAMENTO[os.formaPagamento] || os.formaPagamento}</span></div>` : ''}
      <div class="pago-info ${os.pago ? 'pago' : 'pendente'}">
        ${os.pago ? '✓ PAGO' : 'PENDENTE'}
      </div>
    </div>
    ` : ''}
    
    <div class="assinatura-area">
      <p style="font-size: 11px; margin-bottom: 10px;">Assinatura do Cliente:</p>
      ${os.assinatura ? `<img src="${os.assinatura.imagem}" class="assinatura-img" alt="Assinatura" />` : ''}
      <div class="assinatura-linha">_________________________________</div>
    </div>
    
    <div class="footer">
      <p>TecOS - Sistema de Gestão de Ordens de Serviço</p>
      <p>Acompanhe sua OS em: https://tec-os.vercel.app/os/${os.id}</p>
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

export function OSPageClient({ os }: OSPageClientProps) {
  const [mostrarFotos, setMostrarFotos] = useState(false)
  const [aprovando, setAprovando] = useState(false)
  const [mostrarAssinatura, setMostrarAssinatura] = useState(false)
  const [assinando, setAssinando] = useState(false)
  const [nomeAssinatura, setNomeAssinatura] = useState('')

  const currentStatusIndex = STATUS_ORDER.indexOf(os.status as StatusOS)

  const handleAprovarOrcamento = async (aprovado: boolean) => {
    setAprovando(true)

    try {
      const response = await fetch(`/api/os/${os.id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprovado })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(aprovado ? 'Orçamento aprovado!' : 'Orçamento recusado')
        window.location.reload()
      } else {
        toast.error(data.error || 'Erro ao processar aprovação')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setAprovando(false)
    }
  }

  const handleSalvarAssinatura = async (imagem: string) => {
    if (!nomeAssinatura.trim()) {
      toast.error('Por favor, informe seu nome')
      return
    }

    setAssinando(true)

    try {
      const response = await fetch(`/api/os/${os.id}/assinatura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imagem,
          nome: nomeAssinatura 
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Assinatura salva com sucesso!')
        window.location.reload()
      } else {
        toast.error(data.error || 'Erro ao salvar assinatura')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setAssinando(false)
    }
  }

  const handleImprimirEtiqueta = () => {
    imprimirOS(os)
  }

  const valorTotal = (os.valorServico || 0) + (os.valorPecas || 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:static">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {os.loja.logo ? (
                <Image
                  src={os.loja.logo}
                  alt={os.loja.nome}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-900">{os.loja.nome}</h1>
                <p className="text-xs text-slate-500">Ordem de Serviço</p>
              </div>
            </div>
            
            <Badge variant="outline" className="text-lg font-mono">
              OS #{os.numeroOs}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Status Card */}
        <Card className="border-slate-200 mb-6 overflow-hidden">
          <div className={`h-2 ${STATUS_COLORS[os.status as StatusOS]}`} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {STATUS_LABELS[os.status as StatusOS]}
                </CardTitle>
                <CardDescription>
                  Última atualização: {formatDateTime(os.atualizadoEm)}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleImprimirEtiqueta} className="print:hidden">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Timeline Visual */}
        <Card className="border-slate-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Acompanhe o Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {STATUS_ORDER.map((status, index) => {
                const isPast = index < currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const isFuture = index > currentStatusIndex
                
                const historicoItem = os.historico.find(h => h.status === status)

                return (
                  <div key={status} className="flex items-start gap-4 mb-4 last:mb-0">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${isPast ? 'bg-emerald-500 text-white' : ''}
                      ${isCurrent ? 'bg-emerald-500 text-white ring-4 ring-emerald-200' : ''}
                      ${isFuture ? 'bg-slate-200 text-slate-400' : ''}
                    `}>
                      {STATUS_ICONS[status]}
                    </div>
                    
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${isFuture ? 'text-slate-400' : 'text-slate-900'}`}>
                          {STATUS_LABELS[status]}
                        </p>
                        {historicoItem && (
                          <span className="text-xs text-slate-500">
                            {formatDateTime(historicoItem.criadoEm)}
                          </span>
                        )}
                      </div>
                      {historicoItem?.descricao && (
                        <p className="text-sm text-slate-600 mt-1">
                          {historicoItem.descricao}
                        </p>
                      )}
                    </div>
                    
                    {index < STATUS_ORDER.length - 1 && (
                      <div className={`
                        absolute left-5 w-0.5 h-6
                        ${index < currentStatusIndex ? 'bg-emerald-500' : 'bg-slate-200'}
                      `} style={{ top: `${index * 64 + 40}px` }} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Grid Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Equipamento */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Equipamento</span>
                <span className="font-medium text-slate-900">{os.equipamento}</span>
              </div>
              {os.marca && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Marca</span>
                  <span className="font-medium text-slate-900">{os.marca}</span>
                </div>
              )}
              {os.modelo && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Modelo</span>
                  <span className="font-medium text-slate-900">{os.modelo}</span>
                </div>
              )}
              {os.imeiSerial && (
                <div className="flex justify-between">
                  <span className="text-slate-500">IMEI/Serial</span>
                  <span className="font-mono text-sm text-slate-900">{os.imeiSerial}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Nome</span>
                <span className="font-medium text-slate-900">{os.cliente.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Telefone</span>
                <a href={`tel:${os.cliente.telefone}`} className="text-emerald-600">
                  {os.cliente.telefone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data de Entrada</span>
                <span className="text-slate-900">{formatDate(os.dataCriacao)}</span>
              </div>
              {os.dataPrevisao && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Previsão de Entrega</span>
                  <span className="text-slate-900">{formatDate(os.dataPrevisao)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Problema e Diagnóstico */}
        <Card className="border-slate-200 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Problema Relatado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{os.problema}</p>
            
            {os.acessorios && (
              <>
                <Separator className="my-4" />
                <div>
                  <span className="text-slate-500">Acessórios entregues: </span>
                  <span className="text-slate-700">{os.acessorios}</span>
                </div>
              </>
            )}
            
            {os.estadoAparelho && (
              <div className="mt-2">
                <span className="text-slate-500">Estado do aparelho: </span>
                <span className="text-slate-700">{os.estadoAparelho}</span>
              </div>
            )}
            
            {os.diagnostico && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Diagnóstico</h4>
                  <p className="text-slate-700">{os.diagnostico}</p>
                </div>
              </>
            )}
            
            {os.solucao && (
              <div className="mt-4">
                <h4 className="font-medium text-slate-900 mb-1">Solução Aplicada</h4>
                <p className="text-slate-700">{os.solucao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orçamento e Pagamento */}
        {(os.orcamento || valorTotal > 0) && (
          <Card className="border-slate-200 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Valores e Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {os.orcamento && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-slate-900">
                    Orçamento: {formatCurrency(os.orcamento)}
                  </span>
                  {os.aprovado !== null && (
                    <Badge className={os.aprovado ? 'bg-green-500' : 'bg-red-500'}>
                      {os.aprovado ? 'Aprovado' : 'Não aprovado'}
                    </Badge>
                  )}
                </div>
              )}
              
              {valorTotal > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <div className="space-y-2">
                    {os.valorServico && os.valorServico > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Serviço:</span>
                        <span className="font-medium">{formatCurrency(os.valorServico)}</span>
                      </div>
                    )}
                    {os.valorPecas && os.valorPecas > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Peças:</span>
                        <span className="font-medium">{formatCurrency(os.valorPecas)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(valorTotal)}</span>
                    </div>
                    {os.formaPagamento && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Forma de Pagamento:</span>
                        <span className="font-medium">{FORMAS_PAGAMENTO[os.formaPagamento] || os.formaPagamento}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge className={os.pago ? 'bg-green-500' : 'bg-amber-500'}>
                        {os.pago ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {os.aprovado === null && os.status === 'aguardando_aprovacao' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleAprovarOrcamento(true)}
                    disabled={aprovando}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar Orçamento
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleAprovarOrcamento(false)}
                    disabled={aprovando}
                  >
                    Não Aprovar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fotos */}
        {os.fotos.length > 0 && (
          <Card className="border-slate-200 mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  Fotos ({os.fotos.length})
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMostrarFotos(!mostrarFotos)}
                >
                  {mostrarFotos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {mostrarFotos && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {os.fotos.map((foto) => (
                    <div key={foto.id} className="relative group">
                      <img
                        src={foto.arquivo}
                        alt={foto.descricao || 'Foto da OS'}
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                      {foto.descricao && (
                        <p className="text-xs text-slate-500 mt-1">{foto.descricao}</p>
                      )}
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                        {foto.tipo}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Assinatura Digital */}
        <Card className="border-slate-200 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="w-5 h-5 text-emerald-600" />
              Assinatura Digital
            </CardTitle>
            <CardDescription>
              Assine esta ordem de serviço para confirmar o recebimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {os.assinatura ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium mb-2">
                    Documento assinado digitalmente
                  </p>
                  <img
                    src={os.assinatura.imagem}
                    alt="Assinatura"
                    className="max-h-24 bg-white rounded border p-2"
                  />
                  {os.assinatura.nome && (
                    <p className="text-sm text-green-600 mt-2">
                      Assinado por: <strong>{os.assinatura.nome}</strong>
                    </p>
                  )}
                  <p className="text-xs text-green-500 mt-1">
                    em {formatDateTime(os.assinatura.criadoEm)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!mostrarAssinatura ? (
                  <Button 
                    onClick={() => setMostrarAssinatura(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Assinar Documento
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeAssinatura">Seu Nome *</Label>
                      <Input
                        id="nomeAssinatura"
                        placeholder="Digite seu nome completo"
                        value={nomeAssinatura}
                        onChange={(e) => setNomeAssinatura(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Sua Assinatura</Label>
                      <div className="mt-2">
                        <SignatureCanvas 
                          onSave={handleSalvarAssinatura}
                          onCancel={() => setMostrarAssinatura(false)}
                          width={400}
                          height={150}
                        />
                      </div>
                    </div>
                    
                    {assinando && (
                      <p className="text-sm text-slate-500 text-center">
                        Salvando assinatura...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="border-slate-200 mb-6 print:break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              QR Code da OS
            </CardTitle>
            <CardDescription>
              Escaneie para acessar esta página rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/os/${os.id}`)}`}
                alt="QR Code"
                className="w-36 h-36"
              />
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
              OS #{os.numeroOs} - {os.equipamento}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {os.cliente.nome}
            </p>
          </CardContent>
        </Card>

        {/* Contato da Loja */}
        <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Precisa de Ajuda?</CardTitle>
            <CardDescription>
              Entre em contato com {os.loja.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={`tel:${os.loja.telefone}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar
                </Button>
              </a>
              <a 
                href={`https://wa.me/55${os.loja.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre a OS #${os.numeroOs}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </a>
            </div>
            
            <div className="mt-4 flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{os.loja.endereco}, {os.loja.cidade} - {os.loja.estado}</span>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-8 print:hidden">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Powered by <span className="text-emerald-400">TecOS</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
