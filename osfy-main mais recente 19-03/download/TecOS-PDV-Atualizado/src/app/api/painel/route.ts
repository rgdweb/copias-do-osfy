import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Data de hoje para filtros
    const hoje = new Date()
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999)

    // Buscar estatísticas
    const [
      totalOs,
      osAbertas,
      osEmManutencao,
      osAguardandoPeca,
      osProntas,
      osEntregues,
      clientesCount,
      faturamentoMes,
      produtosCount,
      vendasHoje,
      totalVendasHoje,
      caixaAberto
    ] = await Promise.all([
      // Total de OS
      db.ordemServico.count({
        where: { lojaId: user.lojaId }
      }),
      // OS em aberto (recebido, em_analise)
      db.ordemServico.count({
        where: {
          lojaId: user.lojaId,
          status: { in: ['recebido', 'em_analise'] }
        }
      }),
      // Em manutenção
      db.ordemServico.count({
        where: {
          lojaId: user.lojaId,
          status: 'em_manutencao'
        }
      }),
      // Aguardando peça
      db.ordemServico.count({
        where: {
          lojaId: user.lojaId,
          status: 'aguardando_peca'
        }
      }),
      // Prontas
      db.ordemServico.count({
        where: {
          lojaId: user.lojaId,
          status: 'pronto'
        }
      }),
      // Entregues
      db.ordemServico.count({
        where: {
          lojaId: user.lojaId,
          status: 'entregue'
        }
      }),
      // Total de clientes
      db.cliente.count({
        where: { lojaId: user.lojaId }
      }),
      // Faturamento do mês
      db.ordemServico.aggregate({
        where: {
          lojaId: user.lojaId,
          pago: true,
          dataPagamento: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          valorTotal: true
        }
      }),
      // Total de produtos (PDV)
      db.produto.count({
        where: { lojaId: user.lojaId, ativo: true }
      }),
      // Vendas hoje (PDV)
      db.venda.count({
        where: {
          lojaId: user.lojaId,
          dataVenda: {
            gte: inicioDia,
            lte: fimDia
          },
          status: 'concluida'
        }
      }),
      // Total de vendas hoje (PDV)
      db.venda.aggregate({
        where: {
          lojaId: user.lojaId,
          dataVenda: {
            gte: inicioDia,
            lte: fimDia
          },
          status: 'concluida'
        },
        _sum: {
          total: true
        }
      }),
      // Caixa aberto (PDV)
      db.caixa.findFirst({
        where: {
          lojaId: user.lojaId,
          status: 'aberto'
        }
      })
    ])

    // Buscar últimas OS
    const ultimasOs = await db.ordemServico.findMany({
      where: { lojaId: user.lojaId },
      include: {
        cliente: {
          select: { nome: true }
        }
      },
      orderBy: { dataCriacao: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalOs,
        osAbertas,
        osEmManutencao,
        osAguardandoPeca,
        osProntas,
        osEntregues,
        clientesCount,
        faturamentoMes: faturamentoMes._sum.valorTotal || 0,
        // PDV Stats
        produtosCount,
        vendasHoje,
        totalVendasHoje: totalVendasHoje._sum.total || 0,
        caixaAberto: !!caixaAberto
      },
      ultimasOs
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}
