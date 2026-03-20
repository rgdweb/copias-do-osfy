import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

interface Props {
  params: Promise<{ id: string }>
}

// Aprovar/Bloquear/Ativar loja
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    let novoStatus: string
    
    switch (action) {
      case 'aprovar':
        novoStatus = 'ativa'
        break
      case 'bloquear':
        novoStatus = 'bloqueada'
        break
      case 'ativar':
        novoStatus = 'ativa'
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        )
    }

    const loja = await db.loja.update({
      where: { id },
      data: { status: novoStatus }
    })

    return NextResponse.json({
      success: true,
      loja,
      message: `Loja ${novoStatus === 'ativa' ? 'ativada' : 'bloqueada'} com sucesso`
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar loja' },
      { status: 500 }
    )
  }
}

// Buscar loja específica
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const loja = await db.loja.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ordens: true, clientes: true, usuarios: true }
        },
        ordens: {
          take: 5,
          orderBy: { dataCriacao: 'desc' },
          include: {
            cliente: { select: { nome: true } }
          }
        }
      }
    })

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      loja
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar loja' },
      { status: 500 }
    )
  }
}

// Atualizar loja
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    const {
      nome,
      slug,
      responsavel,
      telefone,
      whatsapp,
      email,
      senha,
      cidade,
      estado,
      endereco,
      descricao,
      horarioAtendimento,
      tiposServico,
      status
    } = body

    // Verificar se a loja existe
    const lojaExistente = await db.loja.findUnique({ where: { id } })
    if (!lojaExistente) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o slug já existe em outra loja
    if (slug && slug !== lojaExistente.slug) {
      const slugExistente = await db.loja.findUnique({ where: { slug } })
      if (slugExistente) {
        return NextResponse.json(
          { success: false, error: 'Este slug já está em uso' },
          { status: 400 }
        )
      }
    }

    // Verificar se o email já existe em outra loja
    if (email && email !== lojaExistente.email) {
      const emailExistente = await db.loja.findUnique({ where: { email } })
      if (emailExistente) {
        return NextResponse.json(
          { success: false, error: 'Este email já está em uso' },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {}
    
    if (nome !== undefined) dadosAtualizacao.nome = nome
    if (slug !== undefined) dadosAtualizacao.slug = slug
    if (responsavel !== undefined) dadosAtualizacao.responsavel = responsavel
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone
    if (whatsapp !== undefined) dadosAtualizacao.whatsapp = whatsapp
    if (email !== undefined) dadosAtualizacao.email = email
    if (cidade !== undefined) dadosAtualizacao.cidade = cidade
    if (estado !== undefined) dadosAtualizacao.estado = estado
    if (endereco !== undefined) dadosAtualizacao.endereco = endereco
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao
    if (horarioAtendimento !== undefined) dadosAtualizacao.horarioAtendimento = horarioAtendimento
    if (tiposServico !== undefined) dadosAtualizacao.tiposServico = tiposServico
    if (status !== undefined) dadosAtualizacao.status = status
    
    // Se foi enviada uma nova senha, atualizar
    if (senha && senha.trim() !== '') {
      dadosAtualizacao.senhaHash = await hash(senha, 12)
    }

    const loja = await db.loja.update({
      where: { id },
      data: dadosAtualizacao
    })

    return NextResponse.json({
      success: true,
      loja,
      message: 'Loja atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar loja:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar loja' },
      { status: 500 }
    )
  }
}

// Excluir loja
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar se a loja existe
    const loja = await db.loja.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ordens: true, clientes: true, usuarios: true }
        }
      }
    })

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Excluir a loja (cascade vai excluir ordens, clientes, etc)
    await db.loja.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Loja "${loja.nome}" excluída com sucesso`
    })
  } catch (error) {
    console.error('Erro ao excluir loja:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir loja' },
      { status: 500 }
    )
  }
}
