import React from 'react';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80">
    <table className={`w-full text-left text-xs sm:text-sm text-[#202938] ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <thead className={`bg-[#F7F8FA] border-b border-slate-200 text-[11px] font-semibold text-[#778195] uppercase tracking-wider ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-slate-100 bg-white ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className = '', ...props }) => (
  <tr className={`transition-colors hover:bg-slate-50/70 ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <th className={`px-4 py-3 font-semibold ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <td className={`px-4 py-3.5 align-middle ${className}`} {...props}>
    {children}
  </td>
);

export const TableEmpty: React.FC<{ message?: string; colSpan?: number }> = ({ message = 'No data available', colSpan = 5 }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-10 px-4 text-xs text-[#778195]">
      {message}
    </td>
  </tr>
);

