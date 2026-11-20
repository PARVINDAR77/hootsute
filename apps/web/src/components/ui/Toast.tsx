'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  notify: (toast: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: React.ReactNode }
> = {
  success: {
    container:
      'bg-white/95 dark:bg-[#111834]/95 border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-slate-100',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
  },
  error: {
    container:
      'bg-white/95 dark:bg-[#111834]/95 border-rose-200 dark:border-rose-500/30 text-slate-900 dark:text-slate-100',
    icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
  },
  warning: {
    container:
      'bg-white/95 dark:bg-[#111834]/95 border-amber-200 dark:border-amber-500/30 text-slate-900 dark:text-slate-100',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
  },
  info: {
    container:
      'bg-white/95 dark:bg-[#111834]/95 border-[#7138F5]/30 dark:border-[#7138F5]/40 text-slate-900 dark:text-slate-100',
    icon: <Info className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8] shrink-0 mt-0.5" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = item.duration ?? 4500;
      setToasts((prev) => [...prev.slice(-4), { ...item, id }]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      return id;
    },
    [],
  );

  const success = useCallback(
    (message: string, title?: string) => notify({ variant: 'success', message, title }),
    [notify],
  );
  const error = useCallback(
    (message: string, title?: string) => notify({ variant: 'error', message, title }),
    [notify],
  );
  const warning = useCallback(
    (message: string, title?: string) => notify({ variant: 'warning', message, title }),
    [notify],
  );
  const info = useCallback(
    (message: string, title?: string) => notify({ variant: 'info', message, title }),
    [notify],
  );

  return (
    <ToastContext.Provider value={{ toasts, notify, dismiss, success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-elevated animate-fadeIn ${style.container}`}
            >
              {style.icon}
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <p className="text-xs font-bold tracking-tight">{toast.title}</p>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toasts: [],
      notify: () => '',
      dismiss: () => {},
      success: () => '',
      error: () => '',
      warning: () => '',
      info: () => '',
    };
  }
  return ctx;
}
