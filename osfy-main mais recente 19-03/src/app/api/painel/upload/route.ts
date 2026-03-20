import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { extrairNomeArquivo, TipoUpload } from '@/lib/upload';

// Configurações do servidor de upload
const UPLOAD_SERVER_URL = process.env.UPLOAD_SERVER_URL || 'https://sorteiomax.com.br/tecos-uploads/upload.php';
const UPLOAD_DELETE_URL = process.env.UPLOAD_DELETE_URL || 'https://sorteiomax.com.br/tecos-uploads/delete.php';
const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY || 'a8f7d9e2b4c1m6n3p5q0r9s2t8u1v4w7';

// POST - Upload de imagem
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('arquivo') as File;
    const tipo = formData.get('tipo') as TipoUpload;
    const lojaId = formData.get('lojaId') as string;

    if (!file || !tipo || !lojaId) {
      return NextResponse.json(
        { erro: 'Arquivo, tipo e lojaId são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo
    const tiposPermitidos: TipoUpload[] = ['logo', 'produto', 'os', 'banner', 'usuario'];
    if (!tiposPermitidos.includes(tipo)) {
      return NextResponse.json({ erro: 'Tipo inválido' }, { status: 400 });
    }

    // Validar arquivo
    const tiposMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposMime.includes(file.type)) {
      return NextResponse.json(
        { erro: 'Tipo de arquivo não permitido' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { erro: 'Arquivo muito grande. Máximo: 10MB' },
        { status: 400 }
      );
    }

    // Verificar permissão do usuário na loja
    if (user.lojaId !== lojaId && user.tipo !== 'superadmin') {
      const usuario = await db.usuario.findUnique({
        where: { id: user.id },
        select: { tipo: true },
      });

      if (usuario?.tipo !== 'admin') {
        return NextResponse.json({ erro: 'Sem permissão para esta loja' }, { status: 403 });
      }
    }

    // Preparar FormData para enviar ao servidor externo
    const uploadFormData = new FormData();
    uploadFormData.append('arquivo', file);
    uploadFormData.append('lojaId', lojaId);
    uploadFormData.append('tipo', tipo);

    // Enviar para o servidor de imagens
    const uploadResponse = await fetch(UPLOAD_SERVER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPLOAD_API_KEY}`,
      },
      body: uploadFormData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult.sucesso) {
      console.error('Erro no servidor de upload:', uploadResult);
      return NextResponse.json(
        { erro: uploadResult.erro || 'Erro ao fazer upload no servidor' },
        { status: 500 }
      );
    }

    const imageUrl = uploadResult.url;

    // Se for logo, atualizar no banco
    if (tipo === 'logo' && imageUrl) {
      await db.loja.update({
        where: { id: lojaId },
        data: { logo: imageUrl },
      });
    }

    return NextResponse.json({
      sucesso: true,
      url: imageUrl,
      arquivo: uploadResult.arquivo,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar imagem
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const { lojaId, arquivo, tipo } = await request.json();

    if (!lojaId || !arquivo) {
      return NextResponse.json(
        { erro: 'lojaId e arquivo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar permissão
    if (user.lojaId !== lojaId && user.tipo !== 'superadmin') {
      const usuario = await db.usuario.findUnique({
        where: { id: user.id },
        select: { tipo: true },
      });

      if (usuario?.tipo !== 'admin') {
        return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
      }
    }

    // Deletar do servidor externo
    const deleteResponse = await fetch(UPLOAD_DELETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UPLOAD_API_KEY}`,
      },
      body: JSON.stringify({
        lojaId,
        arquivo,
        tipo,
      }),
    });

    const deleteResult = await deleteResponse.json();

    if (!deleteResponse.ok) {
      console.error('Erro ao deletar no servidor:', deleteResult);
      return NextResponse.json({ erro: deleteResult.erro || 'Erro ao deletar' }, { status: 500 });
    }

    // Se for logo, remover do banco
    if (tipo === 'logo') {
      await db.loja.update({
        where: { id: lojaId },
        data: { logo: null },
      });
    }

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao deletar:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}
