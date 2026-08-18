import React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  className?: string;
}

const styles: Record<AlertVariant, string> = {
  error:   'bg-red-50 text-red-800 border-red-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info:    'bg-blue-50 text-blue-800 border-blue-200',
};

const icons: Record<AlertVariant, string> = {
  error:   '✕',
  success: '✓',
  warning: '⚠',
  info:    'ℹ',
};

export default function Alert({ variant = 'error', message, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
        styles[variant],
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 font-bold">{icons[variant]}</span>
      <span>{message}</span>
    </div>
  );
}
