import { db } from './db'

// URLs base do Asaas
const ASAAS_URLS = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  producao: 'https://api.asaas.com/api/v3'
}

// Interface para resposta do Customer
interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  dateCreated: string
}

// Interface para resposta da Cobrança
interface AsaasPayment {
  id: string
  customer: string
  value: number
  netValue: number
  description: string
  billingType: string
  status: string
  dueDate: string
  originalDueDate: string
  paymentDate?: string
  invoiceUrl: string
  invoiceNumber: string
  externalReference?: string
  bankSlipUrl?: string
  pixQrCode?: string
  encodedImage?: string
  payload?: string
  dateCreated: string
}

// Interface para configurações de pagamento
interface ConfigPagamento {
  asaasApiKey: string | null
  asaasAmbiente: string
}

// Buscar configurações de pagamento
async function getConfiguracao(): Promise<ConfigPagamento | null> {
  const config = await db.configuracaoPagamento.findFirst()
  if (!config) return null
  
  return {
    asaasApiKey: config.asaasApiKey,
    asaasAmbiente: config.asaasAmbiente || 'sandbox'
  }
}

// Obter URL base conforme ambiente
function getBaseUrl(ambiente: string): string {
  return ASAAS_URLS[ambiente as keyof typeof ASAAS_URLS] || ASAAS_URLS.sandbox
}

// Fazer requisição para a API do Asaas
async function asaasRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
  apiKey?: string,
  ambiente?: string
): Promise<{ data?: unknown; error?: string; status: number }> {
  try {
    const config = apiKey ? null : await getConfiguracao()
    const key = apiKey || config?.asaasApiKey
    const env = ambiente || config?.asaasAmbiente || 'sandbox'
    
    if (!key) {
      return { error: 'API Key do Asaas não configurada', status: 400 }
    }
    
    const baseUrl = getBaseUrl(env)
    const url = `${baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': key
    }
    
    const options: RequestInit = {
      method,
      headers
    }
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(url, options)
    const data = await response.json()
    
    if (!response.ok) {
      return { 
        error: data.errors?.[0]?.description || data.message || 'Erro na API Asaas',
        status: response.status
      }
    }
    
    return { data, status: response.status }
  } catch (error) {
    console.error('[Asaas] Erro na requisição:', error)
    return { error: 'Erro de conexão com Asaas', status: 500 }
  }
}

// ==================== FUNÇÕES PÚBLICAS ====================

/**
 * Criar um cliente (Customer) no Asaas
 */
export async function criarCustomer(
  nome: string,
  email: string,
  cpfCnpj: string,
  telefone?: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  // Limpar CPF/CNPJ
  const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, '')
  
  // Limpar telefone
  const telefoneLimpo = telefone?.replace(/\D/g, '')
  
  const body: Record<string, unknown> = {
    name: nome,
    email: email,
    cpfCnpj: cpfCnpjLimpo,
    notificationDisabled: false
  }
  
  if (telefoneLimpo) {
    body.phone = telefoneLimpo
  }
  
  const result = await asaasRequest('/customers', 'POST', body)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  const customer = result.data as AsaasCustomer
  return { success: true, customerId: customer.id }
}

/**
 * Buscar ou criar cliente no Asaas
 */
export async function buscarOuCriarCustomer(
  nome: string,
  email: string,
  cpfCnpj: string,
  telefone?: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  // Primeiro, buscar cliente existente pelo CPF/CNPJ
  const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, '')
  
  const result = await asaasRequest(`/customers?cpfCnpj=${cpfCnpjLimpo}`)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  const responseData = result.data as { data?: AsaasCustomer[] }
  
  if (responseData.data && responseData.data.length > 0) {
    // Cliente já existe
    return { success: true, customerId: responseData.data[0].id }
  }
  
  // Criar novo cliente
  return criarCustomer(nome, email, cpfCnpj, telefone)
}

/**
 * Criar uma cobrança no Asaas
 */
export async function criarCobranca(
  customerId: string,
  valor: number,
  dataVencimento: string, // formato: YYYY-MM-DD
  descricao: string,
  formaPagamento: 'BOLETO' | 'PIX' | 'UNDEFINED' = 'UNDEFINED'
): Promise<{ 
  success: boolean
  cobrancaId?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCode?: string
  pixPayload?: string
  error?: string 
}> {
  const body = {
    customer: customerId,
    billingType: formaPagamento,
    value: valor,
    dueDate: dataVencimento,
    description: descricao,
    notificationDisabled: false,
    sendPaymentByEmail: false
  }
  
  const result = await asaasRequest('/payments', 'POST', body)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  const payment = result.data as AsaasPayment
  return {
    success: true,
    cobrancaId: payment.id,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    pixQrCode: payment.encodedImage,
    pixPayload: payment.payload
  }
}

/**
 * Buscar status de uma cobrança
 */
export async function buscarCobranca(
  cobrancaId: string
): Promise<{
  success: boolean
  status?: string
  paymentDate?: string
  value?: number
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCode?: string
  pixPayload?: string
  error?: string
}> {
  const result = await asaasRequest(`/payments/${cobrancaId}`)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  const payment = result.data as AsaasPayment
  return {
    success: true,
    status: payment.status,
    paymentDate: payment.paymentDate,
    value: payment.value,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    pixQrCode: payment.encodedImage,
    pixPayload: payment.payload
  }
}

/**
 * Gerar QR Code PIX para uma cobrança
 */
export async function gerarPix(
  cobrancaId: string
): Promise<{
  success: boolean
  qrCode?: string
  payload?: string
  error?: string
}> {
  const result = await asaasRequest(`/payments/${cobrancaId}/pixQrCode`)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  const data = result.data as { encodedImage?: string; payload?: string }
  return {
    success: true,
    qrCode: data.encodedImage,
    payload: data.payload
  }
}

/**
 * Gerar/link do boleto para uma cobrança
 */
export async function gerarBoleto(
  cobrancaId: string
): Promise<{
  success: boolean
  bankSlipUrl?: string
  invoiceUrl?: string
  error?: string
}> {
  const result = await asaasRequest(`/payments/${cobrancaId}/identificationField`)
  
  if (result.error) {
    // Se falhar, buscar diretamente da cobrança
    const cobranca = await buscarCobranca(cobrancaId)
    if (cobranca.success) {
      return {
        success: true,
        bankSlipUrl: cobranca.bankSlipUrl,
        invoiceUrl: cobranca.invoiceUrl
      }
    }
    return { success: false, error: result.error }
  }
  
  const data = result.data as { bankSlipUrl?: string; invoiceUrl?: string }
  return {
    success: true,
    bankSlipUrl: data.bankSlipUrl,
    invoiceUrl: data.invoiceUrl
  }
}

/**
 * Validar webhook do Asaas
 * O Asaas envia webhook com header X-Asaas-Signature
 */
export async function validarWebhook(
  payload: string,
  signature?: string
): Promise<{ valid: boolean }> {
  // Se não houver assinatura, verificar se o webhook está habilitado
  if (!signature) {
    // Em sandbox, o Asaas pode não enviar assinatura
    // Verificamos apenas se o payload é válido
    try {
      const data = JSON.parse(payload)
      return { valid: !!data.payment }
    } catch {
      return { valid: false }
    }
  }
  
  // Buscar o webhook secret configurado
  const config = await db.configuracaoPagamento.findFirst()
  
  if (!config?.webhookSecret) {
    // Sem secret configurado, aceitar payload válido
    try {
      const data = JSON.parse(payload)
      return { valid: !!data.payment }
    } catch {
      return { valid: false }
    }
  }
  
  // Validar assinatura HMAC
  // O Asaas usa HMAC-SHA256 com o webhook secret
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(config.webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )
    
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    
    return { valid: signature === expectedSignature }
  } catch (error) {
    console.error('[Asaas] Erro ao validar webhook:', error)
    return { valid: false }
  }
}

/**
 * Testar conexão com a API do Asaas
 */
export async function testarConexao(
  apiKey?: string,
  ambiente?: string
): Promise<{ success: boolean; error?: string }> {
  const result = await asaasRequest('/customers?limit=1', 'GET', undefined, apiKey, ambiente)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  return { success: true }
}

/**
 * Listar cobranças por cliente
 */
export async function listarCobrancasPorCliente(
  customerId: string
): Promise<{
  success: boolean
  cobrancas?: AsaasPayment[]
  error?: string
}> {
  const result = await asaasRequest(`/payments?customer=${customerId}`)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  const data = result.data as { data?: AsaasPayment[] }
  return {
    success: true,
    cobrancas: data.data || []
  }
}

/**
 * Cancelar uma cobrança
 */
export async function cancelarCobranca(
  cobrancaId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await asaasRequest(`/payments/${cobrancaId}`, 'DELETE')
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  return { success: true }
}

// Mapeamento de status do Asaas para status interno
export function mapearStatusAsaas(statusAsaas: string): string {
  const mapeamento: Record<string, string> = {
    'PENDING': 'pendente',
    'RECEIVED': 'paga',
    'CONFIRMED': 'paga',
    'OVERDUE': 'vencida',
    'CANCELED': 'cancelada',
    'REFUNDED': 'cancelada',
    'CHARGEBACK': 'cancelada'
  }
  
  return mapeamento[statusAsaas] || 'pendente'
}
