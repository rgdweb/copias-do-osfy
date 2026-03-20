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
    const filtro = searchParams.get('filtro') || 'todas'
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const busca = searchParams.get('busca') || ''
    const porPagina = 20

    // Construir where clause
    let where: any = {}
    
    if (busca) {
      where.loja = {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { email: { contains: busca, mode: 'insensitive' } }
        ]
      }
    }

    // Aplicar filtro por status
    switch (filtro) {
      case 'pendentes':
        where.status = 'pendente'
        break
      case 'pagas':
        where.status = 'paga'
        break
      case 'vencidas':
        where.status = 'vencida'
        break
    }

    // Buscar faturas
    const [faturas, total] = await Promise.all([
      db.fatura.findMany({
        where,
        include: {
          loja: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: { dataVencimento: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina
      }),
      db.fatura.count({ where })
    ])

    // Calcular estatísticas
    const [totalFaturas, pendentes, pagas, vencidas] = await Promise.all([
      db.fatura.count(),
      db.fatura.count({ where: { status: 'pendente' } }),
      db.fatura.count({ where: { status: 'paga' } }),
      db.fatura.count({ where: { status: 'vencida' } })
    ])

    // Total pago no mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const faturasPagasMes = await db.fatura.findMany({
      where: {
        status: 'paga',
        dataPagamento: { gte: inicioMes }
      },
      select: { valor: true }
    })

    const valorTotalMes = faturasPagasMes.reduce((acc, f) => acc + f.valor, 0)

    return NextResponse.json({
      success: true,
      faturas,
      totalPaginas: Math.ceil(total / porPagina),
      stats: {
        total: totalFaturas,
        pendentes,
        pagas,
        vencidas,
        valorTotalMes
      }
    })
  } catch (error) {
    console.error('Erro ao buscar faturas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar faturas' },
      { status: 500 }
    )
  }
}
