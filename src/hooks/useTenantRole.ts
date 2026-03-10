"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type TenantRole = "OWNER" | "ADMIN" | "EMPLOYEE" | null;

export function useTenantRole(): TenantRole {
  const { data: session } = useSession();
  const [role, setRole] = useState<TenantRole>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/tenant/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((members) => {
        if (!members) return;
        const me = members.find(
          (m: { user: { id: string }; role: string }) => m.user.id === session.user.id
        );
        setRole((me?.role as TenantRole) ?? null);
      })
      .catch(() => null);
  }, [session?.user?.id]);

  return role;
}
