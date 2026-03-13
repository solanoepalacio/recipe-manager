'use client';

import React, { useState, forwardRef } from 'react';

export type InputVariant = 'bordered' | 'underline';
export type InputType = 'text' | 'password' | 'number' | 'email' | 'textarea';

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    'type'
  > {
  type?: InputType;
  variant?: InputVariant;
  label?: string;
  error?: string;
  helperText?: string;
}

const variantInputClasses: Record<InputVariant, string> = {
  bordered:
    'border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground',
  underline:
    'border-b border-border bg-transparent px-0 py-2 focus:outline-none focus:border-foreground rounded-none',
};

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(function Input(
  {
    type = 'text',
    variant = 'bordered',
    label,
    error,
    helperText,
    className = '',
    id,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const baseInputClasses = [
    'w-full text-foreground placeholder-placeholder text-sm transition-colors',
    variantInputClasses[variant],
    error ? 'border-destructive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const resolvedType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase text-secondary tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            id={inputId}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={baseInputClasses}
          />
        ) : (
          <input
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            id={inputId}
            ref={ref as React.Ref<HTMLInputElement>}
            type={resolvedType}
            className={[baseInputClasses, type === 'password' ? 'pr-10' : '']
              .filter(Boolean)
              .join(' ')}
          />
        )}

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}

      {helperText && !error && (
        <span className="text-xs text-secondary">{helperText}</span>
      )}
    </div>
  );
});
