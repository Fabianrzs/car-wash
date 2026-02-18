"use client";

import { ExternalLink } from "lucide-react";
import { buildTenantUrl, supportsSubdomains } from "@/lib/domain";
import { setSelectedTenant } from "@/lib/tenant-cookie";

interface ManageTenantButtonProps {
  slug: string;
  className?: string;
}

export default function ManageTenantButton({
  slug,
  className = "inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100",
}: ManageTenantButtonProps) {
  const handleClick = () => {
    if (supportsSubdomains()) {
      const url = buildTenantUrl(slug, "/dashboard");
      window.open(
        `/api/auth/session-relay?callbackUrl=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else {
      setSelectedTenant(slug);
      window.open("/dashboard", "_blank");
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      <ExternalLink className="h-3 w-3" />
      Gestionar
    </button>
  );
}
