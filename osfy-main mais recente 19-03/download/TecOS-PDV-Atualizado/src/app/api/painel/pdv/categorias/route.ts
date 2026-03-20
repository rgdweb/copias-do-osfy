import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Listar categorias
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const categorias = await db.categoria.findMany({
      where: { lojaId: user.lojaId },
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { produtos: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      categorias
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

// Criar categoria
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { nome, descricao } = data

    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe
    const existente = await db.categoria.findFirst({
      where: {
        lojaId: user.lojaId,
        nome: nome.trim()
      }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      )
    }

    const categoria = await db.categoria.create({
      data: {
        lojaId: user.lojaId,
        nome: nome.trim(),
        descricao: descricao?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      categoria
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}
