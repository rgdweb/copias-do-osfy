import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { LojaPageClient } from './client'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const loja = await db.loja.findUnique({
    where: { slug }
  })

  if (!loja) {
    return {
      title: 'Loja não encontrada - TecOS'
    }
  }

  return {
    title: `${loja.nome} - Assistência Técnica | TecOS`,
    description: loja.descricao || `Assistência técnica ${loja.nome} em ${loja.cidade}, ${loja.estado}. ${loja.tiposServico?.replace(/,/g, ', ')}`
  }
}

export default async function LojaPage({ params }: Props) {
  const { slug } = await params
  
  const loja = await db.loja.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { ordens: true, clientes: true }
      }
    }
  })

  if (!loja || loja.status === 'bloqueada') {
    notFound()
  }

  return <LojaPageClient loja={loja} />
}
