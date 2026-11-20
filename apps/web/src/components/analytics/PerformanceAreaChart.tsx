'use client';

import React, { useMemo } from 'react';

export interface PerformancePoint {
  date: string;
  reach?: number;
  impressions?: number;
  engagement?: number;
  clicks?: number;
}

interface PerformanceAreaChartProps {
  data: PerformancePoint[];
  height?: number;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function PerformanceAreaChart({
  data,
  height = 240,
}: PerformanceAreaChartProps) {
  const width = 680;
  const padX = 36;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2 - 22;

  const { reachPoints, engagementPoints, maxVal, labels } = useMemo(() => {
    const safe = data || [];
    const values = safe.flatMap((d) => [
      Number(d.reach ?? d.impressions ?? 0),
      Number(d.engagement ?? 0),
    ]);
    const max = Math.max(10, ...values);

    const step = safe.length > 1 ? chartW / (safe.length - 1) : chartW;
    const toY = (val: number) => padY + chartH - (val / max) * chartH;

    const rPts = safe.map((d, i) => ({
      x: padX + i * step,
      y: toY(Number(d.reach ?? d.impressions ?? 0)),
      raw: Number(d.reach ?? d.impressions ?? 0),
      date: d.date,
    }));

    const ePts = safe.map((d, i) => ({
      x: padX + i * step,
      y: toY(Number(d.engagement ?? 0)),
      raw: Number(d.engagement ?? 0),
      date: d.date,
    }));

    const labelStep = Math.max(1, Math.floor(safe.length / 6));
    const lbls = safe
      .map((d, i) => ({
        index: i,
        x: padX + i * step,
        text: d.date ? new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '',
      }))
      .filter((_, i) => i % labelStep === 0 || i === safe.length - 1);

    return { reachPoints: rPts, engagementPoints: ePts, maxVal: max, labels: lbls };
  }, [data, chartW, chartH]);

  const reachLine = buildSmoothPath(reachPoints);
  const reachArea =
    reachPoints.length > 0
      ? `${reachLine} L ${reachPoints[reachPoints.length - 1].x} ${padY + chartH} L ${reachPoints[0].x} ${padY + chartH} Z`
      : '';
  const engagementLine = buildSmoothPath(engagementPoints);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[460px]"
        role="img"
        aria-label="Performance overview area chart"
      >
        <defs>
          <linearGradient id="omniReachStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7138F5" />
            <stop offset="55%" stopColor="#2878FF" />
            <stop offset="100%" stopColor="#20C8E8" />
          </linearGradient>
          <linearGradient id="omniReachFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7138F5" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#2878FF" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#20C8E8" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {gridLines.map((ratio) => {
          const y = padY + chartH * (1 - ratio);
          const tickVal = Math.round(maxVal * ratio);
          return (
            <g key={ratio}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                className="stroke-[#E7EAF2] dark:stroke-white/10"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <text
                x={padX - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#64748B] dark:fill-slate-400 text-[10px] font-medium"
              >
                {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}k` : tickVal}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {reachArea && <path d={reachArea} fill="url(#omniReachFill)" />}

        {/* Engagement secondary line */}
        {engagementLine && (
          <path
            d={engagementLine}
            fill="none"
            stroke="#20C8E8"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}

        {/* Primary glowing reach spline */}
        {reachLine && (
          <path
            d={reachLine}
            fill="none"
            stroke="url(#omniReachStroke)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Data point highlights */}
        {reachPoints.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#7138F5" strokeWidth="2.5">
              <title>{`${pt.date}: ${pt.raw.toLocaleString()} reach`}</title>
            </circle>
          </g>
        ))}

        {/* X axis labels */}
        {labels.map((lbl) => (
          <text
            key={lbl.index}
            x={lbl.x}
            y={height - 6}
            textAnchor="middle"
            className="fill-[#64748B] dark:fill-slate-400 text-[10px] font-medium"
          >
            {lbl.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
