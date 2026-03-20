import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateUniqueSlug } from '@/lib/auth/auth'
import { buscarOuCriarCustomer, criarCobranca } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      nome,
      responsavel,
      telefone,
      whatsapp,
      email,
      senha,
      cidade,
      estado,
      endereco,
      descricao,
      horarioAtendimento,
      tiposServico,
      tipoPlano = 'mensal'
    } = body

    // Validações básicas
    if (!nome || !responsavel || !telefone || !whatsapp || !email || !senha || !cidade || !estado || !endereco) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const emailExiste = await db.loja.findUnique({
      where: { email }
    })

    if (emailExiste) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Gerar slug único
    const slug = await generateUniqueSlug(nome)

    // Hash da senha
    const senhaHash = await hashPassword(senha)

    // Buscar configurações de pagamento
    const configPagamento = await db.configuracaoPagamento.findFirst()
    
    // Definir valor do plano
    const precoPlano = tipoPlano === 'anual' 
      ? (configPagamento?.valorAnuidade || 290)
      : (configPagamento?.valorMensalidade || 29.90)

    // Definir data de trial (7 dias a partir de hoje)
    const trialAte = new Date()
    trialAte.setDate(trialAte.getDate() + 7)

    // Criar loja com trial e status ativo
    const loja = await db.loja.create({
      data: {
        nome,
        slug,
        responsavel,
        telefone,
        whatsapp,
        email,
        senhaHash,
        cidade,
        estado,
        endereco,
        descricao: descricao || null,
        horarioAtendimento: horarioAtendimento || null,
        tiposServico: tiposServico || null,
        status: 'ativa', // Ativar automaticamente durante o trial
        plano: tipoPlano,
        precoPlano,
        trialAte,
        trialUsado: false
      }
    })

    // Criar contador de OS para a loja
    await db.contadorOS.create({
      data: {
        lojaId: loja.id,
        ultimoNumero: 0
      }
    })

    // Variável para armazenar dados da cobrança
    let cobrancaData: {
      valor: number;
      pixQrCode?: string;
      pixPayload?: string;
      linkPagamento?: string;
      linkBoleto?: string;
    } | null = null

    // Tentar criar cobrança no Asaas se configurado
    if (configPagamento?.asaasApiKey) {
      try {
        // Criar ou buscar cliente no Asaas
        const customerResult = await buscarOuCriarCustomer(
          nome,
          email,
          telefone.replace(/\D/g, ''), // CPF/CNPJ - usar telefone como placeholder
          whatsapp.replace(/\D/g, '')
        )

        if (customerResult.success && customerResult.customerId) {
          // Data de vencimento (5 dias a partir de hoje)
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + 5)
          const dataVencimentoStr = dataVencimento.toISOString().split('T')[0]

          // Criar cobrança
          const descricaoCobranca = tipoPlano === 'anual'
            ? `Plano Anual - ${nome}`
            : `Plano Mensal - ${nome}`

          const cobrancaResult = await criarCobranca(
            customerResult.customerId,
            precoPlano,
            dataVencimentoStr,
            descricaoCobranca,
            'UNDEFINED' // Permite PIX e Boleto
          )

          if (cobrancaResult.success) {
            // Salvar fatura no banco
            const ultimoNumero = await db.fatura.count({
              where: { lojaId: loja.id }
            })

            await db.fatura.create({
              data: {
                lojaId: loja.id,
                numeroFatura: ultimoNumero + 1,
                valor: precoPlano,
                status: 'pendente',
                formaPagamento: 'pix',
                asaasId: cobrancaResult.cobrancaId,
                asaasCustomerId: customerResult.customerId,
                codigoPix: cobrancaResult.pixPayload,
                qrCodePix: cobrancaResult.pixQrCode,
                linkBoleto: cobrancaResult.bankSlipUrl,
                linkPagamento: cobrancaResult.invoiceUrl,
                dataVencimento,
                referencia: tipoPlano === 'anual' 
                  ? `Anual ${new Date().getFullYear()}`
                  : `${new Date().toLocaleString('pt-BR', { month: 'long' })}/${new Date().getFullYear()}`
              }
            })

            // Retornar dados da cobrança para o frontend
            cobrancaData = {
              valor: precoPlano,
              pixQrCode: cobrancaResult.pixQrCode,
              pixPayload: cobrancaResult.pixPayload,
              linkPagamento: cobrancaResult.invoiceUrl,
              linkBoleto: cobrancaResult.bankSlipUrl
            }
          }
        }
      } catch (error) {
        console.error('[Criar Loja] Erro ao criar cobrança:', error)
        // Continua mesmo sem cobrança - loja foi criada
      }
    }

    return NextResponse.json({
      success: true,
      slug: loja.slug,
      cobranca: cobrancaData,
      message: 'Loja criada com sucesso'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao criar loja: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'API de lojas funcionando' })
}
