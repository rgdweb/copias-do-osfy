import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function PoliticaDePrivacidadePage() {
  const config = await db.configuracao.findUnique({
    where: { chave: 'sitePolitica' }
  })
  
  const politica = config?.valor || `# Política de Privacidade

## 1. Informações Coletadas
Coletamos informações necessárias para o funcionamento do sistema:
- Dados de cadastro da loja (nome, email, telefone, endereço)
- Dados de clientes das lojas
- Informações de ordens de serviço

## 2. Uso das Informações
As informações são utilizadas para:
- Prestar os serviços contratados
- Comunicação com lojas e clientes
- Melhoria do sistema

## 3. Compartilhamento de Dados
Não compartilhamos dados com terceiros, exceto:
- Quando autorizado pelo usuário
- Para cumprir obrigações legais

## 4. Segurança
Adotamos medidas de segurança para proteger os dados:
- Criptografia de senhas
- Conexões seguras (HTTPS)
- Acesso restrito aos dados

## 5. Direitos do Usuário
Você pode:
- Solicitar acesso aos seus dados
- Solicitar correção ou exclusão
- Revogar consentimentos

## 6. Contato
Para questões de privacidade, entre em contato através do sistema.

Última atualização: ${new Date().toLocaleDateString('pt-BR')}`

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Política de Privacidade</h1>
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
              {politica}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
