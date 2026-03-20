import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()

  if (!user || user.tipo !== 'superadmin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const [
    totalLojas,
    lojasAtivas,
    lojasPendentes,
    lojasBloqueadas,
    totalOS,
    faturamentoTotal,
    faturasPendentes,
    faturasVencidas,
    faturasPagas,
    receitaMensal
  ] = await Promise.all([
    db.loja.count(),
    db.loja.count({ where: { status: 'ativa' } }),
    db.loja.count({ where: { status: 'pendente' } }),
    db.loja.count({ where: { status: 'bloqueada' } }),
    db.ordemServico.count(),
    db.ordemServico.aggregate({
      where: { pago: true },
      _sum: { valorTotal: true }
    }),
    db.fatura.count({ where: { status: 'pendente' } }),
    db.fatura.count({ where: { status: 'vencida' } }),
    db.fatura.count({ where: { status: 'paga' } }),
    db.fatura.aggregate({
      where: { status: 'paga' },
      _sum: { valor: true }
    })
  ])

  // Buscar lojas com faturas vencidas (inadimplentes)
  const hoje = new Date()
  
  const lojasInadimplentes = await db.loja.findMany({
    where: {
      status: { in: ['ativa', 'bloqueada'] },
      faturas: {
        some: {
          status: 'vencida'
        }
      }
    },
    include: {
      faturas: {
        where: {
          status: 'vencida'
        },
        orderBy: { dataVencimento: 'asc' }
      },
      _count: {
        select: { faturas: { where: { status: 'vencida' } } }
      }
    },
    take: 10
  })

  // Calcular valor total em aberto
  const valorEmAberto = await db.fatura.aggregate({
    where: {
      status: { in: ['pendente', 'vencida'] }
    },
    _sum: { valor: true }
  })

  const lojasRecentes = await db.loja.findMany({
    orderBy: { criadoEm: 'desc' },
    take: 10,
    include: {
      _count: {
        select: { ordens: true }
      }
    }
  })

  return NextResponse.json({
    totalLojas,
    lojasAtivas,
    lojasPendentes,
    lojasBloqueadas,
    totalOS,
    faturamentoTotal: faturamentoTotal._sum.valorTotal || 0,
    // Dados de faturas
    faturasPendentes,
    faturasVencidas,
    faturasPagas,
    receitaMensal: receitaMensal._sum.valor || 0,
    valorEmAberto: valorEmAberto._sum.valor || 0,
    lojasInadimplentes: lojasInadimplentes.map(l => ({
      id: l.id,
      nome: l.nome,
      email: l.email,
      responsavel: l.responsavel,
      status: l.status,
      totalFaturasVencidas: l._count.faturas,
      valorTotal: l.faturas.reduce((acc, f) => acc + f.valor, 0),
      proximoVencimento: l.faturas[0]?.dataVencimento || null
    })),
    lojasRecentes: lojasRecentes.map(l => ({
      id: l.id,
      nome: l.nome,
      email: l.email,
      responsavel: l.responsavel,
      cidade: l.cidade,
      estado: l.estado,
      status: l.status,
      _count: { ordens: l._count.ordens }
    }))
  })
}
