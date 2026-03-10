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

  // Register form state
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

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
        setRegEmail(data.email);
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    setRegisterError(null);

    try {
      const res = await fetch("/api/auth/register-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.error ?? "Error al crear la cuenta");
        return;
      }
      setRegistered(true);
    } catch {
      setRegisterError("Error al crear la cuenta");
    } finally {
      setRegistering(false);
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

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h1>
          <p className="text-gray-600 mb-6">
            Tu cuenta fue creada y ya eres parte de{" "}
            <strong>{invitation?.tenant.name}</strong>. Ahora inicia sesión para continuar.
          </p>
          <a
            href={`/login?callbackUrl=/dashboard`}
            className="inline-block py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Iniciar sesión
          </a>
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
          !showRegister ? (
            <div>
              <button
                onClick={handleAccept}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Iniciar sesión para aceptar
              </button>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  ¿No tienes cuenta?{" "}
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Crear cuenta aquí
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="font-semibold text-gray-800">Crear tu cuenta</h2>
              {registerError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{registerError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  placeholder="Juan Pérez"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={registering}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {registering ? "Creando cuenta..." : "Crear cuenta y unirme"}
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Ya tengo cuenta
              </button>
            </form>
          )
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
