'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BarChart2, Eye, Users, Heart, Percent } from 'lucide-react';
import { formatMetricNumber } from './AnalyticsKPICard';

export interface TimeseriesPoint {
  date: string;
  impressions: number | null;
  reach: number | null;
  engagements: number | null;
  engagementRate: number | null;
  followers: number | null;
  platforms?: {
    facebook: { impressions: number | null; reach: number | null; engagements: number | null };
    instagram: { impressions: number | null; reach: number | null; engagements: number | null };
  };
}

interface AnalyticsChartProps {
  dataPoints: TimeseriesPoint[];
  isLoading?: boolean;
}

type MetricTab = 'reach_impressions' | 'followers' | 'engagements' | 'engagement_rate';

export function AnalyticsChart({ dataPoints = [], isLoading = false }: AnalyticsChartProps) {
  const [activeTab, setActiveTab] = useState<MetricTab>('reach_impressions');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="border border-slate-200/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="h-5 w-44 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-slate-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <Card className="border border-slate-200/80 shadow-xs p-8 text-center bg-white">
        <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">No Historical Data Available</p>
        <p className="text-xs text-slate-400 mt-1">
          Historical curves will appear once daily analytics snapshots are synchronized.
        </p>
      </Card>
    );
  }

  // Determine series to display based on active tab
  let primaryKey: keyof TimeseriesPoint = 'impressions';
  let secondaryKey: keyof TimeseriesPoint | null = 'reach';
  let primaryLabel = 'Impressions';
  let secondaryLabel = 'Reach';
  let primaryColor = '#6366f1'; // indigo
  let secondaryColor = '#ec4899'; // pink
  let isPercentage = false;

  if (activeTab === 'followers') {
    primaryKey = 'followers';
    secondaryKey = null;
    primaryLabel = 'Followers';
    primaryColor = '#3b82f6'; // blue
  } else if (activeTab === 'engagements') {
    primaryKey = 'engagements';
    secondaryKey = null;
    primaryLabel = 'Total Engagements';
    primaryColor = '#10b981'; // emerald
  } else if (activeTab === 'engagement_rate') {
    primaryKey = 'engagementRate';
    secondaryKey = null;
    primaryLabel = 'Engagement Rate';
    primaryColor = '#8b5cf6'; // purple
    isPercentage = true;
  }

  // Calculate scales (ignoring nulls)
  const validPrimaryValues = dataPoints
    .map((d) => d[primaryKey] as number | null)
    .filter((v): v is number => v !== null && v !== undefined);

  const validSecondaryValues = secondaryKey
    ? dataPoints
        .map((d) => d[secondaryKey] as number | null)
        .filter((v): v is number => v !== null && v !== undefined)
    : [];

  const allValidValues = [...validPrimaryValues, ...validSecondaryValues];
  const maxValue = allValidValues.length > 0 ? Math.max(...allValidValues) : 1;
  const minValue = 0;

  // Chart SVG Dimensions
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (dataPoints.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val: number | null) => {
    if (val === null || val === undefined) return null;
    const normalized = (val - minValue) / (maxValue === 0 ? 1 : maxValue);
    return paddingTop + chartHeight - normalized * chartHeight;
  };

  // Build SVG path segments respecting gaps (null values create breaks, not zero plunges)
  const buildSegments = (key: keyof TimeseriesPoint) => {
    const segments: Array<Array<{ x: number; y: number; val: number; index: number }>> = [];
    let currentSegment: Array<{ x: number; y: number; val: number; index: number }> = [];

    dataPoints.forEach((d, i) => {
      const val = d[key] as number | null;
      if (val !== null && val !== undefined) {
        currentSegment.push({
          x: getX(i),
          y: getY(val)!,
          val,
          index: i,
        });
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }
    });

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }
    return segments;
  };

  const primarySegments = buildSegments(primaryKey);
  const secondarySegments = secondaryKey ? buildSegments(secondaryKey) : [];

  const createPathD = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} m -2,0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0`;
    return pts.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  };

  return (
    <Card className="border border-slate-200/80 shadow-xs bg-white">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">
            Performance Over Time
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated daily snapshot curves. Missing observation dates display as gaps.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('reach_impressions')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'reach_impressions'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Reach &amp; Impressions</span>
          </button>

          <button
            onClick={() => setActiveTab('followers')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'followers'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Followers</span>
          </button>

          <button
            onClick={() => setActiveTab('engagements')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'engagements'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Engagements</span>
          </button>

          <button
            onClick={() => setActiveTab('engagement_rate')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'engagement_rate'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Rate</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Chart Legend */}
        <div className="flex items-center justify-end gap-4 text-xs font-medium text-slate-600 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span>{primaryLabel}</span>
          </div>
          {secondaryKey && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span>{secondaryLabel}</span>
            </div>
          )}
        </div>

        {/* Responsive SVG Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingTop + chartHeight * (1 - pct);
              const val = minValue + (maxValue - minValue) * pct;
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    className="font-mono"
                  >
                    {formatMetricNumber(val, isPercentage)}
                  </text>
                </g>
              );
            })}

            {/* X-axis date labels */}
            {dataPoints.map((d, i) => {
              // Show label on first, middle, last or spaced out
              const shouldShowLabel =
                dataPoints.length <= 7 ||
                i === 0 ||
                i === Math.floor(dataPoints.length / 2) ||
                i === dataPoints.length - 1;

              if (!shouldShowLabel) return null;
              const x = getX(i);
              const label = d.date.slice(5); // MM-DD
              return (
                <text
                  key={d.date}
                  x={x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  className="font-mono"
                >
                  {label}
                </text>
              );
            })}

            {/* Hover guideline */}
            {hoveredIndex !== null && (
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={paddingTop + chartHeight}
                stroke="#cbd5e1"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
            )}

            {/* Secondary Series Paths */}
            {secondarySegments.map((seg, sIdx) => (
              <g key={`sec-${sIdx}`}>
                <path
                  d={createPathD(seg)}
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {seg.map((pt) => (
                  <circle
                    key={`sec-pt-${pt.index}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === pt.index ? 4.5 : 2.5}
                    fill="#ffffff"
                    stroke={secondaryColor}
                    strokeWidth="2"
                  />
                ))}
              </g>
            ))}

            {/* Primary Series Paths */}
            {primarySegments.map((seg, sIdx) => (
              <g key={`pri-${sIdx}`}>
                <path
                  d={createPathD(seg)}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {seg.map((pt) => (
                  <circle
                    key={`pri-pt-${pt.index}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === pt.index ? 5 : 3}
                    fill="#ffffff"
                    stroke={primaryColor}
                    strokeWidth="2"
                  />
                ))}
              </g>
            ))}

            {/* Transparent hover capture rectangles */}
            {dataPoints.map((_, i) => {
              const x = getX(i);
              const colWidth = chartWidth / Math.max(1, dataPoints.length);
              return (
                <rect
                  key={`hover-col-${i}`}
                  x={x - colWidth / 2}
                  y={paddingTop}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredIndex !== null && dataPoints[hoveredIndex] && (
            <div
              className="absolute z-10 bg-slate-900/95 text-white text-xs rounded-lg p-2.5 shadow-xl pointer-events-none backdrop-blur-xs min-w-[140px] transform -translate-x-1/2 -translate-y-full mb-3"
              style={{
                left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
                top: '50px',
              }}
            >
              <div className="font-semibold text-slate-300 border-b border-slate-700/60 pb-1 mb-1.5">
                {dataPoints[hoveredIndex].date}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                  {primaryLabel}:
                </span>
                <span className="font-bold">
                  {formatMetricNumber(dataPoints[hoveredIndex][primaryKey] as number | null, isPercentage)}
                </span>
              </div>

              {secondaryKey && (
                <div className="flex items-center justify-between gap-3 mt-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
                    {secondaryLabel}:
                  </span>
                  <span className="font-bold">
                    {formatMetricNumber(dataPoints[hoveredIndex][secondaryKey] as number | null, isPercentage)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
