"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Mail, Trash2 } from "lucide-react";
import { PageLoader } from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

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

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Admin",
  EMPLOYEE: "Empleado",
};

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
  ADMIN: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  EMPLOYEE: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [removeModal, setRemoveModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  });
  const [removing, setRemoving] = useState(false);

  const currentMember = members.find((m) => m.user.id === session?.user?.id);
  const isOwner = currentMember?.role === "OWNER";

  const inputClass = "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300";
  const selectClass = "h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

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

  const showMessage = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

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
        if (data.emailError) {
          showMessage(`Invitacion creada pero el correo no se pudo enviar: ${data.emailError}. Comparte el enlace manualmente.`, true);
        } else {
          showMessage("Invitacion enviada correctamente");
        }
        setInviteEmail("");
        loadData();
      } else {
        showMessage(data.error || "Error al invitar", true);
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
      showMessage("Rol actualizado");
      loadData();
    } else {
      showMessage(data.error || "Error al cambiar rol", true);
    }
  };

  const confirmRemove = (id: string, name: string) => {
    setRemoveModal({ open: true, id, name });
  };

  const handleRemove = async () => {
    setRemoving(true);
    const res = await fetch(`/api/tenant/team?id=${removeModal.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setRemoveModal({ open: false, id: "", name: "" });
    setRemoving(false);
    if (res.ok) {
      showMessage("Miembro removido");
      loadData();
    } else {
      showMessage(data.error || "Error al remover", true);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Equipo</h1>
      </div>

      {/* Invite form - only for OWNER */}
      {isOwner && (
        <form onSubmit={handleInvite} className="mb-6 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
          <div className="flex-1">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className={inputClass}
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className={selectClass}
          >
            <option value="EMPLOYEE">Empleado</option>
            <option value="ADMIN">Admin</option>
          </select>
          <Button
            type="submit"
            disabled={inviting || !inviteEmail}
            loading={inviting}
            className="w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Invitar
          </Button>
        </form>
      )}

      {message && (
        <div className="mb-4">
          <Alert variant={isError ? "error" : "success"}>{message}</Alert>
        </div>
      )}

      {/* Members */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Miembros ({members.length})</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{m.user.name || m.user.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && m.role !== "OWNER" ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.id, e.target.value)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="EMPLOYEE">Empleado</option>
                    </select>
                    <button
                      onClick={() => confirmRemove(m.id, m.user.name || m.user.email)}
                      className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      title="Remover miembro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[m.role] || ROLE_BADGE.EMPLOYEE}`}>
                    {ROLE_LABEL[m.role] || m.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Invitaciones Pendientes ({invitations.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{inv.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Invitado por {inv.invitedBy.name || inv.invitedBy.email}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {ROLE_LABEL[inv.role] || inv.role} — Pendiente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove confirmation modal */}
      <Modal
        isOpen={removeModal.open}
        onClose={() => setRemoveModal({ open: false, id: "", name: "" })}
        title="Confirmar eliminacion"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Estas seguro de remover a <strong className="text-slate-900 dark:text-slate-100">{removeModal.name}</strong> del equipo?
          Esta accion no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRemoveModal({ open: false, id: "", name: "" })}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleRemove} loading={removing}>
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
