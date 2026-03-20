import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Buscar venda por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const venda = await db.venda.findFirst({
      where: {
        id,
        lojaId: user.lojaId
      },
      include: {
        itens: true
      }
    })

    if (!venda) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      venda
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar venda' },
      { status: 500 }
    )
  }
}
