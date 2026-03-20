'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock, CreditCard, QrCode, FileText, Copy, ExternalLink, CheckCircle, Loader2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface StatusData {
  success: boolean
  loja: {
    nome: string
  }
  valores: {
    mensalidade: number
    anuidade: number
  }
}

export default function TrialExpiradoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [status, setStatus] = useState<StatusData | null>(null)
  const [tipoPlano, setTipoPlano] = useState<'mensal' | 'anual'>('mensal')
  const [cobranca, setCobranca] = useState<{
    valor: number
    codigoPix: string | null
    qrCodePix: string | null
    linkBoleto: string | null
    linkPagamento: string | null
  } | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'boleto' | 'link'>('pix')

  useEffect(() => {
    fetch('/api/painel/status-pagamento')
      .then(res => res.json())
      .then(data => {
        setStatus(data)
        // Se não está com trial expirado, redirecionar
        if (data.status !== 'trial_expirado' && data.status !== 'pendente') {
          router.push('/painel')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const gerarCobranca = async () => {
    setGerando(true)
    try {
      const response = await fetch('/api/painel/gerar-cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPlano,
          formaPagamento: 'UNDEFINED'
        })
      })

      const data = await response.json()

      if (data.success) {
        setCobranca({
          valor: data.fatura.valor,
          codigoPix: data.fatura.codigoPix,
          qrCodePix: data.fatura.qrCodePix,
          linkBoleto: data.fatura.linkBoleto,
          linkPagamento: data.fatura.linkPagamento
        })
        toast.success('Cobrança gerada com sucesso!')
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
    if (cobranca?.codigoPix) {
      navigator.clipboard.writeText(cobranca.codigoPix)
      toast.success('Código PIX copiado!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              TecOS
            </span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Alert */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Período de Teste Encerrado
            </h1>
            <p className="text-slate-600 text-lg">
              {status?.loja.nome ? `${status.loja.nome}, seus` : 'Seus'} 7 dias grátis acabaram.
              <br />
              Escolha um plano para continuar usando o TecOS!
            </p>
          </div>

          {/* Já tem cobrança gerada */}
          {cobranca && (
            <Card className="border-slate-200 mb-6 overflow-hidden">
              <CardHeader className="bg-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                  Pagamento Gerado!
                </CardTitle>
                <CardDescription>
                  Escolha como deseja pagar
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-500">Valor a pagar</p>
                  <p className="text-4xl font-bold text-emerald-600">
                    R$ {cobranca.valor.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-sm text-slate-500">
                    Plano {tipoPlano === 'anual' ? 'Anual' : 'Mensal'}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => setFormaPagamento('pix')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formaPagamento === 'pix' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                    }`}
                  >
                    <QrCode className={`w-6 h-6 mx-auto mb-1 ${formaPagamento === 'pix' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <p className="text-sm font-medium">PIX</p>
                  </button>
                  <button
                    onClick={() => setFormaPagamento('boleto')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formaPagamento === 'boleto' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                    }`}
                  >
                    <FileText className={`w-6 h-6 mx-auto mb-1 ${formaPagamento === 'boleto' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <p className="text-sm font-medium">Boleto</p>
                  </button>
                  <button
                    onClick={() => setFormaPagamento('link')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formaPagamento === 'link' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                    }`}
                  >
                    <ExternalLink className={`w-6 h-6 mx-auto mb-1 ${formaPagamento === 'link' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <p className="text-sm font-medium">Link</p>
                  </button>
                </div>

                {formaPagamento === 'pix' && cobranca.qrCodePix && (
                  <div className="text-center bg-slate-50 rounded-xl p-6">
                    <p className="text-sm text-slate-600 mb-4">Escaneie o QR Code</p>
                    <img
                      src={`data:image/png;base64,${cobranca.qrCodePix}`}
                      alt="QR Code PIX"
                      className="mx-auto w-56 h-56 rounded-lg shadow-lg"
                    />
                    {cobranca.codigoPix && (
                      <Button onClick={copiarPix} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Código PIX
                      </Button>
                    )}
                  </div>
                )}

                {formaPagamento === 'boleto' && cobranca.linkBoleto && (
                  <div className="text-center bg-slate-50 rounded-xl p-6">
                    <FileText className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                    <Button
                      onClick={() => window.open(cobranca.linkBoleto || '', '_blank')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Boleto
                    </Button>
                  </div>
                )}

                {formaPagamento === 'link' && cobranca.linkPagamento && (
                  <div className="text-center bg-slate-50 rounded-xl p-6">
                    <CreditCard className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                    <Button
                      onClick={() => window.open(cobranca.linkPagamento || '', '_blank')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Página de Pagamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Escolha de plano */}
          {!cobranca && (
            <Card className="border-slate-200 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Escolha seu Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {/* Mensal */}
                  <button
                    onClick={() => setTipoPlano('mensal')}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                      tipoPlano === 'mensal' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                    }`}
                  >
                    {tipoPlano === 'mensal' && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                    <p className="font-semibold text-lg">Mensal</p>
                    <p className="text-4xl font-bold text-slate-900">
                      R$ {status?.valores.mensalidade.toFixed(2).replace('.', ',')}
                      <span className="text-base font-normal text-slate-500">/mês</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-2">Cancele quando quiser</p>
                  </button>

                  {/* Anual */}
                  <button
                    onClick={() => setTipoPlano('anual')}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                      tipoPlano === 'anual' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      2 MESES GRÁTIS
                    </div>
                    {tipoPlano === 'anual' && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                    <p className="font-semibold text-lg">Anual</p>
                    <p className="text-4xl font-bold text-slate-900">
                      R$ {status?.valores.anuidade.toFixed(2).replace('.', ',')}
                      <span className="text-base font-normal text-slate-500">/ano</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Economize R$ {status ? ((status.valores.mensalidade * 12 - status.valores.anuidade).toFixed(0)) : '0'}
                    </p>
                  </button>
                </div>

                <Button
                  onClick={gerarCobranca}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-lg"
                  disabled={gerando}
                >
                  {gerando ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Continuar - R$ {tipoPlano === 'anual'
                        ? status?.valores.anuidade.toFixed(2).replace('.', ',')
                        : status?.valores.mensalidade.toFixed(2).replace('.', ',')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <div className="text-center text-sm text-slate-500">
            <p>Precisa de ajuda? Entre em contato pelo WhatsApp</p>
            <p className="mt-2">
              Ao continuar, você concorda com nossos{' '}
              <Link href="/termos-de-uso" className="text-emerald-600 hover:underline">Termos de Uso</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
