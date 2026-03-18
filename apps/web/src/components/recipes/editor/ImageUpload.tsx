'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import type { ImageResponse } from '@recipe-manager/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ImageUploadProps {
  recipeId: string;
  images: ImageResponse[];
  onMutationSuccess: () => void;
}

export function ImageUpload({ recipeId, images, onMutationSuccess }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/recipes/${recipeId}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Do NOT set Content-Type — browser sets it with boundary
      });
      if (!res.ok) throw new Error('Upload failed');
      onMutationSuccess();
      toast.success('Foto subida');
    } catch {
      toast.error('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      api.delete(`/recipes/${recipeId}/images/${imageId}`),
    onSuccess: () => {
      onMutationSuccess();
      toast.success('Foto eliminada');
      setConfirmDeleteId(null);
    },
    onError: () => toast.error('Error al eliminar la foto.'),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function triggerFileInput() {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }

  const hasImages = images.length > 0;

  return (
    <div className="py-4">
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {!hasImages && (
        /* Empty state: dashed upload zone */
        <div
          className="border-2 border-dashed border-border rounded-[12px] mx-5 py-12 flex flex-col items-center gap-3 cursor-pointer"
          onClick={triggerFileInput}
        >
          {isUploading ? (
            <span className="text-[15px] text-secondary">Subiendo...</span>
          ) : (
            <>
              <ImageIcon size={32} className="text-placeholder" />
              <span className="text-[15px] text-secondary">Anadir foto</span>
            </>
          )}
        </div>
      )}

      {hasImages && (
        <div>
          {/* Image grid */}
          <div className="mx-5 grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image.id}>
                <div className="aspect-square rounded-[10px] overflow-hidden relative">
                  <img
                    src={image.url}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                  <button
                    className="absolute bottom-2 left-2 text-[13px] text-destructive bg-background/80 px-2 py-1 rounded"
                    onClick={() => setConfirmDeleteId(image.id)}
                  >
                    Eliminar foto
                  </button>
                </div>
                {confirmDeleteId === image.id && (
                  <ConfirmDialog
                    message="¿Eliminar esta foto?"
                    onConfirm={() => deleteMutation.mutate(image.id)}
                    onCancel={() => setConfirmDeleteId(null)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Add more button */}
          <div
            className="border-2 border-dashed border-border rounded-[12px] mx-5 mt-3 py-6 flex flex-col items-center gap-2 cursor-pointer"
            onClick={triggerFileInput}
          >
            {isUploading ? (
              <span className="text-[15px] text-secondary">Subiendo...</span>
            ) : (
              <>
                <ImageIcon size={24} className="text-placeholder" />
                <span className="text-[15px] text-secondary">Anadir foto</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
