'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface SignatureCanvasProps {
  onSave: (signature: string) => void
  onCancel?: () => void
  width?: number
  height?: number
}

export function SignatureCanvas({ onSave, onCancel, width = 400, height = 150 }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    setHasSignature(true)
    
    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const signature = canvas.toDataURL('image/png')
    onSave(signature)
  }

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white touch-none"
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearCanvas}
          className="text-sm"
        >
          Limpar
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="text-sm"
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="button" 
          onClick={saveSignature}
          disabled={!hasSignature}
          className="bg-emerald-600 hover:bg-emerald-700 text-sm"
        >
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  )
}
