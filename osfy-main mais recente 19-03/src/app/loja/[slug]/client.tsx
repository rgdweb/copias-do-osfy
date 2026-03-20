'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Wrench,
  Search,
  Star,
  Shield,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loja } from '@prisma/client'

interface LojaPageClientProps {
  loja: Loja & {
    _count?: {
      ordens: number
      clientes: number
    }
  }
}

export function LojaPageClient({ loja }: LojaPageClientProps) {
  const router = useRouter()
  const [numeroOs, setNumeroOs] = useState('')
  const [buscando, setBuscando] = useState(false)

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!numeroOs.trim()) {
      toast.error('Digite o número da OS')
      return
    }

    setBuscando(true)

    // Buscar a OS pelo número
    try {
      const response = await fetch(`/api/os/consultar?lojaId=${loja.id}&numeroOs=${numeroOs}`)
      const data = await response.json()

      if (data.success && data.osId) {
        router.push(`/os/${data.osId}`)
      } else {
        toast.error('Ordem de serviço não encontrada')
      }
    } catch {
      toast.error('Erro ao buscar ordem de serviço')
    } finally {
      setBuscando(false)
    }
  }

  const tiposServico = loja.tiposServico?.split(',').map(t => t.trim()) || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {loja.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={loja.logo}
                  alt={loja.nome}
                  width={60}
                  height={60}
                  className="rounded-xl object-cover w-[60px] h-[60px]"
                />
              ) : (
                <div className="w-15 h-15 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{loja.nome}</h1>
                <p className="text-sm text-slate-500">{loja.cidade}, {loja.estado}</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <a href={`tel:${loja.telefone}`}>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar
                </Button>
              </a>
              <a href={`https://wa.me/55${loja.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            <Card className="border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Bem-vindo à {loja.nome}
                </h2>
                <p className="text-emerald-100">
                  {loja.descricao || 'Sua assistência técnica de confiança'}
                </p>
              </div>
              
              {loja.tiposServico && (
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Serviços Oferecidos</h3>
                  <div className="flex flex-wrap gap-2">
                    {tiposServico.map((tipo) => (
                      <Badge key={tipo} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {tipo}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Consultar OS */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <Search className="w-5 h-5" />
                  Consultar Ordem de Serviço
                </CardTitle>
                <CardDescription>
                  Digite o número da sua OS para acompanhar o status do reparo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConsultar} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label htmlFor="numeroOs" className="sr-only">Número da OS</Label>
                    <Input
                      id="numeroOs"
                      type="text"
                      placeholder="Ex: 84723"
                      value={numeroOs}
                      onChange={(e) => setNumeroOs(e.target.value)}
                      className="text-lg h-12"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8"
                    disabled={buscando}
                  >
                    {buscando ? 'Buscando...' : 'Consultar'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Diferenciais */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="text-center border-slate-200">
                <CardContent className="pt-6">
                  <Shield className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900">Garantia</h3>
                  <p className="text-sm text-slate-500">Serviços com garantia</p>
                </CardContent>
              </Card>
              <Card className="text-center border-slate-200">
                <CardContent className="pt-6">
                  <Zap className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900">Rápido</h3>
                  <p className="text-sm text-slate-500">Reparos ágeis</p>
                </CardContent>
              </Card>
              <Card className="text-center border-slate-200">
                <CardContent className="pt-6">
                  <Star className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900">Qualidade</h3>
                  <p className="text-sm text-slate-500">Peças originais</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Contact */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Entre em Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Endereço</p>
                    <p className="text-sm text-slate-600">{loja.endereco}</p>
                    <p className="text-sm text-slate-600">{loja.cidade} - {loja.estado}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Telefone</p>
                    <a href={`tel:${loja.telefone}`} className="text-sm text-emerald-600 hover:underline">
                      {loja.telefone}
                    </a>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">WhatsApp</p>
                    <a 
                      href={`https://wa.me/55${loja.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      {loja.whatsapp}
                    </a>
                  </div>
                </div>

                {loja.horarioAtendimento && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900">Horário</p>
                        <p className="text-sm text-slate-600">{loja.horarioAtendimento}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">{loja._count?.ordens || 0}</p>
                    <p className="text-sm text-slate-600">OS Realizadas</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">{loja._count?.clientes || 0}</p>
                    <p className="text-sm text-slate-600">Clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Button */}
            <a 
              href={`https://wa.me/55${loja.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vi seu perfil no TecOS e gostaria de mais informações.')}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg">
                <MessageCircle className="w-6 h-6 mr-2" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} {loja.nome}. Todos os direitos reservados.
          </p>
          <p className="text-xs mt-2">
            Powered by <span className="text-emerald-400">TecOS</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
