import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  variant?: 'error' | 'danger' | 'success' | 'warning' | 'info';
  title?: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function Alert({
  type,
  variant,
  title,
  message,
  children,
  className = '',
  onClose,
}: AlertProps) {
  const resolvedType = (variant === 'danger' ? 'error' : variant) || type || 'error';
  const configs = {
    error: {
      bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-[#F1EBFF] dark:bg-[#7138F5]/15 border-[#7138F5]/25 dark:border-[#7138F5]/35 text-[#4C18C4] dark:text-[#D4BEFF]',
      icon: <Info className="w-5 h-5 text-[#7138F5] dark:text-[#20C8E8] shrink-0 mt-0.5" />,
    },
  };

  const current = configs[resolvedType as keyof typeof configs] || configs.error;

  return (
    <div className={`flex gap-3 p-4 rounded-2xl border ${current.bg} ${className}`}>
      {current.icon}
      <div className="space-y-0.5 min-w-0 flex-1">
        {title && <h5 className="text-sm font-semibold">{title}</h5>}
        {message && <p className="text-sm leading-relaxed">{message}</p>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-inherit opacity-70 hover:opacity-100 shrink-0 self-start"
          title="Dismiss"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
