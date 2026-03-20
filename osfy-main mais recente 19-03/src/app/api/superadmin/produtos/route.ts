import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Listar todos os produtos de todas as lojas
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')
    const lojaId = searchParams.get('lojaId')

    // Construir filtros
    const where: Record<string, unknown> = {}

    if (lojaId) {
      where.lojaId = lojaId
    }

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { codigoBarras: { contains: busca, mode: 'insensitive' } },
        { codigoInterno: { contains: busca, mode: 'insensitive' } }
      ]
    }

    const produtos = await db.produto.findMany({
      where,
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            slug: true,
            status: true
          }
        },
        categoria: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: [
        { loja: { nome: 'asc' } },
        { nome: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      produtos
    })
  } catch (error) {
    console.error('[SUPERADMIN_PRODUTOS] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}
