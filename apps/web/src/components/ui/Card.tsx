import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'glow' | 'subtle';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const variants = {
    default:
      'bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none',
    glass: 'glass-card',
    glow:
      'bg-white dark:bg-[#0F142B]/95 glow-border',
    subtle:
      'bg-[#F7F8FC] dark:bg-[#0B1024] border border-[#E7EAF2] dark:border-[#1E2749]',
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-5 sm:p-6 border-b border-[#E7EAF2]/80 dark:border-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`text-base sm:text-lg font-bold tracking-tight text-[#111827] dark:text-white ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm text-[#64748B] dark:text-slate-400 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-5 sm:px-6 py-4 bg-[#F7F8FC]/80 dark:bg-white/[0.03] border-t border-[#E7EAF2]/80 dark:border-white/10 flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
}
