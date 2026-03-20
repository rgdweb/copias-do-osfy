import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { hash, compare } from 'bcryptjs'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tecos-secret-key-super-segura-2024'
)

// Tipos de usuário
export type UserType = 'loja' | 'usuario' | 'superadmin'

export interface AuthUser {
  id: string
  tipo: UserType
  lojaId?: string
  nome: string
  email: string
}

// Hash de senha
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

// Verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

// Gerar token JWT
export async function generateToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    tipo: user.tipo,
    lojaId: user.lojaId,
    nome: user.nome,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)
}

// Verificar token JWT
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as unknown as AuthUser
  } catch {
    return null
  }
}

// Login de loja
export async function loginLoja(email: string, senha: string): Promise<{ success: boolean; token?: string; error?: string }> {
  console.log('[AUTH-LOJA] Buscando loja com email:', email)
  
  const loja = await db.loja.findUnique({
    where: { email }
  })

  console.log('[AUTH-LOJA] Loja encontrada:', loja ? `${loja.email} (${loja.status})` : 'NENHUMA')

  if (!loja) {
    return { success: false, error: 'Email não encontrado' }
  }

  if (loja.status === 'pendente') {
    return { success: false, error: 'Sua loja ainda não foi ativada. Aguarde a aprovação.' }
  }

  if (loja.status === 'bloqueada') {
    return { success: false, error: 'Sua loja está bloqueada. Entre em contato com o suporte.' }
  }

  const senhaValida = await verifyPassword(senha, loja.senhaHash)
  if (!senhaValida) {
    return { success: false, error: 'Senha incorreta' }
  }

  const token = await generateToken({
    id: loja.id,
    tipo: 'loja',
    lojaId: loja.id,
    nome: loja.responsavel,
    email: loja.email,
  })

  return { success: true, token }
}

// Login de usuário (técnico)
export async function loginUsuario(email: string, senha: string, lojaSlug: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const loja = await db.loja.findUnique({
    where: { slug: lojaSlug }
  })

  if (!loja) {
    return { success: false, error: 'Loja não encontrada' }
  }

  const usuario = await db.usuario.findFirst({
    where: { email, lojaId: loja.id }
  })

  if (!usuario) {
    return { success: false, error: 'Email não encontrado' }
  }

  if (!usuario.ativo) {
    return { success: false, error: 'Usuário inativo' }
  }

  const senhaValida = await verifyPassword(senha, usuario.senhaHash)
  if (!senhaValida) {
    return { success: false, error: 'Senha incorreta' }
  }

  const token = await generateToken({
    id: usuario.id,
    tipo: 'usuario',
    lojaId: loja.id,
    nome: usuario.nome,
    email: usuario.email,
  })

  return { success: true, token }
}

// Login de super admin
export async function loginSuperAdmin(email: string, senha: string): Promise<{ success: boolean; token?: string; error?: string }> {
  console.log('[AUTH-SUPERADMIN] Buscando admin com email:', email)
  
  const admin = await db.superAdmin.findUnique({
    where: { email }
  })

  console.log('[AUTH-SUPERADMIN] Admin encontrado:', admin ? admin.email : 'NENHUM')

  if (!admin) {
    return { success: false, error: 'Email não encontrado' }
  }

  const senhaValida = await verifyPassword(senha, admin.senhaHash)
  if (!senhaValida) {
    return { success: false, error: 'Senha incorreta' }
  }

  const token = await generateToken({
    id: admin.id,
    tipo: 'superadmin',
    nome: admin.nome,
    email: admin.email,
  })

  return { success: true, token }
}

// Obter usuário atual
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('tecos-token')?.value

    if (!token) {
      return null
    }

    const user = await verifyToken(token)
    return user
  } catch {
    return null
  }
}

// Gerar slug único
export function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)
}

// Verificar se slug existe
export async function slugExists(slug: string): Promise<boolean> {
  const loja = await db.loja.findUnique({
    where: { slug }
  })
  return !!loja
}

// Gerar slug único
export async function generateUniqueSlug(nome: string): Promise<string> {
  let slug = generateSlug(nome)
  let contador = 1

  while (await slugExists(slug)) {
    slug = `${generateSlug(nome)}-${contador}`
    contador++
  }

  return slug
}
