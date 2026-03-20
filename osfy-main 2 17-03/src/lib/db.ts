import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Função para inicializar o banco de dados automaticamente
let isInitialized = false

export async function ensureDatabaseInitialized() {
  if (isInitialized) return
  
  try {
    console.log('[DB] Verificando inicialização do banco...')
    
    // Verificar se existe pelo menos um SuperAdmin
    const adminCount = await db.superAdmin.count()
    
    if (adminCount === 0) {
      console.log('[DB] Banco vazio, criando dados iniciais...')
      
      // Criar SuperAdmin padrão
      const senhaHash = await hash('admin123', 12)
      await db.superAdmin.create({
        data: {
          nome: 'Administrador',
          email: 'admin@tecos.com',
          senhaHash
        }
      })
      console.log('[DB] ✅ SuperAdmin criado: admin@tecos.com')
      
      // Criar loja de teste
      const lojaExists = await db.loja.findUnique({
        where: { email: 'teste@techcell.com' }
      })
      
      if (!lojaExists) {
        await db.loja.create({
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
        console.log('[DB] ✅ Loja teste criada: teste@techcell.com')
      }
      
      console.log('[DB] 🎉 Inicialização concluída!')
    } else {
      console.log('[DB] ✅ Banco já inicializado')
    }
    
    isInitialized = true
  } catch (error) {
    console.error('[DB] ❌ Erro na inicialização:', error)
  }
}

// Executar inicialização quando o banco conectar
ensureDatabaseInitialized()
