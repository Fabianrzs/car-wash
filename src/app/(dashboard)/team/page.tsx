"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Mail, Trash2, Copy, Check } from "lucide-react";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { PageLoader } from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface TeamMember {
  id: string;
  role: string;
  isActive: boolean;
  employeeCode: string | null;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  invitedBy: { name: string | null; email: string };
}

interface CreatedCredentials {
  employeeCode: string;
  pin: string;
  name: string;
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Admin",
  EMPLOYEE: "Lavador",
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

  // Invite admin flow
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole] = useState("ADMIN");
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Create employee direct flow
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", employeeCode: "", pin: "" });
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [removeModal, setRemoveModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false, id: "", name: "",
  });
  const [removing, setRemoving] = useState(false);

  const currentMember = members.find((m) => m.user.id === session?.user?.id);
  const isOwner = currentMember?.role === "OWNER";
  const isManager = isOwner || currentMember?.role === "ADMIN";

  const inputClass = "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300";

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

  const handleInviteAdmin = async (e: React.FormEvent) => {
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
          showMessage(`Invitación creada pero el correo no se pudo enviar. Comparte el enlace manualmente.`, true);
        } else {
          showMessage("Invitación enviada correctamente");
        }
        setInviteEmail("");
        setShowInviteModal(false);
        loadData();
      } else {
        showMessage(data.error || "Error al invitar", true);
      }
    } finally {
      setInviting(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEmployee(true);
    setMessage("");
    try {
      const res = await fetch("/api/tenant/team/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empForm),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCredentials(data);
        setEmpForm({ name: "", employeeCode: "", pin: "" });
        loadData();
      } else {
        showMessage(data.error || "Error al crear empleado", true);
      }
    } catch {
      showMessage("Error de conexión al crear empleado", true);
    } finally {
      setCreatingEmployee(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const tenantCode = session?.user?.tenantSlug || "(tu slug)";
    const text = `Código del lavadero: ${tenantCode}\nCódigo de empleado: ${createdCredentials.employeeCode}\nPIN: ${createdCredentials.pin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const confirmRemove = (id: string, name: string) => setRemoveModal({ open: true, id, name });

  const handleRemove = async () => {
    setRemoving(true);
    const res = await fetch(`/api/tenant/team?id=${removeModal.id}`, { method: "DELETE" });
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

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl">
      <OnboardingTour flowKey="team" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Equipo</h1>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowEmployeeModal(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              Agregar lavador
            </Button>
            {isOwner && (
              <Button variant="secondary" onClick={() => setShowInviteModal(true)}>
                <Mail className="mr-1.5 h-4 w-4" />
                Invitar admin
              </Button>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className="mb-4">
          <Alert variant={isError ? "error" : "success"}>{message}</Alert>
        </div>
      )}

      {/* Members */}
      <div data-onboarding="team-members-list" className="mb-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Miembros ({members.length})</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{m.user.name || m.user.email}</p>
                {m.employeeCode ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Código: <span className="font-mono font-medium">{m.employeeCode}</span></p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.user.email}</p>
                )}
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
                      <option value="EMPLOYEE">Lavador</option>
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

      {/* Modal: Agregar lavador */}
      <Modal isOpen={showEmployeeModal} onClose={() => { setShowEmployeeModal(false); setCreatedCredentials(null); }} title="Agregar lavador">
        {createdCredentials ? (
          <div>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Lavador <strong className="text-slate-900 dark:text-slate-100">{createdCredentials.name}</strong> creado. Entrega estas credenciales:
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-slate-600 dark:text-slate-400">Código de empleado: <span className="font-semibold text-slate-900 dark:text-slate-100">{createdCredentials.employeeCode}</span></p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">PIN: <span className="font-semibold text-slate-900 dark:text-slate-100">{createdCredentials.pin}</span></p>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              El lavador necesita también el código del lavadero ({session?.user?.tenantSlug || "tu slug"}) para entrar.
            </p>
            <div className="mt-4 flex justify-between">
              <Button variant="secondary" onClick={copyCredentials}>
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button onClick={() => { setCreatedCredentials(null); setShowEmployeeModal(false); }}>
                Listo
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre completo *</label>
              <input
                value={empForm.name}
                onChange={(e) => setEmpForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Juan Pérez"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Código de empleado *</label>
              <input
                value={empForm.employeeCode}
                onChange={(e) => setEmpForm((f) => ({ ...f, employeeCode: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                placeholder="juan01"
                required
                className={inputClass}
              />
              <p className="mt-0.5 text-xs text-slate-400">Solo letras minúsculas, números y guión bajo.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">PIN (4 dígitos) *</label>
              <input
                value={empForm.pin}
                onChange={(e) => setEmpForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="1234"
                required
                inputMode="numeric"
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowEmployeeModal(false)}>Cancelar</Button>
              <Button type="submit" loading={creatingEmployee} disabled={empForm.pin.length !== 4}>
                Crear lavador
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Invitar admin */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invitar administrador">
        <form onSubmit={handleInviteAdmin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Correo electrónico *</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>Cancelar</Button>
            <Button type="submit" loading={inviting} disabled={!inviteEmail}>
              <Mail className="mr-1.5 h-4 w-4" />
              Enviar invitación
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        isOpen={removeModal.open}
        onClose={() => setRemoveModal({ open: false, id: "", name: "" })}
        title="Confirmar eliminación"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          ¿Estás seguro de remover a <strong className="text-slate-900 dark:text-slate-100">{removeModal.name}</strong> del equipo?
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
