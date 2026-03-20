import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Props {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const body = await request.json()
    const { imagem, nome } = body

    if (!imagem) {
      return NextResponse.json(
        { success: false, error: 'Assinatura é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se a OS existe
    const os = await db.ordemServico.findUnique({
      where: { id },
      include: { loja: true }
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe assinatura
    const assinaturaExistente = await db.assinatura.findUnique({
      where: { osId: id }
    })

    if (assinaturaExistente) {
      return NextResponse.json(
        { success: false, error: 'Esta OS já foi assinada' },
        { status: 400 }
      )
    }

    // Criar assinatura
    const assinatura = await db.assinatura.create({
      data: {
        osId: id,
        imagem,
        nome: nome || null
      }
    })

    // Adicionar histórico
    await db.historicoOS.create({
      data: {
        osId: id,
        descricao: 'Ordem de serviço assinada pelo cliente' + (nome ? ` (${nome})` : ''),
        status: os.status
      }
    })

    return NextResponse.json({
      success: true,
      assinatura,
      message: 'Assinatura salva com sucesso'
    })
  } catch (error) {
    console.error('Erro ao salvar assinatura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar assinatura' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params

    const assinatura = await db.assinatura.findUnique({
      where: { osId: id }
    })

    if (!assinatura) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      assinatura
    })
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar assinatura' },
      { status: 500 }
    )
  }
}
