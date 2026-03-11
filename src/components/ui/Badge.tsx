import { cn } from "@/lib/utils";

const variantClasses = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger:  "bg-rose-50 text-rose-600 ring-rose-500/20",
  info:    "bg-sky-50 text-sky-700 ring-sky-600/20",
  default: "bg-slate-100 text-slate-600 ring-slate-400/20",
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
