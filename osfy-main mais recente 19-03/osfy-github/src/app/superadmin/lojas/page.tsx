import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { LojasLista } from './lista-client'

export default async function LojasPage() {
  const user = await getCurrentUser()

  if (!user || user.tipo !== 'superadmin') {
    redirect('/')
  }

  const lojas = await db.loja.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      _count: {
        select: { ordens: true, clientes: true }
      }
    }
  })

  return <LojasLista lojas={lojas} />
}
