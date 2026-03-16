import nodemailer from "nodemailer";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
const APP_URL = APP_DOMAIN.startsWith("http") ? APP_DOMAIN : `https://${APP_DOMAIN}`;

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@localhost";

export async function sendWelcomeEmail(
  to: string,
  name: string,
  tenantName: string,
  tenantSlug: string
) {
  const dashboardUrl = `${APP_URL}/dashboard`;

  await createTransport().sendMail({
    from: FROM,
    to,
    subject: `¡Bienvenido a ${tenantName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1a1a1a;">¡Hola, ${name}!</h1>
        <p style="color: #444; font-size: 16px;">
          Tu cuenta y tu lavadero <strong>${tenantName}</strong> han sido creados exitosamente.
        </p>
        <p style="color: #444; font-size: 16px;">
          Ya puedes acceder a tu panel de control y empezar a gestionar tu negocio.
        </p>
        <a
          href="${dashboardUrl}"
          style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px;"
        >
          Ir al panel de control
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          Si no creaste esta cuenta, puedes ignorar este email.
        </p>
      </div>
    `,
  });
}

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  tenantName: string,
  token: string,
  role: string
) {
  const inviteUrl = `${APP_URL}/invite/${token}`;
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    EMPLOYEE: "Empleado",
    OWNER: "Propietario",
  };
  const roleLabel = roleLabels[role] ?? role;

  await createTransport().sendMail({
    from: FROM,
    to,
    subject: `${inviterName} te invitó a ${tenantName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1a1a1a;">Tienes una invitación</h1>
        <p style="color: #444; font-size: 16px;">
          <strong>${inviterName}</strong> te ha invitado a unirte a <strong>${tenantName}</strong>
          como <strong>${roleLabel}</strong>.
        </p>
        <p style="color: #444; font-size: 16px;">
          Haz clic en el botón de abajo para aceptar la invitación. El enlace expira en 7 días.
        </p>
        <a
          href="${inviteUrl}"
          style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px;"
        >
          Aceptar invitación
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          Si no esperabas esta invitación, puedes ignorar este email.
        </p>
      </div>
    `,
  });
}

const ORDER_STATUS_LABELS_ES: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Proceso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export async function sendOrderStatusChangeEmail(
  to: string,
  tenantName: string,
  orderNumber: string,
  newStatus: string,
  clientName: string,
  changedByName: string
) {
  const statusLabel = ORDER_STATUS_LABELS_ES[newStatus] ?? newStatus;

  await createTransport().sendMail({
    from: FROM,
    to,
    subject: `[${tenantName}] Orden ${orderNumber} — ${statusLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1a1a1a;">Cambio de estado en una orden</h1>
        <p style="color: #444; font-size: 16px;">
          La orden <strong>${orderNumber}</strong> del cliente <strong>${clientName}</strong>
          cambió su estado a <strong>${statusLabel}</strong>.
        </p>
        <p style="color: #444; font-size: 16px;">
          Cambio realizado por: <strong>${changedByName}</strong>
        </p>
        <a
          href="${APP_URL}/dashboard"
          style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px;"
        >
          Ver en el panel
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          Recibes este correo porque eres miembro de ${tenantName}.
        </p>
      </div>
    `,
  });
}

export async function sendPaymentReminderEmail(
  to: string,
  tenantName: string,
  invoiceNumber: string,
  amount: number,
  dueDate: Date | null,
  type: string
) {
  const typeLabels: Record<string, { subject: string; heading: string; body: string }> = {
    UPCOMING: {
      subject: `Recordatorio de pago - Factura ${invoiceNumber}`,
      heading: "Recordatorio de pago próximo",
      body: `Tu factura <strong>${invoiceNumber}</strong> por <strong>$${amount.toFixed(2)}</strong> vence el <strong>${dueDate ? dueDate.toLocaleDateString("es-CO") : "N/A"}</strong>. Por favor realiza el pago a tiempo.`,
    },
    DUE_TODAY: {
      subject: `Tu factura vence hoy - ${invoiceNumber}`,
      heading: "Tu factura vence hoy",
      body: `La factura <strong>${invoiceNumber}</strong> por <strong>$${amount.toFixed(2)}</strong> vence hoy. Realiza el pago para evitar cargos adicionales.`,
    },
    EXPIRED: {
      subject: `Factura vencida - ${invoiceNumber}`,
      heading: "Factura vencida",
      body: `La factura <strong>${invoiceNumber}</strong> por <strong>$${amount.toFixed(2)}</strong> está vencida. Por favor comunícate con nosotros para regularizar tu cuenta.`,
    },
  };

  const labels = typeLabels[type] ?? {
    subject: `Aviso de factura - ${invoiceNumber}`,
    heading: "Aviso de factura",
    body: `Tienes una factura pendiente <strong>${invoiceNumber}</strong> por <strong>$${amount.toFixed(2)}</strong>.`,
  };

  await createTransport().sendMail({
    from: FROM,
    to,
    subject: `[${tenantName}] ${labels.subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1a1a1a;">${labels.heading}</h1>
        <p style="color: #444; font-size: 16px;">${labels.body}</p>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          Si ya realizaste el pago, por favor ignora este mensaje.
        </p>
      </div>
    `,
  });
}
