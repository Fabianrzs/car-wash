import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

const variantClasses = {
  success:
    "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300",
  error:
    "bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-900/20 dark:border-rose-700 dark:text-rose-300",
  warning:
    "bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300",
  info:
    "bg-violet-50 border-violet-500 text-violet-800 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-300",
};

const variantIcons = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

interface AlertProps {
  variant?: keyof typeof variantClasses;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps) {
  const Icon = variantIcons[variant];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border-l-4 p-4",
        variantClasses[variant],
        className
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="mb-0.5 text-sm font-semibold">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
