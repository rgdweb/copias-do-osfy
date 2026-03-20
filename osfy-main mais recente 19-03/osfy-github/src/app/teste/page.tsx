'use client'

import { useState } from 'react'

export default function TestePage() {
  const [resultado, setResultado] = useState('')
  const [loading, setLoading] = useState(false)

  const testarLogin = async () => {
    setLoading(true)
    setResultado('Enviando requisição...\n')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@tecos.com',
          senha: 'admin123',
          tipo: 'superadmin'
        })
      })

      const data = await res.json()
      setResultado(prev => prev + `Status: ${res.status}\n`)
      setResultado(prev => prev + `Resposta: ${JSON.stringify(data, null, 2)}\n`)

      if (data.success) {
        setResultado(prev => prev + '\n✅ LOGIN FUNCIONOU!\n')
        
        // Testar se o cookie foi salvo
        setResultado(prev => prev + 'Verificando cookie...\n')
        
        const debugRes = await fetch('/api/debug')
        const debugData = await debugRes.json()
        setResultado(prev => prev + `Cookies: ${JSON.stringify(debugData, null, 2)}\n`)
        
        // Tentar redirecionar
        setResultado(prev => prev + '\n🔄 Redirecionando em 2 segundos...\n')
        
        setTimeout(() => {
          setResultado(prev => prev + 'Executando window.location.href = "/superadmin"\n')
          window.location.href = '/superadmin'
        }, 2000)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setResultado(prev => prev + `ERRO: ${errorMsg}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      color: 'white', 
      padding: 40,
      fontFamily: 'monospace'
    }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>🧪 Teste de Login</h1>
      
      <button
        onClick={testarLogin}
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: loading ? '#475569' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          cursor: loading ? 'wait' : 'pointer',
          marginBottom: 20
        }}
      >
        {loading ? 'Testando...' : 'Fazer Login como Admin'}
      </button>

      <div style={{
        background: '#1e293b',
        padding: 16,
        borderRadius: 8,
        whiteSpace: 'pre-wrap',
        fontSize: 14,
        minHeight: 200
      }}>
        {resultado || 'Clique no botão para testar o login...'}
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/debug" style={{ color: '#10b981', marginRight: 20 }}>
          Ver Debug →
        </a>
        <a href="/superadmin" style={{ color: '#10b981', marginRight: 20 }}>
          Ir para Super Admin →
        </a>
        <a href="/" style={{ color: '#64748b' }}>
          Voltar ao Início →
        </a>
      </div>
    </div>
  )
}
