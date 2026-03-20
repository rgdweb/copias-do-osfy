import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const clientes = await db.cliente.findMany({
      where: { lojaId: user.lojaId },
      orderBy: { criadoEm: 'desc' },
      include: {
        _count: {
          select: { ordens: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      clientes
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar clientes' },
      { status: 500 }
    )
  }
}
