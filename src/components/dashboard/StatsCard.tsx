"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">vs ayer</span>
          </div>
        )}
      </div>
    </div>
  );
}
