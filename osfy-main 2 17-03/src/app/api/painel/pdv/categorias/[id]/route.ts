import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Buscar categoria específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const categoria = await db.categoria.findFirst({
      where: {
        id,
        lojaId: user.lojaId
      },
      include: {
        _count: {
          select: { produtos: true }
        }
      }
    })

    if (!categoria) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      categoria
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categoria' },
      { status: 500 }
    )
  }
}

// Atualizar categoria
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()
    const { nome, descricao, ativo } = data

    // Verificar se categoria existe
    const categoriaExistente = await db.categoria.findFirst({
      where: { id, lojaId: user.lojaId }
    })

    if (!categoriaExistente) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se nome já existe em outra categoria
    if (nome && nome.trim() !== categoriaExistente.nome) {
      const existente = await db.categoria.findFirst({
        where: {
          lojaId: user.lojaId,
          nome: nome.trim(),
          id: { not: id }
        }
      })

      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Já existe outra categoria com este nome' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}

    if (nome !== undefined) updateData.nome = nome.trim()
    if (descricao !== undefined) updateData.descricao = descricao?.trim() || null
    if (ativo !== undefined) updateData.ativo = ativo

    const categoria = await db.categoria.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { produtos: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      categoria
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar categoria' },
      { status: 500 }
    )
  }
}

// Excluir categoria
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar se categoria existe
    const categoria = await db.categoria.findFirst({
      where: { id, lojaId: user.lojaId }
    })

    if (!categoria) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Remover referência da categoria dos produtos
    await db.produto.updateMany({
      where: { categoriaId: id },
      data: { categoriaId: null }
    })

    // Excluir categoria
    await db.categoria.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Categoria excluída com sucesso'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir categoria' },
      { status: 500 }
    )
  }
}
