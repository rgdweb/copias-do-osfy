'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validarImagem } from '@/lib/upload';

interface UploadMultiplasImagensProps {
  imagensAtuais: string[];
  onUpload: (urls: string[]) => void;
  onRemover: (index: number) => void;
  tipo: 'os' | 'banner';
  lojaId: string;
  label?: string;
  maximo?: number;
}

export function UploadMultiplasImagens({
  imagensAtuais,
  onUpload,
  onRemover,
  tipo,
  lojaId,
  label = 'Imagens',
  maximo = 5,
}: UploadMultiplasImagensProps) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelecionar = () => {
    inputRef.current?.click();
  };

  const handleArquivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Verificar limite
    if (imagensAtuais.length + filesArray.length > maximo) {
      setErro(`Máximo de ${maximo} imagens permitidas`);
      return;
    }

    // Validar todos os arquivos
    for (const file of filesArray) {
      const validacao = validarImagem(file);
      if (!validacao.valido) {
        setErro(validacao.erro || 'Arquivo inválido');
        return;
      }
    }

    setErro(null);
    setCarregando(true);

    try {
      const novasUrls: string[] = [];

      for (const file of filesArray) {
        const formData = new FormData();
        formData.append('arquivo', file);
        formData.append('tipo', tipo);
        formData.append('lojaId', lojaId);

        const response = await fetch('/api/painel/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.erro || 'Erro no upload');
        }

        novasUrls.push(data.url);
      }

      onUpload([...imagensAtuais, ...novasUrls]);
    } catch (err) {
      console.error('Erro no upload:', err);
      setErro(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setCarregando(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const podeAdicionar = imagensAtuais.length < maximo;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          <span className="text-gray-400 text-xs ml-2">
            ({imagensAtuais.length}/{maximo})
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Imagens atuais */}
        {imagensAtuais.map((url, index) => (
          <div
            key={index}
            className="relative w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 group"
          >
            <img
              src={url}
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemover(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 
                         opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Botão adicionar */}
        {podeAdicionar && (
          <button
            type="button"
            onClick={handleSelecionar}
            disabled={carregando}
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg 
                       flex flex-col items-center justify-center gap-1
                       hover:border-emerald-500 hover:bg-emerald-50 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500">Adicionar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleArquivos}
        className="hidden"
      />

      {erro && (
        <p className="text-sm text-red-500">{erro}</p>
      )}

      <p className="text-xs text-gray-500">
        JPG, PNG, GIF ou WEBP. Máx. 10MB por imagem.
      </p>
    </div>
  );
}
