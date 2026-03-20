import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Fechar caixa
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
    const { caixaId, saldoFinal, observacaoFechamento } = data

    if (!caixaId) {
      return NextResponse.json(
        { success: false, error: 'ID do caixa é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar o caixa
    const caixa = await db.caixa.findFirst({
      where: {
        id: caixaId,
        lojaId: user.lojaId,
        status: 'aberto'
      }
    })

    if (!caixa) {
      return NextResponse.json(
        { success: false, error: 'Caixa não encontrado ou já fechado' },
        { status: 404 }
      )
    }

    // Calcular totais das vendas
    const vendas = await db.venda.findMany({
      where: {
        caixaId: caixa.id,
        status: 'concluida'
      }
    })

    const totais = {
      totalVendas: 0,
      totalDinheiro: 0,
      totalPix: 0,
      totalCartaoCredito: 0,
      totalCartaoDebito: 0,
      totalOutros: 0
    }

    for (const venda of vendas) {
      totais.totalVendas += venda.total
      switch (venda.formaPagamento) {
        case 'dinheiro':
          totais.totalDinheiro += venda.total
          break
        case 'pix':
          totais.totalPix += venda.total
          break
        case 'cartao_credito':
          totais.totalCartaoCredito += venda.total
          break
        case 'cartao_debito':
          totais.totalCartaoDebito += venda.total
          break
        default:
          totais.totalOutros += venda.total
      }
    }

    // Atualizar caixa
    const caixaFechado = await db.caixa.update({
      where: { id: caixa.id },
      data: {
        status: 'fechado',
        usuarioFechamento: user.nome,
        dataFechamento: new Date(),
        saldoFinal: saldoFinal ? parseFloat(saldoFinal) : totais.totalVendas + caixa.saldoInicial,
        totalVendas: totais.totalVendas,
        totalDinheiro: totais.totalDinheiro,
        totalPix: totais.totalPix,
        totalCartaoCredito: totais.totalCartaoCredito,
        totalCartaoDebito: totais.totalCartaoDebito,
        totalOutros: totais.totalOutros,
        observacaoFechamento: observacaoFechamento?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      caixa: caixaFechado,
      totais
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao fechar caixa' },
      { status: 500 }
    )
  }
}
