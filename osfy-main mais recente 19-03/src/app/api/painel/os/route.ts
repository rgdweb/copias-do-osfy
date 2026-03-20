import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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
    const busca = searchParams.get('busca')

    // Construir filtros
    const where: Record<string, unknown> = {
      lojaId: user.lojaId
    }

    if (status && status !== 'todos') {
      where.status = status
    }

    if (busca) {
      where.OR = [
        { cliente: { nome: { contains: busca } } },
        { cliente: { telefone: { contains: busca } } },
        { equipamento: { contains: busca } },
        { numeroOs: isNaN(parseInt(busca)) ? undefined : parseInt(busca) }
      ].filter(Boolean)
    }

    const ordens = await db.ordemServico.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true
          }
        },
        tecnico: {
          select: { id: true, nome: true }
        },
        fotos: {
          select: { id: true, arquivo: true },
          take: 1
        },
        _count: {
          select: { fotos: true, historico: true }
        }
      },
      orderBy: { dataCriacao: 'desc' }
    })

    return NextResponse.json({
      success: true,
      ordens
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar ordens de serviço' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      clienteNome,
      clienteTelefone,
      clienteEmail,
      equipamento,
      marca,
      modelo,
      imeiSerial,
      senhaAparelho,
      problema,
      acessorios,
      estadoAparelho,
      dataPrevisao
    } = body

    // Validações
    if (!clienteNome || !clienteTelefone || !equipamento || !problema) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    // Buscar ou criar cliente
    let cliente = await db.cliente.findFirst({
      where: {
        lojaId: user.lojaId,
        telefone: clienteTelefone
      }
    })

    if (!cliente) {
      cliente = await db.cliente.create({
        data: {
          lojaId: user.lojaId,
          nome: clienteNome,
          telefone: clienteTelefone,
          email: clienteEmail || null
        }
      })
    } else {
      // Atualizar nome do cliente se fornecido
      if (clienteNome && cliente.nome !== clienteNome) {
        await db.cliente.update({
          where: { id: cliente.id },
          data: { nome: clienteNome, email: clienteEmail || cliente.email }
        })
      }
    }

    // Incrementar contador de OS
    const contador = await db.contadorOS.upsert({
      where: { lojaId: user.lojaId },
      update: { ultimoNumero: { increment: 1 } },
      create: { lojaId: user.lojaId, ultimoNumero: 1 }
    })

    // Criar OS
    const os = await db.ordemServico.create({
      data: {
        lojaId: user.lojaId,
        clienteId: cliente.id,
        tecnicoId: user.tipo === 'usuario' ? user.id : null,
        numeroOs: contador.ultimoNumero,
        equipamento,
        marca: marca || null,
        modelo: modelo || null,
        imeiSerial: imeiSerial || null,
        senhaAparelho: senhaAparelho || null,
        problema,
        acessorios: acessorios || null,
        estadoAparelho: estadoAparelho || null,
        status: 'recebido',
        dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : null
      },
      include: {
        cliente: true
      }
    })

    // Criar histórico inicial
    await db.historicoOS.create({
      data: {
        osId: os.id,
        descricao: 'Ordem de serviço criada',
        status: 'recebido'
      }
    })

    return NextResponse.json({
      success: true,
      os,
      message: `OS #${os.numeroOs} criada com sucesso`
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao criar ordem de serviço' },
      { status: 500 }
    )
  }
}
