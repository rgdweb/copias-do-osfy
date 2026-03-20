import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { STATUS_LABELS } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verificar se a OS pertence à loja
    const osExistente = await db.ordemServico.findFirst({
      where: { id, lojaId: user.lojaId }
    })

    if (!osExistente) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}

    if (body.status && body.status !== osExistente.status) {
      updateData.status = body.status
      
      // Se status for "entregue", finalizar OS
      if (body.status === 'entregue') {
        updateData.dataFinalizacao = new Date()
      }
      
      // Se status for "pronto" e tiver valor total, marcar como pago
      if (body.status === 'pronto' && body.valorTotal) {
        updateData.valorTotal = body.valorTotal
      }
    }

    if (body.orcamento !== undefined) {
      updateData.orcamento = body.orcamento ? parseFloat(body.orcamento) : null
      updateData.status = 'aguardando_aprovacao'
    }

    if (body.diagnostico !== undefined) {
      updateData.diagnostico = body.diagnostico || null
    }

    if (body.solucao !== undefined) {
      updateData.solucao = body.solucao || null
    }

    if (body.valorServico !== undefined) {
      updateData.valorServico = body.valorServico ? parseFloat(body.valorServico) : null
    }

    if (body.valorPecas !== undefined) {
      updateData.valorPecas = body.valorPecas ? parseFloat(body.valorPecas) : null
    }

    if (body.pago !== undefined) {
      updateData.pago = body.pago
      if (body.pago) {
        updateData.dataPagamento = new Date()
      }
    }

    // Atualizar OS
    const os = await db.ordemServico.update({
      where: { id },
      data: updateData
    })

    // Adicionar histórico se mudou status
    if (body.status && body.status !== osExistente.status) {
      await db.historicoOS.create({
        data: {
          osId: id,
          descricao: `Status alterado para ${STATUS_LABELS[body.status as keyof typeof STATUS_LABELS] || body.status}`,
          status: body.status
        }
      })
    }

    return NextResponse.json({
      success: true,
      os,
      message: 'Ordem de serviço atualizada'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar ordem de serviço' },
      { status: 500 }
    )
  }
}
