import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'

// Testar conexão com a API do Asaas
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { apiKey, ambiente } = body

    console.log('[ASAAS TEST] Dados recebidos:', { 
      apiKeyPrefix: apiKey?.substring(0, 15) + '...',
      ambiente 
    })

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key não fornecida' },
        { status: 400 }
      )
    }

    // URL base da API do Asaas - AMBIENTES DIFERENTES
    // IMPORTANTE: Sandbox usa subdomínio diferente!
    const baseUrl = ambiente === 'producao' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3'

    console.log('[ASAAS TEST] URL:', baseUrl)
    console.log('[ASAAS TEST] Ambiente:', ambiente)

    // Testar chamada para listar clientes (endpoint simples)
    const response = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log('[ASAAS TEST] Status da resposta:', response.status)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: `✅ Conexão bem-sucedida com o Asaas (${ambiente === 'producao' ? 'Produção' : 'Sandbox'})!`,
        data: {
          totalCount: data.totalCount || 0,
          ambiente: ambiente
        }
      })
    } else {
      let errorMessage = `Erro ${response.status}`
      
      try {
        const errorData = await response.json()
        console.error('[ASAAS TEST] Erro retornado:', errorData)
        
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].description || errorMessage
        }
      } catch {
        // Ignora erro ao parsear resposta
      }

      // Mensagens específicas
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'API Key inválida ou sem permissão. Verifique se a chave está correta e ativa no Asaas.'
        })
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      })
    }
  } catch (error) {
    console.error('[ASAAS TEST] Erro de conexão:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro de conexão. Verifique sua internet e tente novamente.'
    })
  }
}
