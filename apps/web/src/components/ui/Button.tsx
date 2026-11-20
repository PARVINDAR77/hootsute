import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#070A18] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-gradient-to-r from-[#7138F5] to-[#2878FF] hover:from-[#642CE8] hover:to-[#1F6BF2] text-white shadow-glow-purple focus:ring-[#7138F5]',
      glow:
        'bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] hover:brightness-105 text-white shadow-glow-blue focus:ring-[#2878FF]',
      secondary:
        'bg-[#111827] hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15 text-white border border-transparent dark:border-white/10 shadow-sm focus:ring-slate-600',
      outline:
        'border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B]/80 hover:bg-[#F7F8FC] dark:hover:bg-white/10 text-[#111827] dark:text-slate-100 focus:ring-[#7138F5] shadow-xs',
      ghost:
        'text-[#64748B] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-[#F1EBFF]/70 dark:hover:bg-white/10 focus:ring-[#7138F5]',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 focus:ring-rose-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-sm sm:text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
