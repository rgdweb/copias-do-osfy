import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Buscar produto por ID
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

    // Verificar se produto existe e pertence à loja
    const produtoExistente = await db.produto.findFirst({
      where: { id, lojaId: user.lojaId }
    })

    if (!produtoExistente) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

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
      imagem,
      ativo
    } = data

    // Se está atualizando código de barras, verificar se já existe
    if (codigoBarras && codigoBarras !== produtoExistente.codigoBarras) {
      const existente = await db.produto.findUnique({
        where: { codigoBarras }
      })

      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Já existe um produto com este código de barras' },
          { status: 400 }
        )
      }
    }

    // Se está atualizando código interno, verificar se já existe
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
          { success: false, error: 'Já existe um produto com este código interno' },
          { status: 400 }
        )
      }
    }

    // Construir objeto de atualização
    const updateData: Record<string, unknown> = {}

    if (categoriaId !== undefined) updateData.categoriaId = categoriaId || null
    if (codigoBarras !== undefined) updateData.codigoBarras = codigoBarras || null
    if (codigoInterno !== undefined) updateData.codigoInterno = codigoInterno || null
    if (nome !== undefined) updateData.nome = nome?.trim() || produtoExistente.nome
    if (descricao !== undefined) updateData.descricao = descricao?.trim() || null
    if (precoCusto !== undefined) updateData.precoCusto = precoCusto ? parseFloat(precoCusto) : null
    if (precoVenda !== undefined) updateData.precoVenda = parseFloat(precoVenda)
    if (estoque !== undefined) updateData.estoque = estoque ? parseInt(estoque) : 0
    if (estoqueMinimo !== undefined) updateData.estoqueMinimo = estoqueMinimo ? parseInt(estoqueMinimo) : 0
    if (unidade !== undefined) updateData.unidade = unidade || 'UN'
    if (localizacao !== undefined) updateData.localizacao = localizacao?.trim() || null
    if (permiteVendaSemEstoque !== undefined) updateData.permiteVendaSemEstoque = permiteVendaSemEstoque
    if (imagem !== undefined) updateData.imagem = imagem || null
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
  } catch (error) {
    console.error('[PRODUTOS] Erro ao atualizar produto:', error)
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

    // Verificar se produto existe e pertence à loja
    const produto = await db.produto.findFirst({
      where: { id, lojaId: user.lojaId }
    })

    if (!produto) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se produto tem vendas vinculadas
    const itensVenda = await db.itemVenda.count({
      where: { produtoId: id }
    })

    if (itensVenda > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir um produto que já foi vendido' },
        { status: 400 }
      )
    }

    await db.produto.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('[PRODUTOS] Erro ao excluir produto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir produto' },
      { status: 500 }
    )
  }
}
