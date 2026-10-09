import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  className?: string;
}

export function Alert({ type = 'error', title, message, className = '' }: AlertProps) {
  const configs = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      icon: <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />,
    },
  };

  const current = configs[type];

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${current.bg} ${className}`}>
      {current.icon}
      <div className="space-y-0.5">
        {title && <h5 className="text-sm font-semibold">{title}</h5>}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
