import React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  className?: string;
}

const styles: Record<AlertVariant, { wrapper: string; icon: string }> = {
  error:   { wrapper: 'bg-red-50 text-red-800 border-red-200',     icon: '✕' },
  success: { wrapper: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: '✓' },
  warning: { wrapper: 'bg-amber-50 text-amber-800 border-amber-200', icon: '!' },
  info:    { wrapper: 'bg-blue-50 text-blue-800 border-blue-200',   icon: 'i' },
};

export default function Alert({ variant = 'error', message, className }: AlertProps) {
  const { wrapper, icon } = styles[variant];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm animate-fade-in',
        wrapper,
        className,
      )}
    >
      <span className="shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold mt-0.5">
        {icon}
      </span>
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
