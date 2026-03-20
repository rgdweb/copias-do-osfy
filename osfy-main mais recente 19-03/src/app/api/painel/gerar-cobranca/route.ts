import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { buscarOuCriarCustomer, criarCobranca } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo === 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tipoPlano, formaPagamento = 'UNDEFINED' } = body

    if (!tipoPlano || !['mensal', 'anual'].includes(tipoPlano)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de plano inválido' },
        { status: 400 }
      )
    }

    // Buscar loja
    const loja = await db.loja.findUnique({
      where: { id: user.lojaId }
    })

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Buscar configurações de pagamento
    const configPagamento = await db.configuracaoPagamento.findFirst()
    
    if (!configPagamento?.asaasApiKey) {
      return NextResponse.json(
        { success: false, error: 'Sistema de pagamento não configurado. Entre em contato com o suporte.' },
        { status: 400 }
      )
    }

    // Definir valor
    const valor = tipoPlano === 'anual' 
      ? (configPagamento.valorAnuidade || 290)
      : (configPagamento.valorMensalidade || 29.90)

    // Buscar ou criar customer no Asaas
    let customerId = loja.asaasCustomerId
    
    if (!customerId) {
      const customerResult = await buscarOuCriarCustomer(
        loja.nome,
        loja.email,
        loja.telefone.replace(/\D/g, ''),
        loja.whatsapp.replace(/\D/g, '')
      )

      if (!customerResult.success || !customerResult.customerId) {
        return NextResponse.json(
          { success: false, error: 'Erro ao criar cliente no sistema de pagamento' },
          { status: 500 }
        )
      }

      customerId = customerResult.customerId

      // Salvar customerId na loja
      await db.loja.update({
        where: { id: loja.id },
        data: { asaasCustomerId: customerId }
      })
    }

    // Data de vencimento (5 dias a partir de hoje)
    const dataVencimento = new Date()
    dataVencimento.setDate(dataVencimento.getDate() + 5)
    const dataVencimentoStr = dataVencimento.toISOString().split('T')[0]

    // Descrição da cobrança
    const descricao = tipoPlano === 'anual'
      ? `Plano Anual TecOS - ${loja.nome}`
      : `Plano Mensal TecOS - ${loja.nome}`

    // Criar cobrança no Asaas
    const cobrancaResult = await criarCobranca(
      customerId,
      valor,
      dataVencimentoStr,
      descricao,
      formaPagamento as 'UNDEFINED' | 'BOLETO' | 'PIX'
    )

    if (!cobrancaResult.success) {
      return NextResponse.json(
        { success: false, error: cobrancaResult.error || 'Erro ao criar cobrança' },
        { status: 500 }
      )
    }

    // Criar fatura no banco
    const ultimoNumero = await db.fatura.count({
      where: { lojaId: loja.id }
    })

    const fatura = await db.fatura.create({
      data: {
        lojaId: loja.id,
        numeroFatura: ultimoNumero + 1,
        valor,
        status: 'pendente',
        formaPagamento: formaPagamento.toLowerCase(),
        asaasId: cobrancaResult.cobrancaId,
        asaasCustomerId: customerId,
        codigoPix: cobrancaResult.pixPayload,
        qrCodePix: cobrancaResult.pixQrCode,
        linkBoleto: cobrancaResult.bankSlipUrl,
        linkPagamento: cobrancaResult.invoiceUrl,
        dataVencimento,
        referencia: tipoPlano === 'anual'
          ? `Anual ${new Date().getFullYear()}`
          : `${new Date().toLocaleString('pt-BR', { month: 'long' })}/${new Date().getFullYear()}`
      }
    })

    // Atualizar loja com o novo plano
    await db.loja.update({
      where: { id: loja.id },
      data: {
        plano: tipoPlano,
        precoPlano: valor,
        trialUsado: true
      }
    })

    return NextResponse.json({
      success: true,
      fatura: {
        id: fatura.id,
        valor: fatura.valor,
        dataVencimento: fatura.dataVencimento,
        codigoPix: fatura.codigoPix,
        qrCodePix: fatura.qrCodePix,
        linkBoleto: fatura.linkBoleto,
        linkPagamento: fatura.linkPagamento
      }
    })
  } catch (error) {
    console.error('Erro ao gerar cobrança:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar cobrança' },
      { status: 500 }
    )
  }
}
