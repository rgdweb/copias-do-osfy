import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      nome,
      telefone,
      whatsapp,
      cidade,
      estado,
      endereco,
      descricao,
      horarioAtendimento,
      tiposServico,
      logo
    } = body

    const loja = await db.loja.update({
      where: { id: user.lojaId },
      data: {
        nome,
        telefone,
        whatsapp,
        cidade,
        estado,
        endereco,
        descricao: descricao || null,
        horarioAtendimento: horarioAtendimento || null,
        tiposServico: tiposServico || null,
        logo: logo || null
      }
    })

    return NextResponse.json({
      success: true,
      loja,
      message: 'Configurações salvas com sucesso'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar configurações' },
      { status: 500 }
    )
  }
}
