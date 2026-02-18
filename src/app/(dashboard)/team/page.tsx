"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Mail, Trash2 } from "lucide-react";
import { PageLoader } from "@/components/ui/Spinner";

interface TeamMember {
  id: string;
  role: string;
  isActive: boolean;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  invitedBy: { name: string | null; email: string };
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");

  // Check if current user is OWNER
  const currentMember = members.find((m) => m.user.id === session?.user?.id);
  const isOwner = currentMember?.role === "OWNER";

  const loadData = async () => {
    const [membersRes, invitationsRes] = await Promise.all([
      fetch("/api/tenant/team"),
      fetch("/api/tenant/invitations"),
    ]);
    const membersData = await membersRes.json();
    const invitationsData = await invitationsRes.json();
    setMembers(Array.isArray(membersData) ? membersData : []);
    setInvitations(Array.isArray(invitationsData) ? invitationsData : []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage("");

    try {
      const res = await fetch("/api/tenant/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Invitacion enviada");
        setInviteEmail("");
        loadData();
      } else {
        setMessage(data.error || "Error al invitar");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (tenantUserId: string, newRole: string) => {
    setMessage("");
    const res = await fetch("/api/tenant/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantUserId, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Rol actualizado");
      loadData();
    } else {
      setMessage(data.error || "Error al cambiar rol");
    }
  };

  const handleRemove = async (tenantUserId: string, userName: string) => {
    if (!confirm(`¿Estas seguro de remover a ${userName}?`)) return;
    setMessage("");
    const res = await fetch(`/api/tenant/team?id=${tenantUserId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Miembro removido");
      loadData();
    } else {
      setMessage(data.error || "Error al remover");
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-6 w-6 text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Equipo</h1>
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="mb-6 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="EMPLOYEE">Empleado</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={inviting || !inviteEmail}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Invitar
        </button>
      </form>

      {message && (
        <p className={`mb-4 text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}

      {/* Members */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Miembros ({members.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{m.user.name || m.user.email}</p>
                <p className="text-sm text-gray-500">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && m.role !== "OWNER" ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.id, e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="EMPLOYEE">Empleado</option>
                    </select>
                    <button
                      onClick={() => handleRemove(m.id, m.user.name || m.user.email)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      title="Remover miembro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.role === "OWNER" ? "bg-purple-100 text-purple-700" :
                    m.role === "ADMIN" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {m.role === "OWNER" ? "Propietario" : m.role === "ADMIN" ? "Admin" : "Empleado"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-900">
              Invitaciones Pendientes ({invitations.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{inv.email}</p>
                    <p className="text-xs text-gray-500">
                      Invitado por {inv.invitedBy.name || inv.invitedBy.email}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  {inv.role} - Pendiente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
