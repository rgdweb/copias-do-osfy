'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wrench, ArrowLeft, CheckCircle, MessageCircle, Lock, MapPin, Building, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIPOS_SERVICO, ESTADOS_BRASIL } from '@/types'
import { toast } from 'sonner'

export default function CriarLojaPage() {
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [lojaSlug, setLojaSlug] = useState('')
  
  // Estados simples para cada campo
  const [nome, setNome] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [endereco, setEndereco] = useState('')
  const [descricao, setDescricao] = useState('')
  const [horarioAtendimento, setHorarioAtendimento] = useState('')
  const [tiposServico, setTiposServico] = useState<string[]>([])
  const [aceitouTermos, setAceitouTermos] = useState(false)

  const toggleServico = (id: string) => {
    setTiposServico(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!nome.trim()) {
      toast.error('Preencha o Nome da Loja')
      return
    }
    if (!responsavel.trim()) {
      toast.error('Preencha o Nome do Responsável')
      return
    }
    if (!telefone.trim()) {
      toast.error('Preencha o Telefone')
      return
    }
    if (!whatsapp.trim()) {
      toast.error('Preencha o WhatsApp')
      return
    }
    if (!email.trim()) {
      toast.error('Preencha o Email')
      return
    }
    if (!senha.trim()) {
      toast.error('Preencha a Senha')
      return
    }
    if (senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }
    if (!cidade.trim()) {
      toast.error('Preencha a Cidade')
      return
    }
    if (!estado) {
      toast.error('Selecione o Estado')
      return
    }
    if (!endereco.trim()) {
      toast.error('Preencha o Endereço')
      return
    }
    if (tiposServico.length === 0) {
      toast.error('Selecione pelo menos um tipo de serviço')
      return
    }
    if (!aceitouTermos) {
      toast.error('Você precisa aceitar os Termos de Uso e Política de Privacidade')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/lojas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          responsavel: responsavel.trim(),
          telefone: telefone.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          senha,
          cidade: cidade.trim(),
          estado,
          endereco: endereco.trim(),
          descricao: descricao.trim(),
          horarioAtendimento: horarioAtendimento.trim(),
          tiposServico: tiposServico.join(',')
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setLojaSlug(data.slug)
        setSucesso(true)
        toast.success('Loja criada com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao criar loja')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-emerald-200">
          <CardHeader>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-700">Loja Criada!</CardTitle>
            <CardDescription className="text-base mt-2">
              Sua loja foi cadastrada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <p className="text-amber-800 font-medium mb-2">
                Para ativação e liberação do sistema:
              </p>
              <p className="text-amber-700 text-sm">
                Entre em contato via WhatsApp para confirmar seu cadastro e liberar o acesso ao painel.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Link da sua loja:</p>
              <code className="text-emerald-600 font-mono text-sm bg-emerald-50 px-2 py-1 rounded">
                teccell.com.br/loja/{lojaSlug}
              </code>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                className="bg-green-600 hover:bg-green-700 w-full"
                onClick={() => {
                  const msg = encodeURIComponent(`Olá! Acabei de criar uma loja no TecOS: ${nome}\nSlug: ${lojaSlug}\nEmail: ${email}\n\nGostaria de ativar minha conta.`)
                  window.open(`https://wa.me/5511999999999?text=${msg}`, '_blank')
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar no WhatsApp
              </Button>
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              TecOS
            </span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Crie sua Loja no TecOS
            </h1>
            <p className="text-slate-600">
              Preencha os dados abaixo para criar sua assistência técnica na plataforma
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados da Loja */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-600" />
                  Dados da Loja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Loja *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: TechCell Assistência"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Nome do Responsável *</Label>
                    <Input
                      id="responsavel"
                      placeholder="Seu nome completo"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 0000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      placeholder="(00) 00000-0000"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acesso */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  Dados de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      placeholder="Repita a senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      placeholder="Nome da cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BRASIL.map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Serviços */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-emerald-600" />
                  Tipos de Serviço
                </CardTitle>
                <CardDescription>
                  Selecione os tipos de equipamentos que sua loja repara
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {TIPOS_SERVICO.map((tipo) => (
                    <label key={tipo.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tiposServico.includes(tipo.id)}
                        onChange={() => toggleServico(tipo.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{tipo.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição da Loja</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Conte um pouco sobre sua loja, experiência, diferenciais..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="horarioAtendimento">Horário de Atendimento</Label>
                  <Input
                    id="horarioAtendimento"
                    placeholder="Ex: Seg-Sex: 9h às 18h, Sáb: 9h às 13h"
                    value={horarioAtendimento}
                    onChange={(e) => setHorarioAtendimento(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex flex-col gap-4">
              {/* Checkbox de Termos */}
              <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <span className="text-sm text-slate-600">
                  Li e concordo com os{' '}
                  <Link href="/termos-de-uso" target="_blank" className="text-emerald-600 hover:underline font-medium">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/politica-de-privacidade" target="_blank" className="text-emerald-600 hover:underline font-medium">
                    Política de Privacidade
                  </Link>
                </span>
              </label>
              
              <Button 
                type="submit" 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? 'Criando loja...' : 'Criar Minha Loja'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
