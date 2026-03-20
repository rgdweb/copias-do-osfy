import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar SuperAdmin padrão
  const existingAdmin = await prisma.superAdmin.findUnique({
    where: { email: 'admin@tecos.com' }
  })

  if (!existingAdmin) {
    const senhaHash = await hash('admin123', 12)
    await prisma.superAdmin.create({
      data: {
        nome: 'Administrador',
        email: 'admin@tecos.com',
        senhaHash
      }
    })
    console.log('✅ SuperAdmin criado: admin@tecos.com / admin123')
  } else {
    console.log('ℹ️ SuperAdmin já existe:', existingAdmin.email)
  }

  // Criar loja de teste padrão
  const existingLoja = await prisma.loja.findUnique({
    where: { email: 'teste@techcell.com' }
  })

  if (!existingLoja) {
    const senhaHash = await hash('teste123', 12)
    await prisma.loja.create({
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
    console.log('✅ Loja teste criada: teste@techcell.com / teste123')
  } else {
    console.log('ℹ️ Loja teste já existe:', existingLoja.email)
  }

  // Listar todos os usuários
  const admins = await prisma.superAdmin.findMany({ select: { email: true, nome: true } })
  const lojas = await prisma.loja.findMany({ select: { email: true, nome: true, status: true } })

  console.log('\n📋 Resumo:')
  console.log('SuperAdmins:', admins)
  console.log('Lojas:', lojas)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
