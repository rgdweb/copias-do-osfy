import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Listar faturas da loja logada
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const where: Record<string, unknown> = { lojaId: user.lojaId }
    if (status) {
      where.status = status
    }

    const faturas = await db.fatura.findMany({
      where,
      orderBy: { dataVencimento: 'desc' }
    })

    // Contar por status
    const contagem = await db.fatura.groupBy({
      by: ['status'],
      where: { lojaId: user.lojaId },
      _count: true
    })

    return NextResponse.json({
      success: true,
      faturas,
      contagem: contagem.reduce((acc, c) => {
        acc[c.status] = c._count
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('[FATURAS LOJA] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar faturas' },
      { status: 500 }
    )
  }
}
