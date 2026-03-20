import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { deleteImage, extrairNomeArquivo } from '@/lib/upload';

// GET - Buscar perfil do usuário logado
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Buscar baseado no tipo de usuário
    if (user.tipo === 'loja') {
      const loja = await db.loja.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          logo: true,
          slug: true,
          criadoEm: true,
        },
      });

      if (!loja) {
        return NextResponse.json({ erro: 'Loja não encontrada' }, { status: 404 });
      }

      return NextResponse.json({
        sucesso: true,
        usuario: {
          id: loja.id,
          nome: loja.nome,
          email: loja.email,
          foto: loja.logo,
          tipo: 'loja',
          lojaId: loja.id,
          criadoEm: loja.criadoEm,
          loja: {
            id: loja.id,
            nome: loja.nome,
            slug: loja.slug,
            logo: loja.logo,
          },
        },
      });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        tipo: true,
        lojaId: true,
        criadoEm: true,
        loja: {
          select: {
            id: true,
            nome: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ erro: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ sucesso: true, usuario });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// PATCH - Atualizar perfil do usuário
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { nome, foto } = data;

    // Se for tipo loja, atualizar na tabela loja
    if (user.tipo === 'loja') {
      // Buscar loja atual para verificar se tem foto antiga
      const lojaAtual = await db.loja.findUnique({
        where: { id: user.id },
        select: { logo: true },
      });

      if (!lojaAtual) {
        return NextResponse.json({ erro: 'Loja não encontrada' }, { status: 404 });
      }

      // Se está trocando a foto, deletar a antiga
      if (foto && lojaAtual.logo && lojaAtual.logo !== foto) {
        const nomeArquivoAntigo = extrairNomeArquivo(lojaAtual.logo);
        if (nomeArquivoAntigo) {
          await deleteImage(user.id, nomeArquivoAntigo, 'logo');
        }
      }

      // Atualizar loja
      const loja = await db.loja.update({
        where: { id: user.id },
        data: {
          nome: nome || undefined,
          logo: foto === null ? null : foto || undefined,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          logo: true,
        },
      });

      return NextResponse.json({
        sucesso: true,
        usuario: {
          id: loja.id,
          nome: loja.nome,
          email: loja.email,
          foto: loja.logo,
        },
      });
    }

    // Buscar usuário atual para verificar se tem foto antiga
    const usuarioAtual = await db.usuario.findUnique({
      where: { id: user.id },
      select: { foto: true, lojaId: true },
    });

    if (!usuarioAtual) {
      return NextResponse.json({ erro: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se está trocando a foto, deletar a antiga
    if (foto && usuarioAtual.foto && usuarioAtual.foto !== foto) {
      const nomeArquivoAntigo = extrairNomeArquivo(usuarioAtual.foto);
      if (nomeArquivoAntigo) {
        await deleteImage(usuarioAtual.lojaId, nomeArquivoAntigo, 'usuario');
      }
    }

    // Atualizar usuário
    const usuario = await db.usuario.update({
      where: { id: user.id },
      data: {
        nome: nome || undefined,
        foto: foto === null ? null : foto || undefined,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        tipo: true,
      },
    });

    return NextResponse.json({ sucesso: true, usuario });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
