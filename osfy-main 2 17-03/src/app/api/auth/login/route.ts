import { NextRequest, NextResponse } from 'next/server'
import { loginLoja, loginSuperAdmin } from '@/lib/auth/auth'
import { ensureDatabaseInitialized } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Garantir que o banco está inicializado
    await ensureDatabaseInitialized()
    
    const body = await request.json()
    const { email, senha, tipo } = body

    // Debug log
    console.log('[LOGIN] Requisição recebida:', {
      email: email || 'undefined',
      senhaLength: senha ? senha.length : 0,
      tipo: tipo || 'auto'
    })

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Normalizar email (remover espaços e converter para minúsculo)
    const emailNormalizado = email.toString().trim().toLowerCase()
    console.log('[LOGIN] Email normalizado:', emailNormalizado)

    let result
    let tipoDetectado = tipo

    // Se tipo não especificado, tentar detectar automaticamente
    if (!tipo || tipo === 'auto') {
      // Tentar primeiro como superadmin
      console.log('[LOGIN] Tentando login como superadmin...')
      result = await loginSuperAdmin(emailNormalizado, senha)
      console.log('[LOGIN] Resultado superadmin:', result.success ? 'SUCESSO' : result.error)
      
      if (result.success) {
        tipoDetectado = 'superadmin'
      } else {
        // Se não for superadmin, tentar como loja
        console.log('[LOGIN] Tentando login como loja...')
        result = await loginLoja(emailNormalizado, senha)
        console.log('[LOGIN] Resultado loja:', result.success ? 'SUCESSO' : result.error)
        if (result.success) {
          tipoDetectado = 'loja'
        }
      }
    } else {
      // Tipo especificado
      if (tipo === 'superadmin') {
        result = await loginSuperAdmin(emailNormalizado, senha)
      } else {
        result = await loginLoja(emailNormalizado, senha)
      }
    }

    if (!result || !result.success) {
      console.log('[LOGIN] Falha no login:', result?.error)
      return NextResponse.json(
        { success: false, error: result?.error || 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    console.log('[LOGIN] Login bem-sucedido! Tipo:', tipoDetectado)

    // Create response with cookie
    const response = NextResponse.json({ success: true, tipo: tipoDetectado })
    
    // Detectar se está em produção (HTTPS)
    const isProduction = process.env.NODE_ENV === 'production'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const isSecure = isProduction || protocol === 'https'
    
    // Configurar cookie com opções compatíveis com ambos ambientes
    response.cookies.set('tecos-token', result.token!, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[LOGIN] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
