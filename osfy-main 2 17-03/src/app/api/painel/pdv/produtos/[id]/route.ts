import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Buscar produto específico
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

    const produto = await db.produto.findFirst({
      where: {
        id,
        lojaId: user.lojaId
      },
      include: { categoria: true }
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

// Atualizar produto
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
    const { 
      categoriaId, 
      codigoBarras, 
      codigoInterno, 
      nome, 
      descricao, 
      precoCusto, 
      precoVenda, 
      estoque, 
      estoqueMinimo, 
      unidade, 
      localizacao, 
      permiteVendaSemEstoque,
      ativo
    } = data

    // Verificar se produto existe
    const produtoExistente = await db.produto.findFirst({
      where: { id, lojaId: user.lojaId }
    })

    if (!produtoExistente) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se código de barras já existe em outro produto
    if (codigoBarras && codigoBarras !== produtoExistente.codigoBarras) {
      const existente = await db.produto.findUnique({
        where: { codigoBarras }
      })

      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Já existe outro produto com este código de barras' },
          { status: 400 }
        )
      }
    }

    // Verificar se código interno já existe em outro produto
    if (codigoInterno && codigoInterno !== produtoExistente.codigoInterno) {
      const existente = await db.produto.findFirst({
        where: { 
          lojaId: user.lojaId,
          codigoInterno,
          id: { not: id }
        }
      })

      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Já existe outro produto com este código interno' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}

    if (categoriaId !== undefined) updateData.categoriaId = categoriaId || null
    if (codigoBarras !== undefined) updateData.codigoBarras = codigoBarras || null
    if (codigoInterno !== undefined) updateData.codigoInterno = codigoInterno || null
    if (nome !== undefined) updateData.nome = nome.trim()
    if (descricao !== undefined) updateData.descricao = descricao?.trim() || null
    if (precoCusto !== undefined) updateData.precoCusto = precoCusto ? parseFloat(precoCusto) : null
    if (precoVenda !== undefined) updateData.precoVenda = parseFloat(precoVenda)
    if (estoque !== undefined) updateData.estoque = parseInt(estoque)
    if (estoqueMinimo !== undefined) updateData.estoqueMinimo = parseInt(estoqueMinimo)
    if (unidade !== undefined) updateData.unidade = unidade
    if (localizacao !== undefined) updateData.localizacao = localizacao?.trim() || null
    if (permiteVendaSemEstoque !== undefined) updateData.permiteVendaSemEstoque = permiteVendaSemEstoque
    if (ativo !== undefined) updateData.ativo = ativo

    const produto = await db.produto.update({
      where: { id },
      data: updateData,
      include: { categoria: true }
    })

    return NextResponse.json({
      success: true,
      produto
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

// Excluir produto
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

    // Verificar se produto existe
    const produto = await db.produto.findFirst({
      where: { id, lojaId: user.lojaId },
      include: {
        _count: {
          select: { itensVenda: true }
        }
      }
    })

    if (!produto) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se tem vendas vinculadas
    if (produto._count.itensVenda > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir um produto com vendas vinculadas' },
        { status: 400 }
      )
    }

    await db.produto.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir produto' },
      { status: 500 }
    )
  }
}
