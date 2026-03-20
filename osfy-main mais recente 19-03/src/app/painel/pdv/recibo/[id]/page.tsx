'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Printer, FileText, ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ItemVenda {
  id: string
  descricao: string
  quantidade: number
  precoUnitario: number
  total: number
  tipo: string
}

interface Venda {
  id: string
  numeroVenda: number
  clienteNome: string | null
  subtotal: number
  desconto: number
  total: number
  formaPagamento: string
  valorPago: number | null
  troco: number | null
  status: string
  dataVenda: string
  itens: ItemVenda[]
}

interface LojaInfo {
  nome: string
  endereco: string
  telefone: string
}

export default function ReciboPage() {
  const params = useParams()
  const vendaId = params.id as string
  
  const [venda, setVenda] = useState<Venda | null>(null)
  const [loja, setLoja] = useState<LojaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [tipoImpressao, setTipoImpressao] = useState<'termica' | 'a4'>('termica')
  const [tamanhoTermica, setTamanhoTermica] = useState<'58mm' | '80mm'>('80mm')

  useEffect(() => {
    loadVenda()
    loadLoja()
  }, [vendaId])

  const loadVenda = async () => {
    try {
      const res = await fetch(`/api/painel/pdv/vendas/${vendaId}`)
      const data = await res.json()
      if (data.success) {
        setVenda(data.venda)
      }
    } catch {
      console.error('Erro ao carregar venda')
    } finally {
      setLoading(false)
    }
  }

  const loadLoja = async () => {
    try {
      const res = await fetch('/api/painel/configuracoes')
      const data = await res.json()
      if (data.success && data.loja) {
        setLoja({
          nome: data.loja.nome || 'TecOS PDV',
          endereco: data.loja.endereco || '',
          telefone: data.loja.telefone || ''
        })
      }
    } catch {
      // Silencioso
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarFormaPagamento = (forma: string) => {
    const formas: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_credito: 'Cartão Crédito',
      cartao_debito: 'Cartão Débito'
    }
    return formas[forma] || forma
  }

  const imprimir = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 print:bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  if (!venda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Venda não encontrada</h1>
            <p className="text-slate-500 mb-4">O recibo solicitado não existe ou foi removido.</p>
            <Button variant="outline" onClick={() => window.close()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dadosLoja = loja || { nome: 'TecOS PDV', endereco: '', telefone: '' }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4">
      {/* Controles - Ocultos na impressão */}
      <div className="max-w-4xl mx-auto mb-4 print:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tipo:</span>
                <div className="flex gap-2">
                  <Button
                    variant={tipoImpressao === 'termica' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoImpressao('termica')}
                    className={tipoImpressao === 'termica' ? 'bg-slate-700 hover:bg-slate-800' : ''}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Térmica
                  </Button>
                  <Button
                    variant={tipoImpressao === 'a4' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoImpressao('a4')}
                    className={tipoImpressao === 'a4' ? 'bg-slate-700 hover:bg-slate-800' : ''}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    A4
                  </Button>
                </div>
              </div>

              {tipoImpressao === 'termica' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tamanho:</span>
                  <Select value={tamanhoTermica} onValueChange={(v) => setTamanhoTermica(v as '58mm' | '80mm')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="80mm">80mm</SelectItem>
                      <SelectItem value="58mm">58mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex-1" />

              <Button onClick={imprimir} className="bg-slate-700 hover:bg-slate-800">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Área do Recibo - CENTRALIZADO */}
      <div className="flex justify-center items-start">
        {tipoImpressao === 'a4' ? (
          <ReciboA4 
            venda={venda} 
            loja={dadosLoja} 
            formatarMoeda={formatarMoeda}
            formatarFormaPagamento={formatarFormaPagamento}
          />
        ) : (
          <ReciboTermica 
            venda={venda} 
            loja={dadosLoja} 
            tamanhoTermica={tamanhoTermica}
            formatarMoeda={formatarMoeda}
            formatarFormaPagamento={formatarFormaPagamento}
          />
        )}
      </div>

      {/* Estilos de impressão */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: auto;
            max-width: 100%;
          }
          
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  )
}

// Componente de Recibo A4 - PROFISSIONAL SEM CORES
function ReciboA4({ 
  venda, 
  loja, 
  formatarMoeda, 
  formatarFormaPagamento 
}: { 
  venda: Venda
  loja: LojaInfo
  formatarMoeda: (v: number) => string
  formatarFormaPagamento: (f: string) => string
}) {
  const dataVenda = new Date(venda.dataVenda)
  const totalItens = venda.itens.reduce((acc, item) => acc + item.quantidade, 0)

  return (
    <div className="print-area bg-white" style={{ 
      fontFamily: 'Arial, Helvetica, sans-serif',
      width: '190mm',
      maxWidth: '190mm',
      padding: '10mm',
      boxSizing: 'border-box',
      margin: '0 auto',
      fontSize: '12px',
      lineHeight: '1.4'
    }}>
      {/* CABEÇALHO */}
      <div style={{ 
        textAlign: 'center',
        paddingBottom: '8px',
        borderBottom: '2px solid #000',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>
          {loja.nome.toUpperCase()}
        </div>
        {loja.endereco && (
          <div style={{ fontSize: '11px', marginTop: '3px' }}>{loja.endereco}</div>
        )}
        {loja.telefone && (
          <div style={{ fontSize: '11px' }}>Telefone: {loja.telefone}</div>
        )}
      </div>

      {/* TÍTULO DO CUPOM */}
      <div style={{ 
        textAlign: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #000',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          CUPOM NÃO FISCAL
        </div>
      </div>

      {/* INFORMAÇÕES DA VENDA */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <div>
          <strong>CUPOM:</strong> #{String(venda.numeroVenda).padStart(6, '0')}
        </div>
        <div>
          <strong>DATA:</strong> {dataVenda.toLocaleDateString('pt-BR')}
        </div>
        <div>
          <strong>HORA:</strong> {dataVenda.toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* CLIENTE */}
      {venda.clienteNome && (
        <div style={{ 
          padding: '6px 8px',
          border: '1px solid #ccc',
          marginBottom: '10px',
          fontSize: '11px'
        }}>
          <strong>CLIENTE:</strong> {venda.clienteNome}
        </div>
      )}

      {/* TABELA DE ITENS */}
      <table style={{ 
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>CÓDIGO</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>DESCRIÇÃO</th>
            <th style={{ textAlign: 'center', padding: '6px 4px', width: '50px' }}>QTD</th>
            <th style={{ textAlign: 'right', padding: '6px 4px', width: '70px' }}>UNITÁRIO</th>
            <th style={{ textAlign: 'right', padding: '6px 4px', width: '80px' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {venda.itens.map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: '1px dotted #ccc' }}>
              <td style={{ padding: '5px 4px', verticalAlign: 'top' }}>
                {String(idx + 1).padStart(3, '0')}
              </td>
              <td style={{ padding: '5px 4px', verticalAlign: 'top' }}>
                {item.descricao}
                {item.tipo === 'avulso' && (
                  <span style={{ fontSize: '9px', marginLeft: '4px' }}>(AVULSO)</span>
                )}
              </td>
              <td style={{ textAlign: 'center', padding: '5px 4px', verticalAlign: 'top' }}>
                {item.quantidade}
              </td>
              <td style={{ textAlign: 'right', padding: '5px 4px', verticalAlign: 'top' }}>
                {formatarMoeda(item.precoUnitario)}
              </td>
              <td style={{ textAlign: 'right', padding: '5px 4px', verticalAlign: 'top', fontWeight: 'bold' }}>
                {formatarMoeda(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* RESUMO */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '11px',
          padding: '3px 0'
        }}>
          <span>QUANTIDADE TOTAL DE ITENS:</span>
          <span>{totalItens}</span>
        </div>
      </div>

      {/* TOTAIS - ÁREA PRINCIPAL */}
      <div style={{ 
        border: '2px solid #000',
        padding: '10px',
        marginBottom: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '12px',
          marginBottom: '4px'
        }}>
          <span>SUBTOTAL:</span>
          <span>{formatarMoeda(venda.subtotal)}</span>
        </div>
        
        {venda.desconto > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '4px'
          }}>
            <span>DESCONTO:</span>
            <span>- {formatarMoeda(venda.desconto)}</span>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '16px',
          fontWeight: 'bold',
          paddingTop: '8px',
          marginTop: '4px',
          borderTop: '1px solid #000'
        }}>
          <span>TOTAL A PAGAR:</span>
          <span>{formatarMoeda(venda.total)}</span>
        </div>
      </div>

      {/* FORMA DE PAGAMENTO */}
      <div style={{ 
        border: '1px solid #ccc',
        padding: '8px',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span><strong>FORMA DE PAGAMENTO:</strong></span>
          <span>{formatarFormaPagamento(venda.formaPagamento)}</span>
        </div>
        {venda.valorPago && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>VALOR RECEBIDO:</span>
            <span>{formatarMoeda(venda.valorPago)}</span>
          </div>
        )}
        {venda.troco && venda.troco > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>TROCO:</span>
            <span>{formatarMoeda(venda.troco)}</span>
          </div>
        )}
      </div>

      {/* ASSINATURA */}
      <div style={{ 
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #ccc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            borderBottom: '1px solid #000',
            width: '250px',
            margin: '0 auto 5px auto'
          }}></div>
          <span style={{ fontSize: '10px' }}>ASSINATURA DO CLIENTE</span>
        </div>
      </div>

      {/* RODAPÉ */}
      <div style={{ 
        textAlign: 'center',
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #ccc',
        fontSize: '10px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
          OBRIGADO PELA PREFERÊNCIA!
        </div>
        <div>Este documento não possui valor fiscal</div>
        <div style={{ marginTop: '5px', color: '#666' }}>
          TecOS - Sistema de Gestão para Assistências Técnicas
        </div>
      </div>
    </div>
  )
}

// Componente de Recibo Térmica - PROFISSIONAL SEM CORES
function ReciboTermica({ 
  venda, 
  loja, 
  tamanhoTermica,
  formatarMoeda, 
  formatarFormaPagamento 
}: { 
  venda: Venda
  loja: LojaInfo
  tamanhoTermica: '58mm' | '80mm'
  formatarMoeda: (v: number) => string
  formatarFormaPagamento: (f: string) => string
}) {
  const largura = tamanhoTermica === '58mm' ? '58mm' : '80mm'
  const fontSize = tamanhoTermica === '58mm' ? '9px' : '11px'
  const dataVenda = new Date(venda.dataVenda)
  const totalItens = venda.itens.reduce((acc, item) => acc + item.quantidade, 0)

  return (
    <div 
      className="print-area bg-white" 
      style={{ 
        fontFamily: "'Courier New', Courier, monospace",
        fontSize,
        width: largura,
        maxWidth: largura,
        padding: '6px'
      }}
    >
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: tamanhoTermica === '58mm' ? '12px' : '14px', fontWeight: 'bold' }}>
          {loja.nome.toUpperCase()}
        </div>
        <div style={{ fontSize: tamanhoTermica === '58mm' ? '8px' : '10px' }}>
          CUPOM NAO FISCAL
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Informações da venda */}
      <div style={{ fontSize: tamanhoTermica === '58mm' ? '9px' : '10px' }}>
        <div>CUPOM: #{String(venda.numeroVenda).padStart(6, '0')}</div>
        <div>DATA: {dataVenda.toLocaleDateString('pt-BR')} {dataVenda.toLocaleTimeString('pt-BR')}</div>
        {venda.clienteNome && <div>CLIENTE: {venda.clienteNome}</div>}
        {loja.endereco && <div>END: {loja.endereco}</div>}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Cabeçalho Itens */}
      <div style={{ 
        fontSize: tamanhoTermica === '58mm' ? '8px' : '10px', 
        fontWeight: 'bold', 
        display: 'flex',
        borderBottom: '1px solid #000',
        paddingBottom: '3px',
        marginBottom: '3px'
      }}>
        <div style={{ width: '20px' }}>#</div>
        <div style={{ flex: 1 }}>DESCRICAO</div>
        <div style={{ width: '25px', textAlign: 'center' }}>QTD</div>
        <div style={{ width: tamanhoTermica === '58mm' ? '45px' : '55px', textAlign: 'right' }}>TOTAL</div>
      </div>

      {/* Itens */}
      {venda.itens.map((item, idx) => (
        <div key={item.id} style={{ 
          fontSize: tamanhoTermica === '58mm' ? '9px' : '10px', 
          display: 'flex', 
          padding: '2px 0'
        }}>
          <div style={{ width: '20px' }}>{idx + 1}</div>
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.descricao.substring(0, tamanhoTermica === '58mm' ? 14 : 20)}
          </div>
          <div style={{ width: '25px', textAlign: 'center' }}>{item.quantidade}</div>
          <div style={{ width: tamanhoTermica === '58mm' ? '45px' : '55px', textAlign: 'right' }}>
            {formatarMoeda(item.total)}
          </div>
        </div>
      ))}

      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Totais */}
      <div style={{ fontSize: tamanhoTermica === '58mm' ? '9px' : '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ITENS: {totalItens}</span>
          <span>SUBTOTAL: {formatarMoeda(venda.subtotal)}</span>
        </div>
        {venda.desconto > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span></span>
            <span>DESCONTO: -{formatarMoeda(venda.desconto)}</span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: tamanhoTermica === '58mm' ? '11px' : '13px', 
          fontWeight: 'bold',
          marginTop: '4px',
          paddingTop: '4px',
          borderTop: '1px solid #000'
        }}>
          <span>TOTAL:</span>
          <span>{formatarMoeda(venda.total)}</span>
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Pagamento */}
      <div style={{ fontSize: tamanhoTermica === '58mm' ? '9px' : '10px' }}>
        <div>FORMA: {formatarFormaPagamento(venda.formaPagamento)}</div>
        {venda.valorPago && <div>RECEBIDO: {formatarMoeda(venda.valorPago)}</div>}
        {venda.troco && venda.troco > 0 && (
          <div style={{ fontWeight: 'bold' }}>TROCO: {formatarMoeda(venda.troco)}</div>
        )}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Rodapé */}
      <div style={{ textAlign: 'center', fontSize: tamanhoTermica === '58mm' ? '8px' : '9px' }}>
        <div>OBRIGADO PELA PREFERENCIA!</div>
        <div>Este documento nao possui valor fiscal</div>
        <div style={{ marginTop: '3px' }}>TecOS - Sistema de Gestao</div>
      </div>
    </div>
  )
}
