import React from 'react';

export type SupportedPlatformKey =
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'TWITTER_X'
  | 'LINKEDIN'
  | 'PINTEREST'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'THREADS';

export interface PlatformMeta {
  key: SupportedPlatformKey;
  provider: string;
  label: string;
  shortLabel: string;
  gradient: string;
  bgSoft: string;
  textColor: string;
  borderColor: string;
  brandHex: string;
}

export const PLATFORM_METADATA: Record<SupportedPlatformKey, PlatformMeta> = {
  INSTAGRAM: {
    key: 'INSTAGRAM',
    provider: 'META_INSTAGRAM',
    label: 'Instagram',
    shortLabel: 'IG',
    gradient: 'from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    bgSoft: 'bg-pink-50 dark:bg-pink-500/15',
    textColor: 'text-pink-600 dark:text-pink-300',
    borderColor: 'border-pink-200 dark:border-pink-500/30',
    brandHex: '#E1306C',
  },
  FACEBOOK: {
    key: 'FACEBOOK',
    provider: 'META_FACEBOOK',
    label: 'Facebook',
    shortLabel: 'FB',
    gradient: 'from-[#1877F2] to-[#0E5CE0]',
    bgSoft: 'bg-blue-50 dark:bg-blue-500/15',
    textColor: 'text-blue-600 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-500/30',
    brandHex: '#1877F2',
  },
  TWITTER_X: {
    key: 'TWITTER_X',
    provider: 'TWITTER_X',
    label: 'X (Twitter)',
    shortLabel: 'X',
    gradient: 'from-[#1F2937] to-[#030712]',
    bgSoft: 'bg-slate-100 dark:bg-white/10',
    textColor: 'text-slate-900 dark:text-slate-100',
    borderColor: 'border-slate-300 dark:border-white/20',
    brandHex: '#111827',
  },
  LINKEDIN: {
    key: 'LINKEDIN',
    provider: 'LINKEDIN',
    label: 'LinkedIn',
    shortLabel: 'in',
    gradient: 'from-[#0A66C2] to-[#004182]',
    bgSoft: 'bg-sky-50 dark:bg-sky-500/15',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-200 dark:border-sky-500/30',
    brandHex: '#0A66C2',
  },
  PINTEREST: {
    key: 'PINTEREST',
    provider: 'PINTEREST',
    label: 'Pinterest',
    shortLabel: 'Pin',
    gradient: 'from-[#E60023] to-[#B5001B]',
    bgSoft: 'bg-red-50 dark:bg-red-500/15',
    textColor: 'text-red-600 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-500/30',
    brandHex: '#E60023',
  },
  YOUTUBE: {
    key: 'YOUTUBE',
    provider: 'YOUTUBE',
    label: 'YouTube',
    shortLabel: 'YT',
    gradient: 'from-[#FF0000] to-[#CC0000]',
    bgSoft: 'bg-rose-50 dark:bg-rose-500/15',
    textColor: 'text-rose-600 dark:text-rose-300',
    borderColor: 'border-rose-200 dark:border-rose-500/30',
    brandHex: '#FF0000',
  },
  TIKTOK: {
    key: 'TIKTOK',
    provider: 'TIKTOK',
    label: 'TikTok',
    shortLabel: 'TT',
    gradient: 'from-[#111827] via-[#25F4EE]/80 to-[#FE2C55]',
    bgSoft: 'bg-slate-100 dark:bg-white/10',
    textColor: 'text-slate-900 dark:text-white',
    borderColor: 'border-slate-300 dark:border-white/20',
    brandHex: '#FE2C55',
  },
  THREADS: {
    key: 'THREADS',
    provider: 'THREADS',
    label: 'Threads',
    shortLabel: '@',
    gradient: 'from-[#27272A] to-[#09090B]',
    bgSoft: 'bg-zinc-100 dark:bg-white/10',
    textColor: 'text-zinc-900 dark:text-zinc-100',
    borderColor: 'border-zinc-300 dark:border-white/20',
    brandHex: '#18181B',
  },
};

export const ORDERED_PLATFORMS: SupportedPlatformKey[] = [
  'INSTAGRAM',
  'FACEBOOK',
  'TWITTER_X',
  'LINKEDIN',
  'PINTEREST',
  'YOUTUBE',
  'TIKTOK',
  'THREADS',
];

export function normalizePlatformKey(raw: string): SupportedPlatformKey {
  const upper = (raw || '').toUpperCase().trim();
  if (upper === 'META_INSTAGRAM' || upper === 'INSTAGRAM') return 'INSTAGRAM';
  if (upper === 'META_FACEBOOK' || upper === 'FACEBOOK') return 'FACEBOOK';
  if (upper === 'TWITTER_X' || upper === 'TWITTER' || upper === 'X') return 'TWITTER_X';
  if (upper === 'LINKEDIN') return 'LINKEDIN';
  if (upper === 'PINTEREST') return 'PINTEREST';
  if (upper === 'YOUTUBE') return 'YOUTUBE';
  if (upper === 'TIKTOK') return 'TIKTOK';
  if (upper === 'THREADS') return 'THREADS';
  return 'INSTAGRAM';
}

export function PlatformGlyph({
  platform,
  className = 'w-4 h-4',
}: {
  platform: string;
  className?: string;
}) {
  const key = normalizePlatformKey(platform);
  switch (key) {
    case 'INSTAGRAM':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'FACEBOOK':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
        </svg>
      );
    case 'TWITTER_X':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'LINKEDIN':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" />
        </svg>
      );
    case 'PINTEREST':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12.017 2C6.486 2 2 6.486 2 12.017c0 4.242 2.636 7.868 6.357 9.327-.088-.792-.167-2.008.035-2.874.182-.782 1.176-4.986 1.176-4.986s-.3-.6-.3-1.488c0-1.394.808-2.435 1.814-2.435.855 0 1.268.642 1.268 1.412 0 .86-.548 2.146-.831 3.338-.236 1 .501 1.815 1.486 1.815 1.784 0 3.155-1.881 3.155-4.596 0-2.403-1.727-4.083-4.193-4.083-2.856 0-4.533 2.142-4.533 4.356 0 .863.332 1.788.747 2.291a.3.3 0 0 1 .069.288c-.076.316-.246 1-.279 1.139-.044.183-.146.222-.337.134-1.258-.586-2.044-2.424-2.044-3.9 0-3.175 2.307-6.09 6.652-6.09 3.493 0 6.207 2.489 6.207 5.815 0 3.47-2.188 6.262-5.225 6.262-1.02 0-1.979-.53-2.307-1.156l-.628 2.392c-.227.875-.842 1.973-1.253 2.642.944.292 1.944.45 2.982.45 5.531 0 10.017-4.486 10.017-10.017C22.034 6.486 17.548 2 12.017 2Z" />
        </svg>
      );
    case 'YOUTUBE':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
        </svg>
      );
    case 'TIKTOK':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z" />
        </svg>
      );
    case 'THREADS':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
          <path d="M19 12a7 7 0 1 1-2.5-5.35" strokeLinecap="round" />
          <path d="M15.5 11.5c0 2.5-1.5 4-3.5 4s-3.5-1.3-3.5-3.2c0-2 1.5-3.3 3.6-3.3 2.2 0 3.4 1.3 3.4 3.5 0 2.3-.9 4.5-3.5 4.5-1.3 0-2.4-.5-3.1-1.3" strokeLinecap="round" />
        </svg>
      );
  }
}

export interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'pill' | 'icon';
  className?: string;
}

export function PlatformBadge({
  platform,
  size = 'md',
  showLabel = true,
  variant = 'pill',
  className = '',
}: PlatformBadgeProps) {
  const key = normalizePlatformKey(platform);
  const meta = PLATFORM_METADATA[key];

  if (variant === 'icon') {
    const iconBoxSizes = {
      sm: 'w-7 h-7 rounded-lg',
      md: 'w-9 h-9 rounded-xl',
      lg: 'w-12 h-12 rounded-2xl',
    };
    const glyphSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-6 h-6',
    };
    return (
      <span
        title={meta.label}
        className={`inline-flex items-center justify-center bg-gradient-to-br ${meta.gradient} text-white shadow-sm shrink-0 ${iconBoxSizes[size]} ${className}`}
      >
        <PlatformGlyph platform={key} className={glyphSizes[size]} />
      </span>
    );
  }

  const pillSizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${meta.bgSoft} ${meta.textColor} ${meta.borderColor} ${pillSizes[size]} ${className}`}
    >
      <PlatformGlyph platform={key} className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
