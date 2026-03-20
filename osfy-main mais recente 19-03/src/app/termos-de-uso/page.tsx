import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function TermosDeUsoPage() {
  const config = await db.configuracao.findUnique({
    where: { chave: 'siteTermos' }
  })
  
  const termos = config?.valor || `# Termos de Uso

## 1. Aceitação dos Termos
Ao utilizar este sistema, você concorda integralmente com estes termos de uso.

## 2. Descrição do Serviço
Este é um sistema de gestão de ordens de serviço para assistências técnicas.

## 3. Cadastro de Lojas
O cadastro de lojas está sujeito a aprovação pela administração do sistema.

## 4. Responsabilidades
- Os dados cadastrados são de responsabilidade de cada loja
- As lojas são responsáveis pela veracidade das informações

## 5. Privacidade
Os dados dos usuários são protegidos conforme nossa Política de Privacidade.

Última atualização: ${new Date().toLocaleDateString('pt-BR')}`

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Termos de Uso</h1>
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
              {termos}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
