import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.lojaId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const osId = formData.get('osId') as string
    const descricao = formData.get('descricao') as string
    const tipo = formData.get('tipo') as string

    if (!file || !osId) {
      return NextResponse.json(
        { success: false, error: 'Arquivo e ID da OS são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a OS pertence à loja
    const os = await db.ordemServico.findFirst({
      where: { id: osId, lojaId: user.lojaId }
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'os-photos')
    await mkdir(uploadDir, { recursive: true })

    // Gerar nome único para o arquivo
    const ext = file.name.split('.').pop()
    const fileName = `${osId}-${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, fileName)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // URL pública
    const publicUrl = `/uploads/os-photos/${fileName}`

    // Salvar no banco
    const foto = await db.fotoOS.create({
      data: {
        osId,
        arquivo: publicUrl,
        descricao: descricao || null,
        tipo: (tipo as 'recebimento' | 'defeito' | 'reparo' | 'final') || 'recebimento'
      }
    })

    return NextResponse.json({
      success: true,
      foto,
      message: 'Foto salva com sucesso'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload da foto' },
      { status: 500 }
    )
  }
}
