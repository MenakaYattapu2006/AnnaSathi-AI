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
    <div className={`overflow-x-auto ${className}`}>
      <table className="table min-w-full">
        <thead className="thead">
          <tr className="tr">
            {columns.map((col, idx) => (
              <th key={idx} className={`th ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="tr">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`td ${col.className ?? ''}`}>
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
