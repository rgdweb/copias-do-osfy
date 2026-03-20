import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filtro = searchParams.get('filtro') || 'todos'
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const busca = searchParams.get('busca') || ''
    const porPagina = 20

    const agora = new Date()
    const amanha = new Date(agora)
    amanha.setDate(amanha.getDate() + 1)
    amanha.setHours(23, 59, 59, 999)
    
    const em7Dias = new Date(agora)
    em7Dias.setDate(em7Dias.getDate() + 7)
    em7Dias.setHours(23, 59, 59, 999)

    // Construir where clause
    let where: any = {}
    
    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { email: { contains: busca, mode: 'insensitive' } },
        { slug: { contains: busca, mode: 'insensitive' } }
      ]
    }

    // Aplicar filtro
    switch (filtro) {
      case 'trial':
        where.trialAte = { gte: agora }
        break
      case 'expirando':
        where.trialAte = {
          gte: agora,
          lte: em7Dias
        }
        break
      case 'pendentes':
        where.status = 'pendente'
        break
      case 'atrasados':
        where.OR = [
          { status: 'bloqueada' },
          {
            AND: [
              { trialAte: { lt: agora } },
              { trialUsado: false }
            ]
          }
        ]
        break
    }

    // Buscar lojas
    const [lojas, total] = await Promise.all([
      db.loja.findMany({
        where,
        include: {
          _count: {
            select: { faturas: true }
          }
        },
        orderBy: { criadoEm: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina
      }),
      db.loja.count({ where })
    ])

    // Calcular estatísticas
    const stats = await db.loja.aggregate({
      _count: true
    })

    const [emTrial, trialExpirandoHoje, trialExpirando7Dias, ativas, pendentes, atrasadas, bloqueadas] = await Promise.all([
      db.loja.count({ where: { trialAte: { gte: agora } } }),
      db.loja.count({ where: { trialAte: { gte: agora, lt: amanha } } }),
      db.loja.count({ where: { trialAte: { gte: agora, lte: em7Dias } } }),
      db.loja.count({ where: { status: 'ativa' } }),
      db.loja.count({ where: { status: 'pendente' } }),
      db.loja.count({ where: { status: 'atrasada' } }),
      db.loja.count({ where: { status: 'bloqueada' } })
    ])

    return NextResponse.json({
      success: true,
      lojas,
      totalPaginas: Math.ceil(total / porPagina),
      stats: {
        totalLojas: stats._count,
        emTrial,
        trialExpirandoHoje,
        trialExpirando7Dias,
        ativas,
        pendentes,
        atrasadas,
        bloqueadas
      }
    })
  } catch (error) {
    console.error('Erro ao buscar trials:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar trials' },
      { status: 500 }
    )
  }
}
