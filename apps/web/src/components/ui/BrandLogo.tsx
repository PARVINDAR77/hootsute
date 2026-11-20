import React from 'react';
import { Sparkles } from 'lucide-react';

export interface BrandLogoProps {
  collapsed?: boolean;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({
  collapsed = false,
  subtitle,
  size = 'md',
  className = '',
}: BrandLogoProps) {
  const boxSize = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
  };
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-[18px] h-[18px]',
    lg: 'w-5 h-5',
  };
  const textSize = {
    sm: 'text-sm',
    md: 'text-[15px]',
    lg: 'text-lg',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`${boxSize[size]} bg-gradient-to-br from-[#7138F5] via-[#2878FF] to-[#20C8E8] flex items-center justify-center text-white shadow-glow-purple shrink-0 transition-transform duration-200 group-hover:scale-[1.04]`}
      >
        <Sparkles className={iconSize[size]} />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span
            className={`${textSize[size]} font-extrabold tracking-tight text-[#111827] dark:text-white`}
          >
            OmniSocial{' '}
            <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
              AI
            </span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-semibold tracking-wide text-[#64748B] dark:text-slate-400 mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
