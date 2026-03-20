import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Listar todas as lojas
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const lojas = await db.loja.findMany({
      select: {
        id: true,
        nome: true,
        slug: true,
        status: true,
        cidade: true,
        estado: true,
        email: true,
        responsavel: true,
        _count: {
          select: {
            produtos: true,
            ordens: true,
            clientes: true
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      lojas
    })
  } catch (error) {
    console.error('[SUPERADMIN_LOJAS] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar lojas' },
      { status: 500 }
    )
  }
}
