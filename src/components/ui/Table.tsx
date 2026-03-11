import { type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export function Table({ className, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className={cn("w-full text-left text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <thead
      className={cn(
        "border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/60",
        className
      )}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tbody className={cn("divide-y divide-slate-100 dark:divide-slate-800", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr
      className={cn(
        "transition-colors duration-100 hover:bg-slate-50/70 dark:hover:bg-slate-800/50",
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  children: React.ReactNode;
}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  children: React.ReactNode;
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}
