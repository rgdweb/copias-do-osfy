import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo === 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar loja com dados de trial
    const loja = await db.loja.findUnique({
      where: { id: user.lojaId },
      include: {
        faturas: {
          where: { status: 'pendente' },
          orderBy: { dataVencimento: 'asc' }
        }
      }
    })

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Buscar configurações de pagamento
    const configPagamento = await db.configuracaoPagamento.findFirst()
    
    const valorMensalidade = configPagamento?.valorMensalidade || 29.90
    const valorAnuidade = configPagamento?.valorAnuidade || 290.00
    const diasBloqueio = configPagamento?.diasBloqueio || 20

    const agora = new Date()
    
    // Determinar status
    let status = 'ativo'
    let diasTrialRestantes = 0
    let diasAtraso = 0
    let valorComJuros = 0
    let faturaAtual = loja.faturas[0] || null

    // Verificar período de trial
    if (loja.trialAte) {
      const trialFim = new Date(loja.trialAte)
      if (agora < trialFim) {
        status = 'trial'
        const diffMs = trialFim.getTime() - agora.getTime()
        diasTrialRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      } else if (!loja.trialUsado) {
        // Trial expirado mas não pagou
        status = 'trial_expirado'
      }
    }

    // Se tem fatura pendente, verificar se está vencida
    if (faturaAtual) {
      const vencimento = new Date(faturaAtual.dataVencimento)
      if (agora > vencimento) {
        status = 'atrasado'
        const diffMs = agora.getTime() - vencimento.getTime()
        diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        
        // Calcular juros (1% ao mês + multa 2%)
        const juros = faturaAtual.valor * (0.01 * (diasAtraso / 30))
        const multa = faturaAtual.valor * 0.02
        valorComJuros = faturaAtual.valor + juros + multa
      } else {
        status = 'pendente'
      }
    }

    // Verificar se deve bloquear
    if (diasAtraso >= diasBloqueio) {
      status = 'bloqueado'
    }

    // Histórico de pagamentos (últimos 12 meses)
    const historico = await db.fatura.findMany({
      where: {
        lojaId: loja.id,
        status: 'paga'
      },
      orderBy: { dataPagamento: 'desc' },
      take: 12
    })

    // Calcular valor com juros para cada fatura pendente
    const faturasComJuros = loja.faturas.map(f => {
      const vencimento = new Date(f.dataVencimento)
      const diasVencida = agora > vencimento 
        ? Math.floor((agora.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      
      const juros = f.valor * (0.01 * (diasVencida / 30))
      const multa = diasVencida > 0 ? f.valor * 0.02 : 0
      
      return {
        id: f.id,
        numeroFatura: f.numeroFatura,
        valor: f.valor,
        valorComJuros: Math.round((f.valor + juros + multa) * 100) / 100,
        dataVencimento: f.dataVencimento,
        diasAtraso: diasVencida,
        codigoPix: f.codigoPix,
        qrCodePix: f.qrCodePix,
        linkBoleto: f.linkBoleto,
        linkPagamento: f.linkPagamento
      }
    })

    return NextResponse.json({
      success: true,
      status,
      loja: {
        nome: loja.nome,
        email: loja.email,
        plano: loja.plano,
        precoPlano: loja.precoPlano
      },
      diasAtraso,
      valorTotal: loja.faturas.reduce((acc, f) => acc + f.valor, 0),
      valorComJuros: faturasComJuros.reduce((acc, f) => acc + f.valorComJuros, 0),
      faturas: faturasComJuros,
      trial: {
        ativo: status === 'trial',
        diasRestantes: diasTrialRestantes,
        expirado: status === 'trial_expirado',
        dataFim: loja.trialAte
      },
      pagamento: {
        pendente: status === 'pendente' || status === 'atrasado',
        atrasado: status === 'atrasado',
        diasAtraso,
        valorOriginal: faturaAtual?.valor || 0,
        valorComJuros: Math.round(valorComJuros * 100) / 100,
        dataVencimento: faturaAtual?.dataVencimento || null,
        fatura: faturaAtual ? {
          id: faturaAtual.id,
          codigoPix: faturaAtual.codigoPix,
          qrCodePix: faturaAtual.qrCodePix,
          linkBoleto: faturaAtual.linkBoleto,
          linkPagamento: faturaAtual.linkPagamento
        } : null
      },
      valores: {
        mensalidade: valorMensalidade,
        anuidade: valorAnuidade
      },
      historico: historico.map(f => ({
        id: f.id,
        referencia: f.referencia,
        valor: f.valor,
        dataPagamento: f.dataPagamento,
        formaPagamento: f.formaPagamento
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar status de pagamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar status de pagamento' },
      { status: 500 }
    )
  }
}
