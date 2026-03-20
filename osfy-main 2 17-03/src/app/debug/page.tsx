import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const tecosToken = cookieStore.get('tecos-token')
  
  // Buscar superadmin
  const superAdmins = await db.superAdmin.findMany({
    select: { id: true, nome: true, email: true }
  })
  
  // Buscar lojas
  const lojas = await db.loja.findMany({
    select: { id: true, nome: true, email: true, status: true, slug: true }
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">🔍 Debug - TecOS</h1>
        
        {/* Cookie do TecOS */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Cookie tecos-token</h2>
          {tecosToken ? (
            <div className="space-y-2">
              <p className="text-green-400">✅ Cookie encontrado!</p>
              <p className="text-sm break-all">
                <span className="text-slate-400">Valor:</span>{' '}
                {tecosToken.value.substring(0, 50)}...
              </p>
            </div>
          ) : (
            <p className="text-red-400">❌ Cookie NÃO encontrado</p>
          )}
        </div>

        {/* Todos os Cookies */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">
            Todos os Cookies ({allCookies.length})
          </h2>
          {allCookies.length > 0 ? (
            <div className="space-y-2">
              {allCookies.map((cookie) => (
                <div key={cookie.name} className="bg-slate-700 p-3 rounded">
                  <p className="font-medium text-yellow-400">{cookie.name}</p>
                  <p className="text-sm break-all text-slate-300">
                    {cookie.value.substring(0, 100)}{cookie.value.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nenhum cookie encontrado</p>
          )}
        </div>

        {/* Super Admins */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">
            Super Admins ({superAdmins.length})
          </h2>
          {superAdmins.length > 0 ? (
            <div className="space-y-2">
              {superAdmins.map((admin) => (
                <div key={admin.id} className="bg-slate-700 p-3 rounded">
                  <p className="font-medium">{admin.nome}</p>
                  <p className="text-sm text-slate-400">{admin.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nenhum super admin cadastrado</p>
          )}
        </div>

        {/* Lojas */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">
            Lojas ({lojas.length})
          </h2>
          {lojas.length > 0 ? (
            <div className="space-y-2">
              {lojas.map((loja) => (
                <div key={loja.id} className="bg-slate-700 p-3 rounded">
                  <div className="flex justify-between">
                    <p className="font-medium">{loja.nome}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      loja.status === 'ativa' ? 'bg-green-600' :
                      loja.status === 'pendente' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {loja.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{loja.email}</p>
                  <p className="text-xs text-slate-500">Slug: {loja.slug}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nenhuma loja cadastrada</p>
          )}
        </div>

        {/* Ações */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <a href="/" className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg">
              Ir para Home
            </a>
            <a href="/superadmin" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
              Ir para Super Admin
            </a>
            <a href="/painel" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg">
              Ir para Painel
            </a>
          </div>
        </div>

        {/* Login Info */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-lg p-6 border border-emerald-500">
          <h2 className="text-xl font-semibold mb-4">📝 Credenciais de Teste</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-emerald-300">Super Admin:</p>
              <p className="text-sm">Email: <code className="bg-slate-700 px-2 py-1 rounded">admin@tecos.com</code></p>
              <p className="text-sm">Senha: <code className="bg-slate-700 px-2 py-1 rounded">admin123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
