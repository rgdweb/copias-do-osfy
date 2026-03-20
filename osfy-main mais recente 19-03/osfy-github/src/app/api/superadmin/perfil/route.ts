import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'

// Buscar perfil do superadmin
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const admin = await db.superAdmin.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        criadoEm: true,
        atualizadoEm: true
      }
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      admin
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}

// Atualizar perfil do superadmin
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nome, email, senhaAtual, novaSenha } = body

    // Buscar admin atual
    const adminAtual = await db.superAdmin.findUnique({
      where: { id: user.id }
    })

    if (!adminAtual) {
      return NextResponse.json(
        { success: false, error: 'Admin não encontrado' },
        { status: 404 }
      )
    }

    // Se quiser alterar senha, verificar senha atual
    if (novaSenha) {
      if (!senhaAtual) {
        return NextResponse.json(
          { success: false, error: 'Digite a senha atual para alterar a senha' },
          { status: 400 }
        )
      }

      const senhaValida = await compare(senhaAtual, adminAtual.senhaHash)
      if (!senhaValida) {
        return NextResponse.json(
          { success: false, error: 'Senha atual incorreta' },
          { status: 400 }
        )
      }
    }

    // Verificar se email já existe (se estiver alterando)
    if (email && email !== adminAtual.email) {
      const emailExiste = await db.superAdmin.findUnique({
        where: { email }
      })
      if (emailExiste) {
        return NextResponse.json(
          { success: false, error: 'Este email já está em uso' },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {}
    if (nome) dadosAtualizacao.nome = nome
    if (email) dadosAtualizacao.email = email
    if (novaSenha) dadosAtualizacao.senhaHash = await hash(novaSenha, 12)

    const adminAtualizado = await db.superAdmin.update({
      where: { id: user.id },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        email: true,
        criadoEm: true,
        atualizadoEm: true
      }
    })

    return NextResponse.json({
      success: true,
      admin: adminAtualizado,
      message: 'Perfil atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
