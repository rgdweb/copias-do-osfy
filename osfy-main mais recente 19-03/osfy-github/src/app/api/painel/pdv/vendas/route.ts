import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Listar vendas
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
    const caixaId = searchParams.get('caixaId')
    const status = searchParams.get('status')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    const where: Record<string, unknown> = { lojaId: user.lojaId }
    
    if (caixaId) {
      where.caixaId = caixaId
    }
    
    if (status) {
      where.status = status
    }

    if (dataInicio || dataFim) {
      where.dataVenda = {}
      if (dataInicio) {
        where.dataVenda.gte = new Date(dataInicio)
      }
      if (dataFim) {
        where.dataVenda.lte = new Date(dataFim)
      }
    }

    const vendas = await db.venda.findMany({
      where,
      orderBy: { dataVenda: 'desc' },
      include: {
        itens: true
      }
    })

    return NextResponse.json({
      success: true,
      vendas
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar vendas' },
      { status: 500 }
    )
  }
}

// Criar venda
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
      caixaId, 
      itens, 
      desconto, 
      formaPagamento, 
      valorPago, 
      clienteNome, 
      clienteCpf, 
      observacao,
      tipo 
    } = data

    if (!itens || itens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Venda deve ter pelo menos um item' },
        { status: 400 }
      )
    }

    // Verificar se há caixa aberto
    let caixa = caixaId ? await db.caixa.findUnique({ where: { id: caixaId } }) : null
    
    if (!caixa) {
      caixa = await db.caixa.findFirst({
        where: {
          lojaId: user.lojaId,
          status: 'aberto'
        }
      })
    }

    if (!caixa || caixa.status !== 'aberto') {
      return NextResponse.json(
        { success: false, error: 'Não há caixa aberto para realizar a venda' },
        { status: 400 }
      )
    }

    // Calcular totais
    let subtotal = 0
    const itensProcessados = []

    for (const item of itens) {
      const total = item.quantidade * item.precoUnitario - (item.desconto || 0)
      subtotal += total
      itensProcessados.push({
        produtoId: item.produtoId || null,
        codigoBarras: item.codigoBarras || null,
        descricao: item.descricao,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        desconto: item.desconto || 0,
        total,
        tipo: item.tipo || 'produto',
        observacao: item.observacao || null
      })
    }

    const totalDesconto = desconto || 0
    const total = subtotal - totalDesconto
    const troco = valorPago && valorPago > total ? valorPago - total : null

    // Obter próximo número de venda
    const contador = await db.$transaction(async (tx) => {
      const loja = await tx.loja.findUnique({
        where: { id: user.lojaId }
      })
      
      const ultimaVenda = await tx.venda.findFirst({
        where: { lojaId: user.lojaId },
        orderBy: { numeroVenda: 'desc' }
      })
      
      return ultimaVenda ? ultimaVenda.numeroVenda + 1 : 1
    })

    // Criar venda
    const venda = await db.venda.create({
      data: {
        lojaId: user.lojaId,
        caixaId: caixa.id,
        numeroVenda: contador,
        clienteNome: clienteNome?.trim() || null,
        clienteCpf: clienteCpf?.trim() || null,
        subtotal,
        desconto: totalDesconto,
        total,
        formaPagamento,
        valorPago: valorPago || null,
        troco,
        observacao: observacao?.trim() || null,
        tipo: tipo || 'produto',
        status: 'concluida',
        itens: {
          create: itensProcessados
        }
      },
      include: {
        itens: true
      }
    })

    // Atualizar estoque dos produtos
    for (const item of itens) {
      if (item.produtoId) {
        const produto = await db.produto.findUnique({
          where: { id: item.produtoId }
        })
        
        if (produto && !produto.permiteVendaSemEstoque && produto.estoque < item.quantidade) {
          // Cancelar venda se não tem estoque
          await db.venda.update({
            where: { id: venda.id },
            data: { status: 'cancelada' }
          })
          
          return NextResponse.json(
            { success: false, error: `Estoque insuficiente para ${produto.nome}` },
            { status: 400 }
          )
        }
        
        if (produto) {
          await db.produto.update({
            where: { id: item.produtoId },
            data: { estoque: { decrement: item.quantidade } }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      venda
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao criar venda' },
      { status: 500 }
    )
  }
}
