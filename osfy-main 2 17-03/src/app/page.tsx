'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Smartphone, 
  Monitor, 
  Tv, 
  Gamepad2, 
  Wrench, 
  CheckCircle, 
  Zap, 
  Shield, 
  Clock, 
  Users,
  Menu,
  X,
  ArrowRight,
  Star,
  BarChart3,
  MessageSquare,
  QrCode,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const features = [
  {
    icon: Zap,
    title: 'Rápido e Simples',
    description: 'Crie ordens de serviço em segundos, sem complicações. Interface intuitiva que qualquer técnico domina rapidamente.'
  },
  {
    icon: Eye,
    title: 'Acompanhamento Online',
    description: 'Seus clientes acompanham o reparo em tempo real por link direto. Sem necessidade de login ou cadastro.'
  },
  {
    icon: MessageSquare,
    title: 'Menos WhatsApp',
    description: 'Reduza até 80% das mensagens perguntando "como está meu aparelho?". O cliente vê tudo online.'
  },
  {
    icon: QrCode,
    title: 'QR Code na Etiqueta',
    description: 'Imprima etiquetas com QR Code. Cliente escaneia e acompanha o serviço instantaneamente.'
  },
  {
    icon: Shield,
    title: 'Multi-Loja Seguro',
    description: 'Cada loja tem seus dados isolados. Sistema SaaS seguro e escalável para múltiplas assistências.'
  },
  {
    icon: BarChart3,
    title: 'Dashboard Completo',
    description: 'Visualize todas as OS, faturamento, e performance do seu negócio em um painel intuitivo.'
  }
]

const benefits = [
  'Crie OS em menos de 30 segundos',
  'Cliente acompanha sem precisar de login',
  'Timeline visual do reparo',
  'Aprovação de orçamento online',
  'Recibo com campo para assinatura do cliente',
  'Histórico completo de cada aparelho',
  'Fotos do antes e depois',
  'QR Code para cada ordem',
  'Notificações automáticas no WhatsApp',
  'Página pública da sua loja com SEO'
]

const serviceTypes = [
  { icon: Smartphone, label: 'Celulares' },
  { icon: Monitor, label: 'Computadores' },
  { icon: Monitor, label: 'Notebooks' },
  { icon: Tv, label: 'TVs' },
  { icon: Gamepad2, label: 'Videogames' },
  { icon: Wrench, label: 'Eletrônicos' }
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginSenha, setLoginSenha] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailTrimmed = loginEmail.trim().toLowerCase()
    
    if (!emailTrimmed || !loginSenha.trim()) {
      toast.error('Preencha todos os campos')
      return
    }
    
    setLoginLoading(true)

    try {
      console.log('[FRONTEND] Enviando login:', { email: emailTrimmed })
      
      // Login com detecção automática de tipo
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrimmed,
          senha: loginSenha,
          tipo: 'auto' // Detecção automática
        })
      })

      const data = await response.json()
      console.log('[FRONTEND] Resposta:', data)

      if (data.success) {
        toast.success('Login realizado com sucesso!')
        
        // Limpar campos
        setLoginEmail('')
        setLoginSenha('')
        
        // Fechar diálogo
        setLoginOpen(false)
        setLoginLoading(false)
        
        // Redirecionar baseado no tipo detectado
        const destino = data.tipo === 'superadmin' ? '/superadmin' : '/painel'
        console.log('[FRONTEND] Redirecionando para:', destino)
        
        // Pequeno delay para garantir que o cookie foi salvo
        setTimeout(() => {
          window.location.href = destino
        }, 500)
      } else {
        console.error('[FRONTEND] Erro no login:', data.error)
        toast.error(data.error || 'Erro ao fazer login')
        setLoginLoading(false)
      }
    } catch (err) {
      console.error('[FRONTEND] Erro de conexão:', err)
      toast.error('Erro ao conectar com o servidor')
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              TecOS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#recursos" className="text-slate-600 hover:text-emerald-600 transition-colors">
              Recursos
            </a>
            <a href="#beneficios" className="text-slate-600 hover:text-emerald-600 transition-colors">
              Benefícios
            </a>
            <a href="#como-funciona" className="text-slate-600 hover:text-emerald-600 transition-colors">
              Como Funciona
            </a>
            <a href="#preco" className="text-slate-600 hover:text-emerald-600 transition-colors">
              Preço
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-slate-600">
                  Entrar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Entrar no TecOS</DialogTitle>
                  <DialogDescription>
                    Acesse o painel da sua loja ou a área administrativa
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="text"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-senha">Senha</Label>
                    <Input
                      id="login-senha"
                      type="password"
                      placeholder="••••••••"
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700" 
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Link href="/criar-loja">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                Criar Minha Loja <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-4">
            <nav className="space-y-3">
              <a href="#recursos" className="block text-slate-600 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>
                Recursos
              </a>
              <a href="#beneficios" className="block text-slate-600 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>
                Benefícios
              </a>
              <a href="#como-funciona" className="block text-slate-600 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>
                Como Funciona
              </a>
              <a href="#preco" className="block text-slate-600 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>
                Preço
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => { setLoginOpen(true); setMobileMenuOpen(false) }}>
                Entrar
              </Button>
              <Link href="/criar-loja" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Criar Minha Loja
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 bg-emerald-50 text-emerald-700 border-emerald-200">
            <Star className="w-4 h-4 mr-2" />
            Sistema #1 para Assistências Técnicas
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Sistema de OS que{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              seu cliente ama
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Crie ordens de serviço em segundos. Seus clientes acompanham o reparo online, 
            sem precisar de login. Reduza mensagens no WhatsApp e fidelize mais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/criar-loja">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 gap-2 px-8">
                Criar Minha Loja Grátis <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="outline" className="px-8">
                Ver Como Funciona
              </Button>
            </a>
          </div>

          {/* Service Types */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {serviceTypes.map((type) => (
              <div
                key={type.label}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm"
              >
                <type.icon className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-slate-600">{type.label}</span>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl -z-10" />
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-slate-500">painel.tecos.com</span>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'OS em Aberto', value: '12', color: 'bg-blue-500' },
                    { label: 'Em Manutenção', value: '8', color: 'bg-amber-500' },
                    { label: 'Aguardando Peça', value: '3', color: 'bg-purple-500' },
                    { label: 'Prontas', value: '15', color: 'bg-green-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className={`w-8 h-8 ${stat.color} rounded-lg mb-2`} />
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Últimas Ordens de Serviço</h3>
                    <Badge variant="secondary">Hoje</Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      { os: '#84723', cliente: 'João Silva', equip: 'Samsung A20', status: 'Em manutenção' },
                      { os: '#84722', cliente: 'Maria Santos', equip: 'iPhone 12', status: 'Pronto' },
                      { os: '#84721', cliente: 'Pedro Costa', equip: 'PS5', status: 'Aguardando peça' },
                    ].map((item) => (
                      <div key={item.os} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-emerald-600">{item.os}</span>
                          <span className="text-slate-900">{item.cliente}</span>
                          <span className="text-slate-500 text-sm">{item.equip}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Funcionalidades pensadas para facilitar o dia a dia da sua assistência técnica
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Como funciona?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Em 3 passos simples, sua assistência já está funcionando com o TecOS
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-200 -translate-x-1/2 hidden md:block" />
              
              {[
                {
                  step: 1,
                  title: 'Crie sua loja',
                  description: 'Cadastre sua assistência em minutos. Escolha o nome, configure os serviços e tipos de reparo oferecidos.',
                  icon: Users,
                  side: 'left'
                },
                {
                  step: 2,
                  title: 'Atenda seus clientes',
                  description: 'Crie ordens de serviço rapidamente. O sistema gera automaticamente um link único para cada OS.',
                  icon: Wrench,
                  side: 'right'
                },
                {
                  step: 3,
                  title: 'Cliente acompanha online',
                  description: 'O cliente acessa o link e vê todo o progresso do reparo. Fotos, status, orçamento e muito mais.',
                  icon: Eye,
                  side: 'left'
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className={`relative flex items-center gap-8 mb-12 ${
                    item.side === 'right' ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className={`flex-1 ${item.side === 'right' ? 'md:text-right' : ''}`}>
                    <Card className="border-slate-200">
                      <CardHeader>
                        <Badge className="w-fit mb-2 bg-emerald-600">
                          Passo {item.step}
                        </Badge>
                        <CardTitle>{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-full text-white font-bold z-10">
                    {item.step}
                  </div>
                  
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que assistências escolhem o TecOS?
              </h2>
              <p className="text-emerald-100 text-lg mb-8">
                Desenvolvido por quem entende o dia a dia de uma assistência técnica. 
                Cada funcionalidade resolve um problema real.
              </p>
              
              <div className="space-y-4">
                {benefits.slice(0, 5).map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Link href="/criar-loja" className="inline-block mt-8">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2">
                  Começar Agora <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Mais benefícios</h3>
              <div className="space-y-4">
                {benefits.slice(5).map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preco" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Preço que cabe no seu bolso
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Um único plano com todas as funcionalidades. Sem surpresas.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-2 border-emerald-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                MAIS POPULAR
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Plano Completo</CardTitle>
                <CardDescription>Tudo que você precisa para sua assistência</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900">R$99,90</span>
                  <span className="text-slate-600">/mês</span>
                  <p className="text-sm text-slate-500 mt-1">ou R$999/ano (7 dias grátis)</p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3 text-left mb-6">
                  {[
                    'Ordens de serviço ilimitadas',
                    'Histórico de até 100 OS',
                    'Página pública da sua loja',
                    'Timeline visual do reparo',
                    'Aprovação de orçamento online',
                    'QR Code para cada OS',
                    'Campo para assinatura no recibo',
                    'Suporte via WhatsApp',
                    'Sem taxa de setup'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
                
                <Link href="/criar-loja">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                    Criar Minha Loja
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Pronto para transformar sua assistência?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
            Junte-se a centenas de assistências que já usam o TecOS para gerenciar seus reparos.
          </p>
          <Link href="/criar-loja">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 gap-2 px-8">
              Criar Minha Loja Grátis <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TecOS</span>
            </div>
            
            <p className="text-sm">
              © {new Date().getFullYear()} TecOS. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
