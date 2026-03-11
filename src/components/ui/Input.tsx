import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
            "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10 dark:disabled:bg-slate-900 dark:disabled:text-slate-600",
            error &&
              "border-rose-400 focus:border-rose-400 focus:ring-rose-400/10 dark:border-rose-600 dark:focus:border-rose-500 dark:focus:ring-rose-500/10",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
