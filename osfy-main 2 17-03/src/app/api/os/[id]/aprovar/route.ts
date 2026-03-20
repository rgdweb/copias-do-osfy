import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Props {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const body = await request.json()
    const { aprovado } = body

    if (typeof aprovado !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Decisão de aprovação é obrigatória' },
        { status: 400 }
      )
    }

    // Buscar a OS
    const os = await db.ordemServico.findUnique({
      where: { id }
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar a OS
    const osAtualizada = await db.ordemServico.update({
      where: { id },
      data: {
        aprovado,
        dataAprovacao: new Date(),
        status: aprovado ? 'aguardando_peca' : 'em_analise'
      }
    })

    // Adicionar ao histórico
    await db.historicoOS.create({
      data: {
        osId: id,
        descricao: aprovado ? 'Orçamento aprovado pelo cliente' : 'Orçamento recusado pelo cliente',
        status: osAtualizada.status
      }
    })

    return NextResponse.json({
      success: true,
      message: aprovado ? 'Orçamento aprovado' : 'Orçamento recusado'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao processar aprovação' },
      { status: 500 }
    )
  }
}
