import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const downloadDir = path.join(process.cwd(), 'public', 'download')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = path.join(downloadDir, ...pathSegments)

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    // Verificar se está dentro do diretório permitido (segurança)
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(downloadDir)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath)

    // Determinar o tipo de conteúdo
    const ext = path.extname(filePath).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.sh': 'text/x-shellscript',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
    }

    const contentType = contentTypes[ext] || 'application/octet-stream'

    // Retornar o arquivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
