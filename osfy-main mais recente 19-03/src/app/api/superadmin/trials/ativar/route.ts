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
    const { lojaId } = body

    if (!lojaId) {
      return NextResponse.json(
        { success: false, error: 'ID da loja é obrigatório' },
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

    // Calcular data de expiração (1 mês ou 1 ano a partir de agora)
    const agora = new Date()
    const expiraEm = new Date(agora)
    
    if (loja.plano === 'anual') {
      expiraEm.setFullYear(expiraEm.getFullYear() + 1)
    } else {
      expiraEm.setMonth(expiraEm.getMonth() + 1)
    }

    // Atualizar loja para ativa
    await db.loja.update({
      where: { id: lojaId },
      data: {
        status: 'ativa',
        trialUsado: true,
        expiraEm
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Loja ativada com sucesso',
      expiraEm
    })
  } catch (error) {
    console.error('Erro ao ativar loja:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao ativar loja' },
      { status: 500 }
    )
  }
}
