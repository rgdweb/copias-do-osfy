'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, CreditCard, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StatusPagamento {
  status: string
  trial: {
    ativo: boolean
    diasRestantes: number
    expirado: boolean
  }
  pagamento: {
    pendente: boolean
    atrasado: boolean
    diasAtraso: number
    valorComJuros: number
  }
}

export default function AvisoPagamento() {
  const [status, setStatus] = useState<StatusPagamento | null>(null)
  const [fechado, setFechado] = useState(false)

  useEffect(() => {
    fetch('/api/painel/status-pagamento')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus(data)
        }
      })
      .catch(() => {})
  }, [])

  if (!status || fechado) return null

  // Se está ativo e em dia, não mostrar nada
  if (status.status === 'ativo' && !status.trial.ativo) return null

  // Trial ativo
  if (status.trial.ativo) {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" />
            <span>
              <strong>Período de teste:</strong> Você tem {status.trial.diasRestantes} dias grátis restantes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/painel/pagamento">
              <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                Antecipar Pagamento
              </Button>
            </Link>
            <button onClick={() => setFechado(true)} className="p-1 hover:bg-white/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Trial expirado
  if (status.trial.expirado && !status.pagamento.pendente) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span>
              <strong>Período de teste encerrado!</strong> Escolha um plano para continuar usando o sistema
            </span>
          </div>
          <Link href="/painel/pagamento">
            <Button className="bg-white text-amber-700 hover:bg-amber-50">
              <CreditCard className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Pagamento em atraso
  if (status.pagamento.atrasado) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span>
              <strong>Pagamento em atraso há {status.pagamento.diasAtraso} dias!</strong>
              {status.pagamento.valorComJuros > 0 && (
                <span className="ml-2">Valor atualizado: R$ {status.pagamento.valorComJuros.toFixed(2).replace('.', ',')}</span>
              )}
            </span>
          </div>
          <Link href="/painel/pagamento">
            <Button className="bg-white text-red-700 hover:bg-red-50 animate-pulse">
              <CreditCard className="w-4 h-4 mr-2" />
              Regularizar Agora
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Pagamento pendente
  if (status.pagamento.pendente) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5" />
            <span>
              <strong>Você tem uma fatura pendente.</strong> Clique para pagar
            </span>
          </div>
          <Link href="/painel/pagamento">
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              Pagar Agora
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return null
}
