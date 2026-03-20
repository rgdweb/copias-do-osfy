import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Buscar configurações públicas do site (sem autenticação)
export async function GET() {
  try {
    // Buscar todas as configurações
    const configs = await db.configuracao.findMany()

    // Transformar em objeto chave-valor
    const configuracoes: Record<string, string> = {}
    configs.forEach(c => {
      configuracoes[c.chave] = c.valor
    })

    // Retornar apenas configurações públicas
    return NextResponse.json({
      success: true,
      configuracoes: {
        siteNome: configuracoes.siteNome || 'TecOS',
        siteDescricao: configuracoes.siteDescricao || 'Sistema de Ordens de Serviço para Assistências Técnicas',
        sitePreco: configuracoes.sitePreco || '29',
        sitePrecoAnual: configuracoes.sitePrecoAnual || '290',
        siteWhatsapp: configuracoes.siteWhatsapp || '',
        siteEmail: configuracoes.siteEmail || '',
      }
    })
  } catch {
    return NextResponse.json({
      success: true,
      configuracoes: {
        siteNome: 'TecOS',
        siteDescricao: 'Sistema de Ordens de Serviço para Assistências Técnicas',
        sitePreco: '29',
        sitePrecoAnual: '290',
        siteWhatsapp: '',
        siteEmail: '',
      }
    })
  }
}
