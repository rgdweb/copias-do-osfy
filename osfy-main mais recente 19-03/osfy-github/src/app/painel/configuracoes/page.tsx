import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { ConfiguracoesPage } from './client'

export default async function ConfiguracoesPageRoute() {
  const user = await getCurrentUser()

  if (!user || !user.lojaId) {
    redirect('/')
  }

  const loja = await db.loja.findUnique({
    where: { id: user.lojaId }
  })

  if (!loja) {
    redirect('/')
  }

  return <ConfiguracoesPage loja={loja} />
}
