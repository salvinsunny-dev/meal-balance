'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'block w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900',
          'placeholder:text-gray-400 transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400',
          error ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 hover:border-gray-300',
          props.disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
          className,
        )}
      />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
