'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import type { RecipeDetailResponse, UpdateRecipeRequest } from '@recipe-manager/shared';

export interface MetadataFormRef {
  getValues(): UpdateRecipeRequest;
}

interface MetadataFormProps {
  recipe: RecipeDetailResponse;
  onSave: (data: UpdateRecipeRequest) => void;
  isSaving: boolean;
}

const labelClass = 'text-[13px] font-semibold uppercase text-secondary tracking-[0.5px] mb-1';
const inputClass = 'border-b border-border pb-2 text-[15px] text-foreground w-full outline-none bg-transparent';
const textareaClass =
  'border border-border rounded-[8px] px-3 py-2 text-[15px] text-foreground w-full outline-none bg-transparent min-h-[80px] resize-none focus:ring-2 focus:ring-accent';

export const MetadataForm = forwardRef<MetadataFormRef, MetadataFormProps>(
  function MetadataForm({ recipe }, ref) {
    const [name, setName] = useState(recipe.name);
    const [description, setDescription] = useState(recipe.description ?? '');
    const [servingsQty, setServingsQty] = useState(
      recipe.servingsQty != null ? String(recipe.servingsQty) : ''
    );
    const [servingsUnit, setServingsUnit] = useState(recipe.servingsUnit ?? '');
    const [prepTime, setPrepTime] = useState(
      recipe.prepTime != null ? String(recipe.prepTime) : ''
    );
    const [cookTime, setCookTime] = useState(
      recipe.cookTime != null ? String(recipe.cookTime) : ''
    );
    const [sourceUrl, setSourceUrl] = useState(recipe.sourceUrl ?? '');

    useImperativeHandle(ref, () => ({
      getValues(): UpdateRecipeRequest {
        return {
          name,
          description: description || null,
          servingsQty: servingsQty ? Number(servingsQty) : null,
          servingsUnit: servingsUnit || null,
          prepTime: prepTime ? Number(prepTime) : null,
          cookTime: cookTime ? Number(cookTime) : null,
          sourceUrl: sourceUrl || null,
        };
      },
    }));

    return (
      <div className="flex flex-col gap-4 px-5 pt-6">
        {/* NOMBRE */}
        <div>
          <label className={labelClass}>NOMBRE</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          {/* Slug preview — server-generated */}
          <p className="text-[13px] text-secondary italic mt-1">{recipe.slug}</p>
        </div>

        {/* DESCRIPCION */}
        <div>
          <label className={labelClass}>DESCRIPCION</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={textareaClass}
          />
        </div>

        {/* PORCIONES */}
        <div>
          <label className={labelClass}>PORCIONES</label>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={servingsQty}
              onChange={(e) => setServingsQty(e.target.value)}
              className={`${inputClass} w-20`}
              min={0}
            />
            <input
              type="text"
              value={servingsUnit}
              onChange={(e) => setServingsUnit(e.target.value)}
              placeholder="unidad"
              className={inputClass}
            />
          </div>
        </div>

        {/* PREPARACION */}
        <div>
          <label className={labelClass}>TIEMPO DE PREPARACION</label>
          <input
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            className={inputClass}
            min={0}
          />
        </div>

        {/* COCCION */}
        <div>
          <label className={labelClass}>TIEMPO DE COCCION</label>
          <input
            type="number"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            className={inputClass}
            min={0}
          />
        </div>

        {/* URL FUENTE */}
        <div>
          <label className={labelClass}>URL FUENTE</label>
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    );
  }
);
