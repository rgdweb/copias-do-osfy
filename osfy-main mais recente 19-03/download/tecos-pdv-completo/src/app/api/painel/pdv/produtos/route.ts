import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Listar produtos
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoriaId = searchParams.get('categoria')
    const ativo = searchParams.get('ativo')
    const busca = searchParams.get('busca')
    const codigoBarras = searchParams.get('codigo_barras')

    // Buscar por código de barras
    if (codigoBarras) {
      const produto = await db.produto.findFirst({
        where: { 
          lojaId: user.lojaId,
          codigoBarras: codigoBarras
        },
        include: { categoria: true }
      })

      return NextResponse.json({
        success: true,
        produto
      })
    }

    // Construir filtros
    const where: Record<string, unknown> = { lojaId: user.lojaId }
    
    if (categoriaId) {
      where.categoriaId = categoriaId
    }
    
    if (ativo !== null) {
      where.ativo = ativo === 'true'
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
      include: { categoria: true },
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({
      success: true,
      produtos
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}

// Criar produto
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
      permiteVendaSemEstoque 
    } = data

    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome do produto é obrigatório' },
        { status: 400 }
      )
    }

    if (!precoVenda || precoVenda <= 0) {
      return NextResponse.json(
        { success: false, error: 'Preço de venda é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se código de barras já existe
    if (codigoBarras) {
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

    // Verificar se código interno já existe
    if (codigoInterno) {
      const existente = await db.produto.findFirst({
        where: { 
          lojaId: user.lojaId,
          codigoInterno 
        }
      })

      if (existente) {
        return NextResponse.json(
          { success: false, error: 'Já existe um produto com este código interno' },
          { status: 400 }
        )
      }
    }

    const produto = await db.produto.create({
      data: {
        lojaId: user.lojaId,
        categoriaId: categoriaId || null,
        codigoBarras: codigoBarras || null,
        codigoInterno: codigoInterno || null,
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        precoCusto: precoCusto ? parseFloat(precoCusto) : null,
        precoVenda: parseFloat(precoVenda),
        estoque: estoque ? parseInt(estoque) : 0,
        estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : 0,
        unidade: unidade || 'UN',
        localizacao: localizacao?.trim() || null,
        permiteVendaSemEstoque: permiteVendaSemEstoque ?? true
      },
      include: { categoria: true }
    })

    return NextResponse.json({
      success: true,
      produto
    })
  } catch (error) {
    console.error('[PRODUTOS] Erro ao criar produto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar produto', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
