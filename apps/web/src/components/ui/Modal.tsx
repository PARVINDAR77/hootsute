'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'omni-modal-title' : undefined}
    >
      <div
        className="fixed inset-0 bg-[#070A18]/55 dark:bg-[#070A18]/75 backdrop-blur-sm animate-fadeIn"
        onClick={() => closeOnBackdrop && onClose()}
      />
      <div
        className={`relative z-10 w-full ${SIZE_CLASSES[size]} bg-white dark:bg-[#0F142B] border border-[#E7EAF2] dark:border-[#7138F5]/30 rounded-2xl shadow-elevated dark:shadow-glow-card overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]`}
      >
        {(title || description) && (
          <div className="px-6 py-4 border-b border-[#E7EAF2] dark:border-white/10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title && (
                <h2
                  id="omni-modal-title"
                  className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 bg-[#F7F8FC] dark:bg-white/[0.03] border-t border-[#E7EAF2] dark:border-white/10 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
