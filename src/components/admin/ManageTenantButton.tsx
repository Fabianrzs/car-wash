"use client";

import { ExternalLink } from "lucide-react";
import { setSelectedTenant } from "@/lib/multitenancy/cookie";

interface ManageTenantButtonProps {
  slug: string;
  className?: string;
}

export default function ManageTenantButton({
  slug,
  className = "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
}: ManageTenantButtonProps) {
  const handleClick = () => {
    setSelectedTenant(slug);
    window.open("/dashboard", "_blank");
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      <ExternalLink className="h-3 w-3" />
      Gestionar
    </button>
  );
}
