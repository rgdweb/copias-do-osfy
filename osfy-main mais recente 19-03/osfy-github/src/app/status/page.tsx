import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function StatusPage() {
  let dbStatus = 'Não testado'
  let adminCount = 0
  let lojaCount = 0
  let cookieStatus = 'Nenhum cookie'
  
  try {
    // Testar conexão com banco
    await db.$queryRaw`SELECT 1`
    dbStatus = '✅ Conectado'
    
    // Contar registros
    adminCount = await db.superAdmin.count()
    lojaCount = await db.loja.count()
  } catch (e) {
    dbStatus = `❌ Erro: ${e instanceof Error ? e.message : String(e)}`
  }
  
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('tecos-token')
    cookieStatus = token ? '✅ Cookie presente' : '❌ Sem cookie de autenticação'
  } catch (e) {
    cookieStatus = `Erro: ${e instanceof Error ? e.message : String(e)}`
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      color: 'white', 
      padding: 40,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: 28, marginBottom: 30 }}>📊 Status do Sistema TecOS</h1>
      
      <div style={{ display: 'grid', gap: 20, maxWidth: 600 }}>
        
        {/* Banco de Dados */}
        <div style={{ background: '#1e293b', padding: 20, borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 15, color: '#10b981' }}>🗄️ Banco de Dados</h2>
          <p><strong>Status:</strong> {dbStatus}</p>
          <p><strong>Super Admins:</strong> {adminCount}</p>
          <p><strong>Lojas:</strong> {lojaCount}</p>
        </div>
        
        {/* Cookies */}
        <div style={{ background: '#1e293b', padding: 20, borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 15, color: '#10b981' }}>🍪 Cookies</h2>
          <p><strong>Autenticação:</strong> {cookieStatus}</p>
        </div>
        
        {/* Credenciais */}
        <div style={{ background: '#14532d', padding: 20, borderRadius: 12, border: '1px solid #22c55e' }}>
          <h2 style={{ fontSize: 18, marginBottom: 15 }}>🔐 Credenciais Padrão</h2>
          <p><strong>Email:</strong> <code style={{ background: '#000', padding: '2px 8px', borderRadius: 4 }}>admin@tecos.com</code></p>
          <p><strong>Senha:</strong> <code style={{ background: '#000', padding: '2px 8px', borderRadius: 4 }}>admin123</code></p>
        </div>
        
        {/* Ações */}
        <div style={{ background: '#1e293b', padding: 20, borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 15, color: '#10b981' }}>🔗 Links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/api/seed" style={{ color: '#60a5fa' }}>→ Inicializar banco de dados (/api/seed)</a>
            <a href="/teste" style={{ color: '#60a5fa' }}>→ Página de teste de login (/teste)</a>
            <a href="/login-simples" style={{ color: '#60a5fa' }}>→ Login simplificado (/login-simples)</a>
            <a href="/superadmin" style={{ color: '#60a5fa' }}>→ Painel Super Admin (/superadmin)</a>
            <a href="/" style={{ color: '#94a3b8' }}>→ Página inicial (/)</a>
          </div>
        </div>
        
        {/* Instruções */}
        <div style={{ background: '#1e3a5f', padding: 20, borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 15 }}>📝 Instruções para Produção</h2>
          <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Acesse <code>/api/seed</code> para criar o super admin</li>
            <li>Acesse <code>/teste</code> para fazer login</li>
            <li>Se funcionar, você será redirecionado para <code>/superadmin</code></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
