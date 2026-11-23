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
}

/**
 * Generic table component.
 * - Uses Tailwind classes defined in components.css.
 * - Renders a responsive wrapper that scrolls horizontally on small screens.
 * - Shows an EmptyState when `data` is empty.
 */
export const Table = <T,>({ columns, data, emptyState, className = '' }: TableProps<T>) => {
  if (data.length === 0) {
    return emptyState ? <>{emptyState}</> : <EmptyState title="No data available" />;
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1E293B] ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-[#1E293B]">
        <thead className="bg-slate-50 dark:bg-[#0F172A]">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                  col.className ?? ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-[#1E293B] bg-white dark:bg-[#111827]">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-slate-50 dark:hover:bg-[#1A232E] transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 ${
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
  );
};



