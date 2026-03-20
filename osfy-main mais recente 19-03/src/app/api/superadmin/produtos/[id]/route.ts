import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Obter produto específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const produto = await db.produto.findUnique({
      where: { id },
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
      }
    })

    if (!produto) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      produto
    })
  } catch (error) {
    console.error('[SUPERADMIN_PRODUTO] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

// Atualizar produto (preço, estoque, etc)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()

    // Verificar se produto existe
    const produtoExistente = await db.produto.findUnique({
      where: { id },
      include: { loja: true }
    })

    if (!produtoExistente) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Campos que podem ser atualizados pelo Super Admin
    const camposAtualizaveis: Record<string, unknown> = {}

    if (data.precoVenda !== undefined) {
      camposAtualizaveis.precoVenda = parseFloat(data.precoVenda)
    }

    if (data.precoCusto !== undefined) {
      camposAtualizaveis.precoCusto = data.precoCusto ? parseFloat(data.precoCusto) : null
    }

    if (data.estoque !== undefined) {
      camposAtualizaveis.estoque = parseInt(data.estoque)
    }

    if (data.estoqueMinimo !== undefined) {
      camposAtualizaveis.estoqueMinimo = parseInt(data.estoqueMinimo)
    }

    if (data.nome !== undefined) {
      camposAtualizaveis.nome = data.nome.trim()
    }

    if (data.ativo !== undefined) {
      camposAtualizaveis.ativo = data.ativo
    }

    if (data.categoriaId !== undefined) {
      camposAtualizaveis.categoriaId = data.categoriaId || null
    }

    // Atualizar produto
    const produtoAtualizado = await db.produto.update({
      where: { id },
      data: camposAtualizaveis,
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            slug: true
          }
        },
        categoria: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      produto: produtoAtualizado,
      message: `Produto "${produtoAtualizado.nome}" atualizado com sucesso! A alteração já está visível na loja ${produtoAtualizado.loja.nome}.`
    })
  } catch (error) {
    console.error('[SUPERADMIN_PRODUTO_UPDATE] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

// Deletar produto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar se produto existe
    const produto = await db.produto.findUnique({
      where: { id },
      include: { loja: true }
    })

    if (!produto) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Deletar produto
    await db.produto.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `Produto "${produto.nome}" deletado com sucesso!`
    })
  } catch (error) {
    console.error('[SUPERADMIN_PRODUTO_DELETE] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar produto' },
      { status: 500 }
    )
  }
}
