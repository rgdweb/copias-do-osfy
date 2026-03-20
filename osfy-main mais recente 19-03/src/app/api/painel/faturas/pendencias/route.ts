import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Buscar pendências de faturas da loja logada
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const agora = new Date()
    
    // Buscar faturas vencidas e pendentes
    const faturasVencidas = await db.fatura.findMany({
      where: {
        lojaId: user.lojaId,
        status: 'pendente',
        dataVencimento: {
          lt: agora
        }
      },
      orderBy: {
        dataVencimento: 'asc'
      }
    })

    // Calcular totais
    const valorTotal = faturasVencidas.reduce((acc, f) => acc + f.valor, 0)
    
    // Próxima fatura a vencer (ou a mais antiga vencida)
    const proximaFatura = faturasVencidas[0]

    return NextResponse.json({
      success: true,
      temPendencia: faturasVencidas.length > 0,
      faturasVencidas: faturasVencidas.length,
      valorTotal,
      proximaFatura: proximaFatura ? {
        id: proximaFatura.id,
        valor: proximaFatura.valor,
        dataVencimento: proximaFatura.dataVencimento.toISOString(),
        codigoPix: proximaFatura.codigoPix,
        qrCodePix: proximaFatura.qrCodePix,
        linkBoleto: proximaFatura.linkBoleto,
        linkPagamento: proximaFatura.linkPagamento
      } : null
    })
  } catch (error) {
    console.error('[PENDENCIAS] Erro:', error)
    return NextResponse.json(
      { success: false, temPendencia: false, faturasVencidas: 0, valorTotal: 0 },
      { status: 200 }
    )
  }
}
