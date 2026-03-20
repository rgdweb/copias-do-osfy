// Serviço de upload de imagens para o servidor TecOS

// Tipos de upload permitidos
export type TipoUpload = 'logo' | 'produto' | 'os' | 'banner' | 'usuario';

// Resposta do upload
export interface UploadResponse {
  sucesso: boolean;
  url?: string;
  arquivo?: string;
  tamanho?: number;
  tipo?: string;
  erro?: string;
}

/**
 * Faz upload de uma imagem para o servidor externo
 */
export async function uploadImage(
  file: File | Buffer,
  lojaId: string,
  tipo: TipoUpload,
  nomeOriginal?: string
): Promise<UploadResponse> {
  try {
    // Preparar FormData
    const formData = new FormData();
    formData.append('lojaId', lojaId);
    formData.append('tipo', tipo);

    if (file instanceof File) {
      formData.append('arquivo', file);
    } else {
      // Se for Buffer, criar um File
      const arquivo = new File([file], nomeOriginal || 'imagem.jpg', {
        type: 'image/jpeg',
      });
      formData.append('arquivo', arquivo);
    }

    // Fazer upload via API interna (que encaminha para o servidor externo)
    const response = await fetch('/api/painel/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro no upload:', data.erro);
      return { sucesso: false, erro: data.erro || 'Erro ao fazer upload' };
    }

    return {
      sucesso: true,
      url: data.url,
      arquivo: data.arquivo,
      tamanho: data.tamanho,
      tipo: data.tipo,
    };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return { sucesso: false, erro: 'Erro de conexão com o servidor' };
  }
}

/**
 * Deleta uma imagem do servidor
 */
export async function deleteImage(
  lojaId: string,
  arquivo: string,
  tipo?: TipoUpload
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const response = await fetch('/api/painel/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lojaId,
        arquivo,
        tipo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { sucesso: false, erro: data.erro || 'Erro ao deletar' };
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return { sucesso: false, erro: 'Erro de conexão com o servidor' };
  }
}

/**
 * Extrai nome do arquivo de uma URL
 */
export function extrairNomeArquivo(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const partes = urlObj.pathname.split('/');
    return partes[partes.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * Valida se arquivo é uma imagem válida
 */
export function validarImagem(file: File): { valido: boolean; erro?: string } {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const tamanhoMaximo = 10 * 1024 * 1024; // 10MB

  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, erro: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP.' };
  }

  if (file.size > tamanhoMaximo) {
    return { valido: false, erro: 'Arquivo muito grande. Máximo: 10MB.' };
  }

  return { valido: true };
}

/**
 * Redimensiona imagem antes do upload (opcional)
 */
export function redimensionarImagem(
  file: File,
  larguraMaxima: number = 1920,
  alturaMaxima: number = 1080
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let { width, height } = img;

      // Calcular novas dimensões mantendo proporção
      if (width > larguraMaxima || height > alturaMaxima) {
        const ratio = Math.min(larguraMaxima / width, alturaMaxima / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Criar canvas e redimensionar
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Retorna original se falhar
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Converter para File
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const novoArquivo = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(novoArquivo);
          } else {
            resolve(file);
          }
        },
        file.type,
        0.9 // Qualidade
      );
    };

    img.onerror = () => resolve(file);
    reader.onerror = () => resolve(file);

    reader.readAsDataURL(file);
  });
}
