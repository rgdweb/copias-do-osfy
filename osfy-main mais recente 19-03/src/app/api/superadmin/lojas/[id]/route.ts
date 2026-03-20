import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { db } from '@/lib/db'

// Configurações do servidor de upload
const UPLOAD_DELETE_URL = process.env.UPLOAD_DELETE_URL || 'https://sorteiomax.com.br/tecos-uploads/delete.php'
const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY || 'a8f7d9e2b4c1m6n3p5q0r9s2t8u1v4w7'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const loja = await db.loja.findUnique({
      where: { id },
      include: {
        faturas: {
          orderBy: { dataVencimento: 'desc' },
          take: 20
        }
      }
    })

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      loja
    })
  } catch (error) {
    console.error('Erro ao buscar loja:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar loja' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir loja e todas as suas imagens do servidor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.tipo !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Buscar loja com todos os dados de imagens
    const loja = await db.loja.findUnique({
      where: { id },
      include: {
        usuarios: { select: { foto: true } },
        produtos: { select: { imagem: true } },
        ordens: {
          select: {
            fotos: { select: { arquivo: true } },
            assinatura: { select: { imagem: true } }
          }
        }
      }
    })

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Coletar todas as URLs de imagens para excluir
    const imagensParaExcluir: string[] = []

    // Logo da loja
    if (loja.logo) {
      imagensParaExcluir.push(loja.logo)
    }

    // Fotos dos usuários
    for (const usuario of loja.usuarios) {
      if (usuario.foto) {
        imagensParaExcluir.push(usuario.foto)
      }
    }

    // Imagens dos produtos
    for (const produto of loja.produtos) {
      if (produto.imagem) {
        imagensParaExcluir.push(produto.imagem)
      }
    }

    // Fotos e assinaturas das OS
    for (const ordem of loja.ordens) {
      for (const foto of ordem.fotos) {
        if (foto.arquivo) {
          imagensParaExcluir.push(foto.arquivo)
        }
      }
      if (ordem.assinatura?.imagem) {
        imagensParaExcluir.push(ordem.assinatura.imagem)
      }
    }

    // Excluir imagens do servidor externo
    if (imagensParaExcluir.length > 0) {
      try {
        // Extrair nomes dos arquivos das URLs
        const arquivos = imagensParaExcluir
          .map(url => {
            try {
              const urlObj = new URL(url)
              const partes = urlObj.pathname.split('/')
              return partes[partes.length - 1]
            } catch {
              return null
            }
          })
          .filter((arquivo): arquivo is string => arquivo !== null)

        // Enviar requisição para deletar todas as imagens da loja
        const deleteResponse = await fetch(UPLOAD_DELETE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UPLOAD_API_KEY}`,
          },
          body: JSON.stringify({
            lojaId: id,
            excluirTudo: true, // Flag para excluir todas as imagens da loja
            arquivos,
          }),
        })

        if (!deleteResponse.ok) {
          console.error('Erro ao excluir imagens do servidor:', await deleteResponse.text())
        }
      } catch (error) {
        console.error('Erro ao comunicar com servidor de imagens:', error)
        // Continua mesmo se falhar a exclusão de imagens
      }
    }

    // Excluir a loja (cascade vai excluir tudo no banco)
    await db.loja.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `Loja excluída com sucesso. ${imagensParaExcluir.length} imagens removidas do servidor.`
    })
  } catch (error) {
    console.error('Erro ao excluir loja:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir loja' },
      { status: 500 }
    )
  }
}
