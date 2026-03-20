// Tipos do sistema TecOS

export interface Loja {
  id: string
  nome: string
  slug: string
  responsavel: string
  telefone: string
  whatsapp: string
  email: string
  cidade: string
  estado: string
  endereco: string
  descricao?: string | null
  logo?: string | null
  horarioAtendimento?: string | null
  tiposServico?: string | null
  status: 'pendente' | 'ativa' | 'bloqueada'
  criadoEm: Date
  atualizadoEm: Date
  expiraEm?: Date | null
}

export interface Usuario {
  id: string
  lojaId: string
  nome: string
  email: string
  tipo: 'admin' | 'tecnico'
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface Cliente {
  id: string
  lojaId: string
  nome: string
  telefone: string
  email?: string | null
  criadoEm: Date
  atualizadoEm: Date
}

export type StatusOS = 
  | 'recebido'
  | 'em_analise'
  | 'aguardando_aprovacao'
  | 'aguardando_peca'
  | 'em_manutencao'
  | 'em_testes'
  | 'pronto'
  | 'entregue'

export interface OrdemServico {
  id: string
  lojaId: string
  clienteId: string
  tecnicoId?: string | null
  numeroOs: number
  equipamento: string
  marca?: string | null
  modelo?: string | null
  imeiSerial?: string | null
  senhaAparelho?: string | null
  problema: string
  acessorios?: string | null
  estadoAparelho?: string | null
  diagnostico?: string | null
  solucao?: string | null
  status: StatusOS
  orcamento?: number | null
  aprovado?: boolean | null
  dataAprovacao?: Date | null
  valorServico?: number | null
  valorPecas?: number | null
  valorTotal?: number | null
  pago: boolean
  formaPagamento?: string | null
  dataPagamento?: Date | null
  dataCriacao: Date
  dataPrevisao?: Date | null
  dataFinalizacao?: Date | null
  atualizadoEm: Date
  
  cliente?: Cliente
  tecnico?: Usuario | null
  historico?: HistoricoOS[]
  fotos?: FotoOS[]
  assinatura?: Assinatura | null
}

export interface HistoricoOS {
  id: string
  osId: string
  descricao: string
  status?: string | null
  criadoEm: Date
}

export interface FotoOS {
  id: string
  osId: string
  arquivo: string
  descricao?: string | null
  tipo: 'recebimento' | 'defeito' | 'reparo' | 'final'
  criadoEm: Date
}

export interface Assinatura {
  id: string
  osId: string
  imagem: string
  nome?: string | null
  criadoEm: Date
}

// Labels dos status
export const STATUS_LABELS: Record<StatusOS, string> = {
  recebido: 'Recebido',
  em_analise: 'Em análise',
  aguardando_aprovacao: 'Aguardando aprovação',
  aguardando_peca: 'Aguardando peça',
  em_manutencao: 'Em manutenção',
  em_testes: 'Em testes',
  pronto: 'Pronto',
  entregue: 'Entregue',
}

// Cores dos status
export const STATUS_COLORS: Record<StatusOS, string> = {
  recebido: 'bg-blue-500',
  em_analise: 'bg-yellow-500',
  aguardando_aprovacao: 'bg-orange-500',
  aguardando_peca: 'bg-purple-500',
  em_manutencao: 'bg-amber-500',
  em_testes: 'bg-cyan-500',
  pronto: 'bg-green-500',
  entregue: 'bg-gray-500',
}

// Tipos de serviço
export const TIPOS_SERVICO = [
  { id: 'celulares', label: 'Celulares' },
  { id: 'computadores', label: 'Computadores' },
  { id: 'notebooks', label: 'Notebooks' },
  { id: 'tvs', label: 'TVs' },
  { id: 'videogames', label: 'Videogames' },
  { id: 'eletronicos', label: 'Eletrônicos' },
  { id: 'outros', label: 'Outros' },
]

// Estados do Brasil
export const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]
