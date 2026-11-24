import React from 'react';
import { EmptyState } from './EmptyState';

export interface TableColumn<T> {
  /** Header text */
  header: string;
  /** Function that returns cell content for a row */
  accessor: (row: T) => React.ReactNode;
  /** Optional class for column width/alignment */
  className?: string;
}

interface TableProps<T> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Optional empty state component – shown when data is empty */
  emptyState?: React.ReactNode;
  /** Optional class name for the overall table wrapper */
  className?: string;
  /** Whether to render stacked cards on small mobile screens (< md). Defaults to true. */
  responsiveCards?: boolean;
}

/**
 * Generic table component.
 * - Enforces AnnaSathi light design system.
 * - Features clean desktop table view with auto-responsive card layout on mobile devices.
 * - Shows an EmptyState when `data` is empty.
 */
export const Table = <T,>({
  columns,
  data,
  emptyState,
  className = '',
  responsiveCards = true,
}: TableProps<T>) => {
  if (data.length === 0) {
    return emptyState ? <>{emptyState}</> : <EmptyState title="No data available" />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mobile Card View (< md) */}
      {responsiveCards && (
        <div className="block md:hidden space-y-3">
          {data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3"
            >
              {columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm pb-2 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {col.header}
                  </span>
                  <div className="text-slate-800 text-left sm:text-right">
                    {col.accessor(row)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Desktop / Tablet Table View */}
      <div
        className={`${
          responsiveCards ? 'hidden md:block' : 'block'
        } overflow-x-auto rounded-xl border border-slate-200 bg-white`}
      >
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/90">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 ${
                    col.className ?? ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50/80 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3.5 text-sm text-slate-800 ${
                      col.className ?? ''
                    }`}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



