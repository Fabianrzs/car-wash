"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTenantRole } from "@/hooks/useTenantRole";

// Pages employees are allowed to access
const ALLOWED: string[] = ["/mis-ordenes", "/mis-ganancias"];

function isEmployeeAllowed(pathname: string): boolean {
  if (ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  // Allow viewing individual order details
  if (/^\/orders\/[^/]+$/.test(pathname)) return true;
  return false;
}

export default function EmployeeRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = useTenantRole();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role !== "EMPLOYEE") return;
    if (!isEmployeeAllowed(pathname ?? "")) {
      router.replace("/mis-ordenes");
    }
  }, [role, pathname, router]);

  return <>{children}</>;
}
