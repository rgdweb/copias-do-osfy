import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Buscar configurações de pagamento
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar ou criar configuração
    let config = await db.configuracaoPagamento.findFirst()

    if (!config) {
      config = await db.configuracaoPagamento.create({
        data: {
          asaasAmbiente: 'sandbox',
          valorMensalidade: 29.90,
          valorAnuidade: 290.00,
          diaVencimento: 10,
          diasBloqueio: 20,
          diasTolerancia: 3,
          ativo: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      configuracao: config
    })
  } catch (error) {
    console.error('[PAGAMENTOS] Erro ao buscar configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

// Salvar configurações de pagamento
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

    // Buscar configuração existente
    let config = await db.configuracaoPagamento.findFirst()

    if (config) {
      config = await db.configuracaoPagamento.update({
        where: { id: config.id },
        data: {
          asaasApiKey: body.asaasApiKey || null,
          asaasAmbiente: body.asaasAmbiente || 'sandbox',
          chavePix: body.chavePix || null,
          tipoChavePix: body.tipoChavePix || null,
          nomeRecebedor: body.nomeRecebedor || null,
          valorMensalidade: parseFloat(body.valorMensalidade) || 29.90,
          valorAnuidade: parseFloat(body.valorAnuidade) || 290.00,
          diaVencimento: parseInt(body.diaVencimento) || 10,
          diasBloqueio: parseInt(body.diasBloqueio) || 20,
          diasTolerancia: parseInt(body.diasTolerancia) || 3,
          webhookSecret: body.webhookSecret || null,
          ativo: body.ativo ?? false
        }
      })
    } else {
      config = await db.configuracaoPagamento.create({
        data: {
          asaasApiKey: body.asaasApiKey || null,
          asaasAmbiente: body.asaasAmbiente || 'sandbox',
          chavePix: body.chavePix || null,
          tipoChavePix: body.tipoChavePix || null,
          nomeRecebedor: body.nomeRecebedor || null,
          valorMensalidade: parseFloat(body.valorMensalidade) || 29.90,
          valorAnuidade: parseFloat(body.valorAnuidade) || 290.00,
          diaVencimento: parseInt(body.diaVencimento) || 10,
          diasBloqueio: parseInt(body.diasBloqueio) || 20,
          diasTolerancia: parseInt(body.diasTolerancia) || 3,
          webhookSecret: body.webhookSecret || null,
          ativo: body.ativo ?? false
        }
      })
    }

    return NextResponse.json({
      success: true,
      configuracao: config
    })
  } catch (error) {
    console.error('[PAGAMENTOS] Erro ao salvar configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar configurações' },
      { status: 500 }
    )
  }
}
