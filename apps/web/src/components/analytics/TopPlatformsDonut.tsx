'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Share2 } from 'lucide-react';
import { PlatformBadge } from '@/components/ui/PlatformBadge';

export interface PlatformShare {
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'LINKEDIN' | 'PINTEREST' | 'YOUTUBE' | 'TIKTOK' | 'THREADS';
  label: string;
  percentage: number;
  color: string;
  count?: number;
}

interface TopPlatformsDonutProps {
  shares?: PlatformShare[];
  isLoading?: boolean;
}

export function TopPlatformsDonut({ shares, isLoading = false }: TopPlatformsDonutProps) {
  // Default fallback if no platform analytics exist yet
  const defaultShares: PlatformShare[] = [
    { platform: 'INSTAGRAM', label: 'Instagram', percentage: 38, color: '#E1306C' },
    { platform: 'FACEBOOK', label: 'Facebook', percentage: 26, color: '#1877F2' },
    { platform: 'LINKEDIN', label: 'LinkedIn', percentage: 16, color: '#0A66C2' },
    { platform: 'TWITTER', label: 'X (Twitter)', percentage: 12, color: '#8B5CF6' },
    { platform: 'YOUTUBE', label: 'YouTube', percentage: 8, color: '#FF0000' },
  ];

  const data = shares && shares.length > 0 ? shares : defaultShares;

  // Calculate SVG stroke dashes for donut segments
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  if (isLoading) {
    return (
      <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="w-40 h-40 rounded-full border-8 border-slate-200 dark:border-slate-800 mx-auto" />
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-purple dark:text-brand-cyan" />
            Top Platforms
          </CardTitle>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Share of Reach
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center my-2">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-slate-100 dark:text-slate-800"
            />
            {data.map((item, idx) => {
              const dashLength = (item.percentage / 100) * circumference;
              const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
              const strokeDashoffset = -cumulativeOffset;
              cumulativeOffset += dashLength;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out hover:opacity-80"
                />
              );
            })}
          </svg>

          {/* Centered label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {data.length}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Channels
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
