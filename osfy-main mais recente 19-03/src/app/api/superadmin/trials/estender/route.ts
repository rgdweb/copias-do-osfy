import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { lojaId, dias } = body

    if (!lojaId || !dias || dias < 1) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    // Buscar loja
    const loja = await db.loja.findUnique({
      where: { id: lojaId }
    })

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Calcular nova data de trial
    const novoTrialAte = new Date()
    novoTrialAte.setDate(novoTrialAte.getDate() + dias)

    // Atualizar loja
    await db.loja.update({
      where: { id: lojaId },
      data: {
        trialAte: novoTrialAte,
        status: 'ativa' // Reativar durante o trial
      }
    })

    return NextResponse.json({
      success: true,
      message: `Trial estendido por ${dias} dias`,
      novoTrialAte
    })
  } catch (error) {
    console.error('Erro ao estender trial:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao estender trial' },
      { status: 500 }
    )
  }
}
