import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { uploadImage, deleteImage, extrairNomeArquivo } from '@/lib/upload';

// GET - Listar fotos da OS
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const os = await db.ordemServico.findFirst({
      where: { id },
      select: { lojaId: true },
    });

    if (!os) {
      return NextResponse.json({ erro: 'OS não encontrada' }, { status: 404 });
    }

    // Verificar permissão
    if (user.lojaId !== os.lojaId) {
      const usuario = await db.usuario.findUnique({
        where: { id: user.id },
        select: { tipo: true },
      });
      if (usuario?.tipo !== 'admin') {
        return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
      }
    }

    const fotos = await db.fotoOS.findMany({
      where: { osId: id },
      orderBy: { criadoEm: 'desc' },
    });

    return NextResponse.json({ sucesso: true, fotos });
  } catch (error) {
    console.error('Erro ao listar fotos:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// POST - Adicionar foto na OS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    // Verificar content-type para decidir como processar
    const contentType = request.headers.get('content-type') || '';
    let arquivo: string;
    let descricao: string | null = null;
    let tipo = 'recebimento';

    if (contentType.includes('multipart/form-data')) {
      // Upload direto de arquivo
      const formData = await request.formData();
      const file = formData.get('arquivo') as File;
      descricao = formData.get('descricao') as string;
      tipo = (formData.get('tipo') as string) || 'recebimento';

      if (!file) {
        return NextResponse.json({ erro: 'Arquivo é obrigatório' }, { status: 400 });
      }

      // Buscar OS para ter o lojaId
      const osCheck = await db.ordemServico.findFirst({
        where: { id },
        select: { lojaId: true },
      });

      if (!osCheck) {
        return NextResponse.json({ erro: 'OS não encontrada' }, { status: 404 });
      }

      // Fazer upload
      const resultado = await uploadImage(file, osCheck.lojaId, 'os', file.name);
      if (!resultado.sucesso) {
        return NextResponse.json({ erro: resultado.erro }, { status: 500 });
      }
      arquivo = resultado.url!;
    } else {
      // JSON com URL já existente
      const body = await request.json();
      arquivo = body.arquivo;
      descricao = body.descricao || null;
      tipo = body.tipo || 'recebimento';

      if (!arquivo) {
        return NextResponse.json({ erro: 'URL do arquivo é obrigatória' }, { status: 400 });
      }
    }

    // Buscar OS
    const os = await db.ordemServico.findFirst({
      where: { id },
      select: { lojaId: true },
    });

    if (!os) {
      return NextResponse.json({ erro: 'OS não encontrada' }, { status: 404 });
    }

    // Verificar permissão
    if (user.lojaId !== os.lojaId) {
      const usuario = await db.usuario.findUnique({
        where: { id: user.id },
        select: { tipo: true },
      });
      if (usuario?.tipo !== 'admin') {
        return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
      }
    }

    // Salvar no banco
    const foto = await db.fotoOS.create({
      data: {
        osId: id,
        arquivo,
        descricao,
        tipo,
      },
    });

    return NextResponse.json({
      sucesso: true,
      foto,
    });
  } catch (error) {
    console.error('Erro ao adicionar foto:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover foto da OS
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { fotoId } = await request.json();

    if (!fotoId) {
      return NextResponse.json({ erro: 'fotoId é obrigatório' }, { status: 400 });
    }

    // Buscar foto
    const foto = await db.fotoOS.findUnique({
      where: { id: fotoId },
      include: { ordem: { select: { lojaId: true } } },
    });

    if (!foto) {
      return NextResponse.json({ erro: 'Foto não encontrada' }, { status: 404 });
    }

    // Verificar se a foto pertence à OS
    if (foto.osId !== id) {
      return NextResponse.json({ erro: 'Foto não pertence a esta OS' }, { status: 400 });
    }

    // Verificar permissão
    if (user.lojaId !== foto.ordem.lojaId) {
      const usuario = await db.usuario.findUnique({
        where: { id: user.id },
        select: { tipo: true },
      });
      if (usuario?.tipo !== 'admin') {
        return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
      }
    }

    // Deletar arquivo do servidor
    const nomeArquivo = extrairNomeArquivo(foto.arquivo);
    if (nomeArquivo) {
      await deleteImage(foto.ordem.lojaId, nomeArquivo, 'os');
    }

    // Deletar do banco
    await db.fotoOS.delete({ where: { id: fotoId } });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
