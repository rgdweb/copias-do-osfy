import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateUniqueSlug } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      nome,
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
      tiposServico
    } = body

    // Validações básicas
    if (!nome || !responsavel || !telefone || !whatsapp || !email || !senha || !cidade || !estado || !endereco) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const emailExiste = await db.loja.findUnique({
      where: { email }
    })

    if (emailExiste) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Gerar slug único
    const slug = await generateUniqueSlug(nome)

    // Hash da senha
    const senhaHash = await hashPassword(senha)

    // Criar loja
    const loja = await db.loja.create({
      data: {
        nome,
        slug,
        responsavel,
        telefone,
        whatsapp,
        email,
        senhaHash,
        cidade,
        estado,
        endereco,
        descricao: descricao || null,
        horarioAtendimento: horarioAtendimento || null,
        tiposServico: tiposServico || null,
        status: 'pendente'
      }
    })

    // Criar contador de OS para a loja
    await db.contadorOS.create({
      data: {
        lojaId: loja.id,
        ultimoNumero: 0
      }
    })

    return NextResponse.json({
      success: true,
      slug: loja.slug,
      message: 'Loja criada com sucesso'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao criar loja: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'API de lojas funcionando' })
}
