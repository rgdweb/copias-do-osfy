import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ authenticated: false })
  }

  // Buscar foto do usuário no banco
  let foto: string | null = null
  
  if (user.tipo === 'loja') {
    const loja = await db.loja.findUnique({
      where: { id: user.id },
      select: { logo: true }
    })
    foto = loja?.logo || null
  } else if (user.tipo === 'usuario') {
    const usuario = await db.usuario.findUnique({
      where: { id: user.id },
      select: { foto: true }
    })
    foto = usuario?.foto || null
  }
  
  return NextResponse.json({ 
    authenticated: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      lojaId: user.lojaId,
      foto
    }
  })
}
