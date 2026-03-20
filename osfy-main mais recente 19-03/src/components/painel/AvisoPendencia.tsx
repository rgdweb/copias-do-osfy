'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Gift,
  ArrowRight,
  X,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StatusData {
  status: 'trial' | 'ativo' | 'pendente' | 'atrasado' | 'bloqueado'
  trial: {
    ativo: boolean
    expirado: boolean
    diasRestantes: number
    dataFim: string | null
  }
  pagamento: {
    diasAtraso: number
    valorAtualizado: number
    faturasPendentes: number
    totalPendente: number
  }
}

interface AvisoPendenciaProps {
  className?: string
}

export function AvisoPendencia({ className }: AvisoPendenciaProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/painel/status-pagamento')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus(data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Não mostrar se estiver carregando, dispensado ou status ativo
  if (loading || dismissed || !status || status.status === 'ativo') {
    return null
  }

  // Determinar cores e ícones baseado no status
  const getConfig = () => {
    switch (status.status) {
      case 'trial':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          bgLight: 'bg-amber-50',
          text: 'text-white',
          textDark: 'text-amber-800',
          border: 'border-amber-200',
          icon: Gift,
          iconColor: 'text-amber-100'
        }
      case 'pendente':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
          bgLight: 'bg-orange-50',
          text: 'text-white',
          textDark: 'text-orange-800',
          border: 'border-orange-200',
          icon: Clock,
          iconColor: 'text-orange-100'
        }
      case 'atrasado':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-red-500',
          bgLight: 'bg-red-50',
          text: 'text-white',
          textDark: 'text-red-800',
          border: 'border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-100'
        }
      case 'bloqueado':
        return {
          bg: 'bg-gradient-to-r from-red-800 to-red-700',
          bgLight: 'bg-red-100',
          text: 'text-white',
          textDark: 'text-red-900',
          border: 'border-red-300',
          icon: AlertTriangle,
          iconColor: 'text-red-200'
        }
      default:
        return {
          bg: 'bg-slate-500',
          bgLight: 'bg-slate-50',
          text: 'text-white',
          textDark: 'text-slate-800',
          border: 'border-slate-200',
          icon: Clock,
          iconColor: 'text-slate-100'
        }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  // Renderizar mensagem baseado no status
  const renderMensagem = () => {
    switch (status.status) {
      case 'trial':
        return (
          <div className="flex items-center justify-center gap-3">
            <Gift className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">
              Período de Teste Gratuito!
            </span>
            <span className="text-white/60">|</span>
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              {status.trial.diasRestantes} {status.trial.diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
            </span>
          </div>
        )
      
      case 'pendente':
        return (
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">
              Pagamento Pendente
            </span>
            <span className="text-white/60">|</span>
            <span className="text-sm">
              {status.pagamento.faturasPendentes} {status.pagamento.faturasPendentes === 1 ? 'fatura aguardando' : 'faturas aguardando'}
            </span>
          </div>
        )
      
      case 'atrasado':
        return (
          <div className="flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="font-bold">
              Pagamento em Atraso!
            </span>
            <span className="text-white/60">|</span>
            <span className="text-sm font-medium">
              {status.pagamento.diasAtraso} {status.pagamento.diasAtraso === 1 ? 'dia' : 'dias'} • R$ {status.pagamento.valorAtualizado.toFixed(2)}
            </span>
          </div>
        )
      
      case 'bloqueado':
        return (
          <div className="flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="font-bold">
              Acesso Bloqueado
            </span>
            <span className="text-white/60">|</span>
            <span className="text-sm font-medium">
              Regularize sua situação para continuar
            </span>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={cn(
      'relative overflow-hidden',
      className
    )}>
      {/* Barra principal */}
      <div className={cn(
        'px-4 py-3 flex items-center justify-center gap-4',
        config.bg,
        config.text
      )}>
        <div className="flex items-center justify-center gap-6 flex-1">
          {renderMensagem()}
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/painel/pagamento">
            <Button 
              size="sm"
              variant="secondary"
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">
                {status.status === 'trial' ? 'Ver Planos' : 'Regularizar Agora'}
              </span>
              <span className="sm:hidden">Regularizar</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          
          {status.status !== 'bloqueado' && status.status !== 'atrasado' && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de progresso para trial */}
      {status.status === 'trial' && status.trial.dataFim && (
        <div className="h-1 bg-amber-200">
          <div 
            className="h-full bg-white/50 transition-all duration-500"
            style={{ 
              width: `${Math.max(0, Math.min(100, (status.trial.diasRestantes / 7) * 100))}%` 
            }}
          />
        </div>
      )}

      {/* Animação de urgência para atrasado/bloqueado */}
      {(status.status === 'atrasado' || status.status === 'bloqueado') && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none" />
      )}
    </div>
  )
}
