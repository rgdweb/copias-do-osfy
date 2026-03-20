import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Contar registros
    const superAdminCount = await db.superAdmin.count()
    const lojaCount = await db.loja.count()
    
    // Buscar emails (sem expor senhas)
    const superAdmins = await db.superAdmin.findMany({
      select: { email: true, nome: true }
    })
    const lojas = await db.loja.findMany({
      select: { email: true, nome: true, status: true }
    })

    return NextResponse.json({
      database: 'connected',
      counts: {
        superAdmins: superAdminCount,
        lojas: lojaCount
      },
      superAdmins,
      lojas,
      env: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    })
  } catch (error) {
    console.error('[DEBUG] Erro:', error)
    return NextResponse.json({
      database: 'error',
      error: String(error)
    }, { status: 500 })
  }
}
