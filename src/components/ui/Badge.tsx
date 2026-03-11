import { cn } from "@/lib/utils";

const variantClasses = {
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-500/25",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/25 dark:text-amber-400 dark:ring-amber-500/25",
  danger:
    "bg-rose-50 text-rose-600 ring-rose-500/20 dark:bg-rose-900/25 dark:text-rose-400 dark:ring-rose-500/25",
  info:
    "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-900/25 dark:text-violet-400 dark:ring-violet-500/25",
  default:
    "bg-slate-100 text-slate-600 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600/20",
};

interface BadgeProps {
  variant?: keyof typeof variantClasses;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
