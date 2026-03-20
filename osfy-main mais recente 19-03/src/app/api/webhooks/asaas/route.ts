import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Webhook do Asaas para confirmação de pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[WEBHOOK ASAAS] Recebido:', JSON.stringify(body))

    // Validar evento
    const evento = body.event
    
    if (evento !== 'PAYMENT_RECEIVED' && evento !== 'PAYMENT_CONFIRMED') {
      return NextResponse.json({ received: true, message: 'Evento ignorado' })
    }

    const pagamento = body.payment
    
    if (!pagamento) {
      return NextResponse.json({ received: true, message: 'Sem dados de pagamento' })
    }

    // Buscar fatura pelo ID do Asaas
    const fatura = await db.fatura.findFirst({
      where: { asaasId: pagamento.id },
      include: { loja: true }
    })

    if (!fatura) {
      console.log('[WEBHOOK ASAAS] Fatura não encontrada para ID:', pagamento.id)
      return NextResponse.json({ received: true, message: 'Fatura não encontrada' })
    }

    // Atualizar status da fatura
    const statusPagamento = pagamento.status
    
    if (statusPagamento === 'RECEIVED' || statusPagamento === 'CONFIRMED') {
      await db.fatura.update({
        where: { id: fatura.id },
        data: {
          status: 'paga',
          dataPagamento: new Date(pagamento.paymentDate || new Date()),
          formaPagamento: pagamento.billingType
        }
      })

      // Se a loja estava bloqueada, desbloquear
      if (fatura.loja.status === 'bloqueada') {
        await db.loja.update({
          where: { id: fatura.lojaId },
          data: { status: 'ativa' }
        })
        console.log('[WEBHOOK ASAAS] Loja desbloqueada:', fatura.lojaId)
      }

      console.log('[WEBHOOK ASAAS] Fatura paga:', fatura.id)
    }

    return NextResponse.json({ 
      received: true, 
      message: 'Pagamento processado com sucesso',
      fatura: fatura.id 
    })
  } catch (error) {
    console.error('[WEBHOOK ASAAS] Erro:', error)
    return NextResponse.json({ received: true, message: 'Erro interno' }, { status: 200 })
  }
}

// GET para verificar se webhook está funcionando
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook Asaas ativo',
    timestamp: new Date().toISOString()
  })
}
