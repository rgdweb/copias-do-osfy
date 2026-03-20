import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { OSPageClient } from './client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const os = await db.ordemServico.findUnique({
    where: { id },
    include: {
      loja: true,
      cliente: true
    }
  })

  if (!os) {
    return {
      title: 'OS não encontrada - TecOS'
    }
  }

  return {
    title: `OS #${os.numeroOs} - ${os.equipamento} | TecOS`
  }
}

export default async function OSPage({ params }: Props) {
  const { id } = await params
  
  const os = await db.ordemServico.findUnique({
    where: { id },
    include: {
      loja: true,
      cliente: true,
      historico: {
        orderBy: { criadoEm: 'desc' }
      },
      fotos: {
        orderBy: { criadoEm: 'desc' }
      },
      assinatura: true
    }
  })

  if (!os) {
    notFound()
  }

  return <OSPageClient os={os} />
}
