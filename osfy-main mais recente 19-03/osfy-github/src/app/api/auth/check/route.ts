import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ authenticated: false })
  }
  
  return NextResponse.json({ 
    authenticated: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      lojaId: user.lojaId
    }
  })
}
