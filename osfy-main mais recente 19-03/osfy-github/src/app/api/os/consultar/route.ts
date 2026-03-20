import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lojaId = searchParams.get('lojaId')
    const numeroOs = searchParams.get('numeroOs')

    if (!lojaId || !numeroOs) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não informados' },
        { status: 400 }
      )
    }

    const os = await db.ordemServico.findFirst({
      where: {
        lojaId,
        numeroOs: parseInt(numeroOs)
      },
      select: {
        id: true
      }
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      osId: os.id
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar ordem de serviço' },
      { status: 500 }
    )
  }
}
