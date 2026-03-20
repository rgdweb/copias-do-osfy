'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, CreditCard, QrCode, FileText, Copy, ExternalLink,
  CheckCircle, Loader2, LogOut, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface FaturaPendente {
  id: string
  numeroFatura: number
  valor: number
  valorComJuros: number
  dataVencimento: string
  diasAtraso: number
  codigoPix: string | null
  qrCodePix: string | null
  linkBoleto: string | null
  linkPagamento: string | null
}

interface StatusBloqueio {
  success: boolean
  loja: {
    nome: string
    email: string
  }
  status: string
  diasAtraso: number
  valorTotal: number
  valorComJuros: number
  faturas: FaturaPendente[]
}

export default function AcessoBloqueadoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [status, setStatus] = useState<StatusBloqueio | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'boleto' | 'link'>('pix')
  const [faturaSelecionada, setFaturaSelecionada] = useState<FaturaPendente | null>(null)

  useEffect(() => {
    carregarStatus()
  }, [])

  const carregarStatus = async () => {
    try {
      const response = await fetch('/api/painel/status-pagamento')
      const data = await response.json()

      if (data.success) {
        // Se não está bloqueado, redirecionar para o painel
        if (data.status !== 'bloqueado' && data.status !== 'atrasado') {
          router.push('/painel')
          return
        }

        setStatus(data)

        // Selecionar primeira fatura por padrão
        if (data.faturas && data.faturas.length > 0) {
          setFaturaSelecionada(data.faturas[0])
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const gerarNovaCobranca = async () => {
    setGerando(true)
    try {
      const response = await fetch('/api/painel/gerar-cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPlano: 'mensal',
          formaPagamento: 'UNDEFINED'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Nova cobrança gerada!')
        carregarStatus()
      } else {
        toast.error(data.error || 'Erro ao gerar cobrança')
      }
    } catch (error) {
      toast.error('Erro ao gerar cobrança')
    } finally {
      setGerando(false)
    }
  }

  const copiarPix = () => {
    if (faturaSelecionada?.codigoPix) {
      navigator.clipboard.writeText(faturaSelecionada.codigoPix)
      toast.success('Código PIX copiado!')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  // Calcular valor total com juros
  const valorTotalComJuros = status?.faturas?.reduce((acc, f) => acc + (f.valorComJuros || f.valor), 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-red-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-red-600">TecOS</span>
              <p className="text-xs text-slate-500">Acesso Restrito</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Alert Principal */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-200">
              <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Acesso Bloqueado
            </h1>
            <p className="text-slate-600 text-lg">
              {status?.loja.nome}, seu acesso foi bloqueado por falta de pagamento.
            </p>
            <p className="text-red-600 font-medium mt-2">
              {status?.diasAtraso} dias de atraso
            </p>
          </div>

          {/* Card de Débito */}
          <Card className="border-red-200 mb-6 overflow-hidden">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Regularize sua Pendência
              </CardTitle>
              <CardDescription>
                Seu sistema está bloqueado. Realize o pagamento para reativar o acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Total a Pagar */}
              <div className="bg-gradient-to-r from-red-100 to-orange-50 rounded-xl p-6 mb-6 border border-red-200">
                <p className="text-sm text-slate-600 mb-1">Total a Pagar (com juros e multa)</p>
                <p className="text-4xl font-bold text-red-600">
                  R$ {valorTotalComJuros.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  * Inclui juros de 1% ao mês + multa de 2%
                </p>
              </div>

              {/* Lista de Faturas */}
              {status?.faturas && status.faturas.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">Fatura(s) Pendente(s):</p>
                  <div className="space-y-2">
                    {status.faturas.map((fatura) => (
                      <button
                        key={fatura.id}
                        onClick={() => setFaturaSelecionada(fatura)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          faturaSelecionada?.id === fatura.id
                            ? 'border-red-500 bg-red-50'
                            : 'border-slate-200 hover:border-red-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Fatura #{fatura.numeroFatura}</p>
                            <p className="text-sm text-slate-500">
                              Venceu em {new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm line-through text-slate-400">
                              R$ {fatura.valor.toFixed(2).replace('.', ',')}
                            </p>
                            <p className="font-bold text-red-600">
                              R$ {fatura.valorComJuros.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opções de Pagamento */}
              {faturaSelecionada && (
                <>
                  {/* Se já tem QR Code, mostrar */}
                  {faturaSelecionada.qrCodePix ? (
                    <>
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <button
                          onClick={() => setFormaPagamento('pix')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formaPagamento === 'pix' ? 'border-red-500 bg-red-50' : 'border-slate-200'
                          }`}
                        >
                          <QrCode className={`w-6 h-6 mx-auto mb-1 ${formaPagamento === 'pix' ? 'text-red-600' : 'text-slate-400'}`} />
                          <p className="text-sm font-medium">PIX</p>
                          <p className="text-xs text-emerald-600">Mais rápido</p>
                        </button>
                        <button
                          onClick={() => setFormaPagamento('boleto')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formaPagamento === 'boleto' ? 'border-red-500 bg-red-50' : 'border-slate-200'
                          }`}
                        >
                          <FileText className={`w-6 h-6 mx-auto mb-1 ${formaPagamento === 'boleto' ? 'text-red-600' : 'text-slate-400'}`} />
                          <p className="text-sm font-medium">Boleto</p>
                          <p className="text-xs text-slate-500">3 dias úteis</p>
                        </button>
                        <button
                          onClick={() => setFormaPagamento('link')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formaPagamento === 'link' ? 'border-red-500 bg-red-50' : 'border-slate-200'
                          }`}
                        >
                          <ExternalLink className={`w-6 h-6 mx-auto mb-1 ${formaPagamento === 'link' ? 'text-red-600' : 'text-slate-400'}`} />
                          <p className="text-sm font-medium">Cartão</p>
                          <p className="text-xs text-slate-500">Link externo</p>
                        </button>
                      </div>

                      {formaPagamento === 'pix' && (
                        <div className="text-center bg-slate-50 rounded-xl p-6">
                          <p className="text-sm text-slate-600 mb-4">Escaneie o QR Code</p>
                          <img
                            src={`data:image/png;base64,${faturaSelecionada.qrCodePix}`}
                            alt="QR Code PIX"
                            className="mx-auto w-48 h-48 rounded-lg shadow-lg"
                          />
                          {faturaSelecionada.codigoPix && (
                            <Button onClick={copiarPix} className="mt-4 bg-red-600 hover:bg-red-700">
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Código PIX
                            </Button>
                          )}
                        </div>
                      )}

                      {formaPagamento === 'boleto' && faturaSelecionada.linkBoleto && (
                        <div className="text-center bg-slate-50 rounded-xl p-6">
                          <FileText className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                          <Button
                            onClick={() => window.open(faturaSelecionada.linkBoleto || '', '_blank')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir Boleto
                          </Button>
                        </div>
                      )}

                      {formaPagamento === 'link' && faturaSelecionada.linkPagamento && (
                        <div className="text-center bg-slate-50 rounded-xl p-6">
                          <CreditCard className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                          <Button
                            onClick={() => window.open(faturaSelecionada.linkPagamento || '', '_blank')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Pagar com Cartão
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    // Se não tem QR Code, botão para gerar
                    <div className="text-center">
                      <Button
                        onClick={gerarNovaCobranca}
                        disabled={gerando}
                        className="bg-red-600 hover:bg-red-700 h-14 text-lg px-8"
                      >
                        {gerando ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Gerar Pagamento
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Info de ativação automática */}
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Ativação Automática</p>
                    <p className="text-xs text-emerald-600">
                      Assim que o pagamento for confirmado, seu acesso será liberado automaticamente em instantes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={carregarStatus}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Já paguei, verificar
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500 mt-8">
            <p>Precisa de ajuda? Entre em contato pelo suporte</p>
            <p className="mt-2">
              Ao continuar, você concorda com nossos{' '}
              <Link href="/termos-de-uso" className="text-red-600 hover:underline">Termos de Uso</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
