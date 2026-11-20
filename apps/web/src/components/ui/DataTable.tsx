'use client';

import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  emptyState,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (isLoading) {
    return (
      <div
        className={`rounded-2xl border border-[#E7EAF2] dark:border-[#1E2749] bg-white dark:bg-[#0F142B]/90 overflow-hidden ${className}`}
      >
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-10 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div
        className={`rounded-2xl border border-[#E7EAF2] dark:border-[#1E2749] bg-white dark:bg-[#0F142B]/90 p-10 text-center text-sm text-[#64748B] dark:text-slate-400 ${className}`}
      >
        No records found.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-[#E7EAF2] dark:border-[#1E2749] bg-white dark:bg-[#0F142B]/90 overflow-hidden shadow-soft dark:shadow-none ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F7F8FC] dark:bg-white/[0.03] border-b border-[#E7EAF2] dark:border-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 whitespace-nowrap ${
                    alignClass[col.align || 'left']
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EAF2]/80 dark:divide-white/5">
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#F1EBFF]/45 dark:hover:bg-[#7138F5]/10'
                    : 'hover:bg-[#F7F8FC]/70 dark:hover:bg-white/[0.02]'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-3.5 text-[#111827] dark:text-slate-200 ${
                      alignClass[col.align || 'left']
                    } ${col.className || ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
