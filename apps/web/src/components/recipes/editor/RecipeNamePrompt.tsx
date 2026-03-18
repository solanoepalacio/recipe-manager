'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { api } from '@/lib/api-client';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

interface RecipeNamePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (recipe: RecipeDetailResponse) => void;
}

export function RecipeNamePrompt({ isOpen, onClose, onCreated }: RecipeNamePromptProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate() {
    if (name.trim() === '' || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const recipe = await api.post<RecipeDetailResponse>('/recipes', { name: name.trim() });
      onCreated(recipe);
      onClose();
      setName('');
    } catch {
      toast.error('Error al crear la receta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="¿Cómo se llama la receta?">
      <div className="px-5 pb-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la receta"
          autoFocus={isOpen}
          className="border-b border-border text-[15px] text-foreground w-full pb-2 outline-none bg-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
        />
      </div>

      <div className="flex justify-between items-center px-5 pb-6 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="text-[15px] text-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={name.trim() === '' || isSubmitting}
          className={`bg-accent text-background rounded-full px-5 py-2 text-[15px] font-semibold ${
            name.trim() === '' || isSubmitting ? 'opacity-50' : ''
          }`}
        >
          Crear
        </button>
      </div>
    </BottomSheet>
  );
}
