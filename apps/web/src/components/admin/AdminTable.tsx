'use client';
import React from 'react';

export interface AdminTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
}

export function AdminTable<T>({
  columns,
  rows,
  getRowKey,
  actions,
  emptyMessage,
}: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-[15px] text-secondary">
        {emptyMessage ?? 'Sin datos.'}
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-sand">
          {columns.map((col) => (
            <th
              key={col.key}
              className="text-left text-[13px] text-secondary font-normal px-4 py-3"
            >
              {col.label}
            </th>
          ))}
          {actions && (
            <th className="text-right text-[13px] text-secondary font-normal px-4 py-3">
              Acciones
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)} className="border-b border-border min-h-[44px]">
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-[15px] text-foreground">
                {col.render
                  ? col.render(row)
                  : String((row as Record<string, unknown>)[col.key] ?? '')}
              </td>
            ))}
            {actions && (
              <td className="text-right px-4 py-3">{actions(row)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
