'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validarImagem } from '@/lib/upload';

interface UploadImagemProps {
  valorAtual?: string | null;
  onUpload: (url: string) => void;
  onRemover?: () => void;
  tipo: 'logo' | 'produto' | 'os' | 'banner' | 'usuario';
  lojaId: string;
  label?: string;
  className?: string;
  tamanhoPreview?: number;
}

export function UploadImagem({
  valorAtual,
  onUpload,
  onRemover,
  tipo,
  lojaId,
  label = 'Imagem',
  className = '',
  tamanhoPreview = 120,
}: UploadImagemProps) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(valorAtual || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelecionar = () => {
    inputRef.current?.click();
  };

  const handleArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    const validacao = validarImagem(file);
    if (!validacao.valido) {
      setErro(validacao.erro || 'Arquivo inválido');
      return;
    }

    setErro(null);
    setCarregando(true);

    try {
      // Criar preview local
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Fazer upload
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

      // Limpar preview local e usar URL do servidor
      URL.revokeObjectURL(previewUrl);
      setPreview(data.url);
      onUpload(data.url);
    } catch (err) {
      console.error('Erro no upload:', err);
      setErro(err instanceof Error ? err.message : 'Erro ao fazer upload');
      setPreview(valorAtual || null);
    } finally {
      setCarregando(false);
      // Limpar input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemover = async () => {
    if (!preview) return;

    setCarregando(true);
    try {
      // Extrair nome do arquivo da URL
      const urlObj = new URL(preview);
      const partes = urlObj.pathname.split('/');
      const arquivo = partes[partes.length - 1];

      const response = await fetch('/api/painel/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lojaId, arquivo, tipo }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreview(null);
        onRemover?.();
      } else {
        throw new Error(data.erro || 'Erro ao remover');
      }
    } catch (err) {
      console.error('Erro ao remover:', err);
      setErro('Erro ao remover imagem');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center"
          style={{ width: tamanhoPreview, height: tamanhoPreview }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-12 h-12 text-gray-400" />
          )}

          {/* Loading overlay */}
          {carregando && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}

          {/* Botão remover */}
          {preview && !carregando && onRemover && (
            <button
              type="button"
              onClick={handleRemover}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleArquivo}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handleSelecionar}
            disabled={carregando}
          >
            <Upload className="w-4 h-4 mr-2" />
            {preview ? 'Trocar imagem' : 'Selecionar imagem'}
          </Button>

          <p className="text-xs text-gray-500">
            JPG, PNG, GIF ou WEBP. Máx. 10MB.
          </p>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <p className="text-sm text-red-500">{erro}</p>
      )}
    </div>
  );
}
