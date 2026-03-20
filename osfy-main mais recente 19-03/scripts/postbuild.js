/**
 * Script de pós-build para VPS com SQLite
 * No Vercel com PostgreSQL, este script é ignorado
 */

const fs = require('fs')
const path = require('path')

const isSQLite = process.env.DATABASE_URL?.startsWith('file:')

if (!isSQLite) {
  console.log('[POSTBUILD] Usando PostgreSQL - pulando cópia de arquivos SQLite')
  process.exit(0)
}

console.log('[POSTBUILD] Usando SQLite - copiando arquivos para standalone...')

const standaloneDir = path.join(process.cwd(), '.next', 'standalone')
const dbDir = path.join(standaloneDir, 'db')

// Verificar se standalone existe
if (!fs.existsSync(standaloneDir)) {
  console.log('[POSTBUILD] Standalone não encontrado - pulando')
  process.exit(0)
}

// Criar diretório db
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Copiar banco de dados
const dbPath = path.join(process.cwd(), 'db', 'custom.db')
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, path.join(dbDir, 'custom.db'))
  console.log('[POSTBUILD] ✅ Banco de dados copiado')
}

// Copiar static
const staticSrc = path.join(process.cwd(), '.next', 'static')
const staticDest = path.join(standaloneDir, '.next', 'static')
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true })
  console.log('[POSTBUILD] ✅ Static copiado')
}

// Copiar public
const publicSrc = path.join(process.cwd(), 'public')
const publicDest = path.join(standaloneDir, 'public')
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true })
  console.log('[POSTBUILD] ✅ Public copiado')
}

// Copiar prisma
const prismaSrc = path.join(process.cwd(), 'prisma')
const prismaDest = path.join(standaloneDir, 'prisma')
if (fs.existsSync(prismaSrc)) {
  fs.cpSync(prismaSrc, prismaDest, { recursive: true })
  console.log('[POSTBUILD] ✅ Prisma copiado')
}

console.log('[POSTBUILD] 🎉 Build finalizado!')
