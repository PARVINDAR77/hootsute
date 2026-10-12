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

  const current = configs[resolvedType as keyof typeof configs] || configs.error;

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${current.bg} ${className}`}>
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
          className="p-1 rounded-lg hover:bg-black/5 transition-colors text-inherit opacity-70 hover:opacity-100 shrink-0 self-start"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
