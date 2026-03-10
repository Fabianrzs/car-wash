"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  tenant: { name: string; slug: string };
  invitedBy: { name: string | null; email: string };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  EMPLOYEE: "Empleado",
  OWNER: "Propietario",
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/invite/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Invitación no válida");
          return;
        }
        const data = await res.json();
        setInvitation(data);
      } catch {
        setError("Error al cargar la invitación");
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  async function handleAccept() {
    if (!session) {
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    try {
      const res = await fetch("/api/tenant/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al aceptar la invitación");
        return;
      }
      setAccepted(true);
      if (invitation?.tenant?.slug) {
        document.cookie = `selected-tenant=${invitation.tenant.slug}; path=/`;
      }
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setError("Error al aceptar la invitación");
    } finally {
      setAccepting(false);
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando invitación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitación no válida</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/login" className="text-blue-600 hover:underline">
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Invitación aceptada!</h1>
          <p className="text-gray-600">Redirigiendo al panel de control...</p>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tienes una invitación</h1>
        <p className="text-gray-600 mb-6">
          <strong>{invitation.invitedBy.name ?? invitation.invitedBy.email}</strong> te ha invitado
          a unirte a{" "}
          <strong>{invitation.tenant.name}</strong> como{" "}
          <strong>{ROLE_LABELS[invitation.role] ?? invitation.role}</strong>.
        </p>

        {!session ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Necesitas iniciar sesión para aceptar esta invitación.
            </p>
            <button
              onClick={handleAccept}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Iniciar sesión para aceptar
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Sesión activa como <strong>{session.user?.email}</strong>.
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {accepting ? "Aceptando..." : "Aceptar invitación"}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          Invitación válida hasta {new Date(invitation.expiresAt).toLocaleDateString("es-CO")}
        </p>
      </div>
    </div>
  );
}
