import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { OSDetailPage } from './client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OSDetailPageRoute({ params }: Props) {
  const user = await getCurrentUser()

  if (!user || !user.lojaId) {
    redirect('/')
  }

  const { id } = await params
  
  const os = await db.ordemServico.findFirst({
    where: {
      id,
      lojaId: user.lojaId
    },
    include: {
      cliente: {
        select: {
          id: true,
          nome: true,
          telefone: true,
          email: true,
          cpf: true,
          endereco: true,
          criadoEm: true,
          atualizadoEm: true,
          lojaId: true
        }
      },
      tecnico: {
        select: { id: true, nome: true }
      },
      historico: {
        orderBy: { criadoEm: 'desc' }
      },
      fotos: {
        orderBy: { criadoEm: 'desc' }
      },
      assinatura: true,
      loja: {
        select: { slug: true, nome: true, telefone: true, endereco: true, cidade: true, estado: true }
      }
    }
  })

  if (!os) {
    notFound()
  }

  return <OSDetailPage os={os} />
}
