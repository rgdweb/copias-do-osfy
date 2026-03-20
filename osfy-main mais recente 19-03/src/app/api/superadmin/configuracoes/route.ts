import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Buscar configurações do sistema
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar todas as configurações
    const configs = await db.configuracao.findMany()
    
    // Transformar em objeto chave-valor
    const configuracoes: Record<string, string> = {}
    configs.forEach(c => {
      configuracoes[c.chave] = c.valor
    })

    // Buscar configurações de pagamento
    const configPagamento = await db.configuracaoPagamento.findFirst()

    // Valores padrão
    const defaultConfig = {
      siteNome: 'TecOS',
      siteDescricao: 'Sistema de Ordens de Serviço para Assistências Técnicas',
      sitePreco: '29',
      sitePrecoAnual: '290',
      siteWhatsapp: '',
      siteEmail: '',
      siteTermos: '',
      sitePolitica: '',
      asaasApiKey: '',
      asaasAmbiente: 'sandbox',
      webhookSecret: '',
      valorMensalidade: configPagamento?.valorMensalidade?.toString() || '29.90',
      valorAnuidade: configPagamento?.valorAnuidade?.toString() || '290.00',
      diaVencimento: configPagamento?.diaVencimento?.toString() || '10',
      diasBloqueio: configPagamento?.diasBloqueio?.toString() || '20',
    }

    // Adicionar dados de pagamento às configurações
    if (configPagamento) {
      configuracoes.asaasApiKey = configPagamento.asaasApiKey || ''
      configuracoes.asaasAmbiente = configPagamento.asaasAmbiente || 'sandbox'
      configuracoes.webhookSecret = configPagamento.webhookSecret || ''
    }

    return NextResponse.json({
      success: true,
      configuracoes: { ...defaultConfig, ...configuracoes }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

// Atualizar configurações do sistema
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Separar configurações de pagamento das configurações gerais
    const {
      asaasApiKey,
      asaasAmbiente,
      webhookSecret,
      valorMensalidade,
      valorAnuidade,
      diaVencimento,
      diasBloqueio,
      ...outrasConfiguracoes
    } = body

    // Atualizar configurações gerais
    for (const [chave, valor] of Object.entries(outrasConfiguracoes)) {
      await db.configuracao.upsert({
        where: { chave },
        update: { valor: String(valor) },
        create: { chave, valor: String(valor) }
      })
    }

    // Atualizar configurações de pagamento
    const configPagamentoExistente = await db.configuracaoPagamento.findFirst()
    
    if (configPagamentoExistente) {
      await db.configuracaoPagamento.update({
        where: { id: configPagamentoExistente.id },
        data: {
          asaasApiKey: asaasApiKey || null,
          asaasAmbiente: asaasAmbiente || 'sandbox',
          webhookSecret: webhookSecret || null,
          valorMensalidade: parseFloat(valorMensalidade) || 29.90,
          valorAnuidade: parseFloat(valorAnuidade) || 290.00,
          diaVencimento: parseInt(diaVencimento) || 10,
          diasBloqueio: parseInt(diasBloqueio) || 20,
        }
      })
    } else {
      await db.configuracaoPagamento.create({
        data: {
          asaasApiKey: asaasApiKey || null,
          asaasAmbiente: asaasAmbiente || 'sandbox',
          webhookSecret: webhookSecret || null,
          valorMensalidade: parseFloat(valorMensalidade) || 29.90,
          valorAnuidade: parseFloat(valorAnuidade) || 290.00,
          diaVencimento: parseInt(diaVencimento) || 10,
          diasBloqueio: parseInt(diasBloqueio) || 20,
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar configurações' },
      { status: 500 }
    )
  }
}
