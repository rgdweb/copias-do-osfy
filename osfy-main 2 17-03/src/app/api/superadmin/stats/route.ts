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
    faturamentoTotal
  ] = await Promise.all([
    db.loja.count(),
    db.loja.count({ where: { status: 'ativa' } }),
    db.loja.count({ where: { status: 'pendente' } }),
    db.loja.count({ where: { status: 'bloqueada' } }),
    db.ordemServico.count(),
    db.ordemServico.aggregate({
      where: { pago: true },
      _sum: { valorTotal: true }
    })
  ])

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
