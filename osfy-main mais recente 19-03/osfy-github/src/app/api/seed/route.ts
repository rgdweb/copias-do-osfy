import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Inicializar o banco de dados
export async function GET() {
  try {
    console.log('[SEED] Iniciando verificação/criação de dados...')
    
    const results = {
      superAdmin: { created: false, existing: null as any },
      lojaTeste: { created: false, existing: null as any }
    }

    // Verificar/Criar Super Admin
    const existingAdmin = await db.superAdmin.findUnique({
      where: { email: 'admin@tecos.com' }
    })

    if (existingAdmin) {
      results.superAdmin.existing = {
        email: existingAdmin.email,
        nome: existingAdmin.nome
      }
      console.log('[SEED] SuperAdmin já existe:', existingAdmin.email)
    } else {
      const senhaHash = await hash('admin123', 12)
      const admin = await db.superAdmin.create({
        data: {
          nome: 'Administrador',
          email: 'admin@tecos.com',
          senhaHash
        }
      })
      results.superAdmin.created = true
      results.superAdmin.existing = {
        email: admin.email,
        nome: admin.nome
      }
      console.log('[SEED] SuperAdmin criado:', admin.email)
    }

    // Verificar/Criar Loja de Teste
    const existingLoja = await db.loja.findUnique({
      where: { email: 'teste@techcell.com' }
    })

    if (existingLoja) {
      results.lojaTeste.existing = {
        email: existingLoja.email,
        nome: existingLoja.nome,
        status: existingLoja.status
      }
      console.log('[SEED] Loja teste já existe:', existingLoja.email)
    } else {
      const senhaHash = await hash('teste123', 12)
      const loja = await db.loja.create({
        data: {
          nome: 'TechCell Teste',
          slug: 'techcell-teste',
          responsavel: 'João Silva',
          telefone: '11999999999',
          whatsapp: '11999999999',
          email: 'teste@techcell.com',
          senhaHash,
          cidade: 'São Paulo',
          estado: 'SP',
          endereco: 'Rua Teste, 123',
          status: 'ativa'
        }
      })
      results.lojaTeste.created = true
      results.lojaTeste.existing = {
        email: loja.email,
        nome: loja.nome,
        status: loja.status
      }
      console.log('[SEED] Loja teste criada:', loja.email)
    }

    // Contar registros
    const totalAdmins = await db.superAdmin.count()
    const totalLojas = await db.loja.count()

    return NextResponse.json({
      success: true,
      message: 'Banco de dados verificado/inicializado',
      results,
      counts: {
        superAdmins: totalAdmins,
        lojas: totalLojas
      },
      credentials: {
        superAdmin: {
          email: 'admin@tecos.com',
          senha: 'admin123'
        },
        lojaTeste: {
          email: 'teste@techcell.com',
          senha: 'teste123'
        }
      }
    })
  } catch (error) {
    console.error('[SEED] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
