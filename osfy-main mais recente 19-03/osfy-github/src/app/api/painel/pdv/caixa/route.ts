import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Listar caixas
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
    const status = searchParams.get('status')
    const hoje = searchParams.get('hoje')

    const where: Record<string, unknown> = { lojaId: user.lojaId }
    
    if (status) {
      where.status = status
    }

    if (hoje === 'true') {
      const inicioDia = new Date()
      inicioDia.setHours(0, 0, 0, 0)
      const fimDia = new Date()
      fimDia.setHours(23, 59, 59, 999)
      
      where.dataAbertura = {
        gte: inicioDia,
        lte: fimDia
      }
    }

    const caixas = await db.caixa.findMany({
      where,
      orderBy: { dataAbertura: 'desc' },
      include: {
        _count: {
          select: { vendas: true }
        }
      }
    })

    // Buscar caixa aberto
    const caixaAberto = await db.caixa.findFirst({
      where: { 
        lojaId: user.lojaId,
        status: 'aberto'
      }
    })

    return NextResponse.json({
      success: true,
      caixas,
      caixaAberto
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar caixas' },
      { status: 500 }
    )
  }
}

// Abrir caixa
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se já existe caixa aberto
    const caixaAberto = await db.caixa.findFirst({
      where: { 
        lojaId: user.lojaId,
        status: 'aberto'
      }
    })

    if (caixaAberto) {
      return NextResponse.json(
        { success: false, error: 'Já existe um caixa aberto. Feche-o antes de abrir outro.' },
        { status: 400 }
      )
    }

    const data = await request.json()
    const { saldoInicial, observacaoAbertura } = data

    const novoCaixa = await db.caixa.create({
      data: {
        lojaId: user.lojaId,
        usuarioAbertura: user.nome,
        saldoInicial: saldoInicial ? parseFloat(saldoInicial) : 0,
        observacaoAbertura: observacaoAbertura?.trim() || null,
        status: 'aberto'
      }
    })

    return NextResponse.json({
      success: true,
      caixa: novoCaixa
    })
  } catch (error) {
    console.error('[CAIXA] Erro ao abrir caixa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao abrir caixa', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
