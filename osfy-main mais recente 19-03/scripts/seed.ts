import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar Super Admin
  const adminExists = await prisma.superAdmin.findFirst()
  
  if (!adminExists) {
    const senhaHash = await hash('admin123', 12)
    
    await prisma.superAdmin.create({
      data: {
        nome: 'Administrador',
        email: 'admin@tecos.com',
        senhaHash
      }
    })
    
    console.log('✅ Super Admin criado!')
    console.log('   Email: admin@tecos.com')
    console.log('   Senha: admin123')
  } else {
    console.log('ℹ️  Super Admin já existe')
  }

  // Criar configurações padrão
  const configExists = await prisma.configuracao.findFirst()
  
  if (!configExists) {
    await prisma.configuracao.createMany({
      data: [
        { chave: 'plano_mensal', valor: '29', descricao: 'Valor do plano mensal em reais' },
        { chave: 'plano_anual', valor: '290', descricao: 'Valor do plano anual em reais' },
        { chave: 'whatsapp_contato', valor: '5511999999999', descricao: 'WhatsApp para contato' }
      ]
    })
    console.log('✅ Configurações padrão criadas!')
  }

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
