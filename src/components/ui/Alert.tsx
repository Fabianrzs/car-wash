import { cn } from "@/lib/utils";

const variantClasses = {
  success: "border-green-500 bg-green-50 text-green-800",
  error: "border-red-500 bg-red-50 text-red-800",
  warning: "border-yellow-500 bg-yellow-50 text-yellow-800",
  info: "border-blue-500 bg-blue-50 text-blue-800",
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
  return (
    <div
      className={cn(
        "rounded-lg border-l-4 p-4",
        variantClasses[variant],
        className
      )}
      role="alert"
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
