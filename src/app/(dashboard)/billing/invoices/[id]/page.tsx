"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  payuReferenceCode: string | null;
  pseBank: string | null;
  pseBankUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: string;
  description: string | null;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  plan: { id: string; name: string; price: number; interval: string } | null;
  items: InvoiceItem[];
  payments: PaymentRecord[];
  tenant: { name: string; slug: string; email: string | null; phone: string | null; address: string | null };
}

interface PSEBank {
  pseCode: string;
  description: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: "Pendiente de Pago", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  PAID: { label: "Pagada", color: "bg-green-100 text-green-700", icon: CheckCircle },
  OVERDUE: { label: "Vencida", color: "bg-red-100 text-red-700", icon: XCircle },
  CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Procesando", color: "text-yellow-600" },
  APPROVED: { label: "Aprobado", color: "text-green-600" },
  DECLINED: { label: "Rechazado", color: "text-red-600" },
  EXPIRED: { label: "Expirado", color: "text-gray-500" },
  ERROR: { label: "Error", color: "text-red-600" },
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<PSEBank[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"PSE" | "CREDIT_CARD">("PSE");
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // PSE form
  const [pseForm, setPseForm] = useState({
    fullName: "", document: "", documentType: "CC", email: "", phone: "",
    pseBank: "", personType: "N" as "N" | "J",
  });

  // Credit Card form
  const [ccForm, setCcForm] = useState({
    fullName: "", document: "", documentType: "CC", email: "", phone: "",
    cardNumber: "", cardExpiration: "", cardSecurityCode: "", cardHolderName: "",
    cardBrand: "VISA", installments: 1,
  });

  useEffect(() => {
    fetch(`/api/tenant/invoices/${id}`)
      .then((res) => res.json())
      .then(setInvoice)
      .finally(() => setLoading(false));

    fetch("/api/tenant/payments/banks")
      .then((res) => res.json())
      .then((data) => setBanks(Array.isArray(data) ? data : []));
  }, [id]);

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    setPaymentError("");

    const payerInfo = paymentMethod === "PSE" ? pseForm : ccForm;

    try {
      const res = await fetch("/api/tenant/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          method: paymentMethod,
          payerInfo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || "Error al procesar el pago");
        return;
      }

      // PSE: redirect to bank
      if (data.bankUrl) {
        window.location.href = data.bankUrl;
        return;
      }

      // Credit card: check status
      if (data.status === "APPROVED") {
        // Refresh invoice
        const updated = await fetch(`/api/tenant/invoices/${id}`).then((r) => r.json());
        setInvoice(updated);
      } else if (data.paymentId) {
        // Poll for status
        const updated = await fetch(`/api/tenant/invoices/${id}`).then((r) => r.json());
        setInvoice(updated);
      }
    } catch (error) {
      setPaymentError("Error de conexion. Intenta de nuevo.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return <p className="text-gray-500">Factura no encontrada</p>;
  }

  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const canPay = invoice.status === "PENDING" || invoice.status === "OVERDUE";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/billing" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Volver a Facturacion
      </Link>

      {/* Invoice Header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-gray-400" />
              <h1 className="text-xl font-bold text-gray-900">Factura {invoice.invoiceNumber}</h1>
            </div>
            <p className="text-sm text-gray-500">{invoice.description}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusCfg.color}`}>
            <StatusIcon className="h-4 w-4" />
            {statusCfg.label}
          </span>
        </div>

        {/* Tenant info */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="h-4 w-4" />
          <span>{invoice.tenant.name}</span>
          {invoice.tenant.email && <span className="text-gray-400">| {invoice.tenant.email}</span>}
        </div>

        {/* Invoice Details */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-gray-500">Fecha de emision</dt>
            <dd className="font-medium text-gray-900">{new Date(invoice.createdAt).toLocaleDateString("es-CO")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Fecha de vencimiento</dt>
            <dd className="font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString("es-CO")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Periodo</dt>
            <dd className="font-medium text-gray-900">
              {new Date(invoice.periodStart).toLocaleDateString("es-CO")} - {new Date(invoice.periodEnd).toLocaleDateString("es-CO")}
            </dd>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-4">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="pb-2 text-left font-medium text-gray-500">Concepto</th>
              <th className="pb-2 text-center font-medium text-gray-500">Cant.</th>
              <th className="pb-2 text-right font-medium text-gray-500">Precio</th>
              <th className="pb-2 text-right font-medium text-gray-500">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-gray-900">{item.description}</td>
                <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                <td className="py-2 text-right text-gray-600">${Number(item.unitPrice).toLocaleString("es-CO")}</td>
                <td className="py-2 text-right font-medium text-gray-900">${Number(item.subtotal).toLocaleString("es-CO")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">${Number(invoice.amount).toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">IVA (19%)</span>
            <span className="text-gray-900">${Number(invoice.tax).toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">${Number(invoice.totalAmount).toLocaleString("es-CO")}</span>
          </div>
        </div>

        {/* Paid info */}
        {invoice.paidAt && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Pagada el {new Date(invoice.paidAt).toLocaleDateString("es-CO")}
          </div>
        )}
      </div>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Historial de Pagos</h2>
          <div className="space-y-3">
            {invoice.payments.map((p) => {
              const st = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.PENDING;
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.method === "PSE" ? `PSE - ${p.pseBank || ""}` : "Tarjeta de Credito"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleString("es-CO")}
                      {p.payuReferenceCode && <span className="ml-2">Ref: {p.payuReferenceCode}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${Number(p.amount).toLocaleString("es-CO")}</p>
                    <p className={`text-xs font-medium ${st.color}`}>{st.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Form */}
      {canPay && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Realizar Pago</h2>

          {/* Payment method tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setPaymentMethod("PSE")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                paymentMethod === "PSE" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              PSE (Debito Bancario)
            </button>
            <button
              onClick={() => setPaymentMethod("CREDIT_CARD")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                paymentMethod === "CREDIT_CARD" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tarjeta de Credito
            </button>
          </div>

          {paymentMethod === "PSE" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
                  <input type="text" value={pseForm.fullName} onChange={(e) => setPseForm({ ...pseForm, fullName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={pseForm.email} onChange={(e) => setPseForm({ ...pseForm, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tipo Doc.</label>
                  <select value={pseForm.documentType} onChange={(e) => setPseForm({ ...pseForm, documentType: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PP">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Documento</label>
                  <input type="text" value={pseForm.document} onChange={(e) => setPseForm({ ...pseForm, document: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
                  <input type="text" value={pseForm.phone} onChange={(e) => setPseForm({ ...pseForm, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Banco</label>
                  <select value={pseForm.pseBank} onChange={(e) => setPseForm({ ...pseForm, pseBank: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Seleccionar banco...</option>
                    {banks.map((b) => (
                      <option key={b.pseCode} value={b.pseCode}>{b.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de persona</label>
                  <select value={pseForm.personType} onChange={(e) => setPseForm({ ...pseForm, personType: e.target.value as "N" | "J" })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="N">Natural</option>
                    <option value="J">Juridica</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
                  <input type="text" value={ccForm.fullName} onChange={(e) => setCcForm({ ...ccForm, fullName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={ccForm.email} onChange={(e) => setCcForm({ ...ccForm, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tipo Doc.</label>
                  <select value={ccForm.documentType} onChange={(e) => setCcForm({ ...ccForm, documentType: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="CC">CC</option><option value="CE">CE</option><option value="NIT">NIT</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Documento</label>
                  <input type="text" value={ccForm.document} onChange={(e) => setCcForm({ ...ccForm, document: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
                  <input type="text" value={ccForm.phone} onChange={(e) => setCcForm({ ...ccForm, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Numero de tarjeta</label>
                <input type="text" maxLength={19} value={ccForm.cardNumber} onChange={(e) => setCcForm({ ...ccForm, cardNumber: e.target.value.replace(/\D/g, "") })} placeholder="4111 1111 1111 1111" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Vencimiento</label>
                  <input type="text" placeholder="YYYY/MM" maxLength={7} value={ccForm.cardExpiration} onChange={(e) => setCcForm({ ...ccForm, cardExpiration: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">CVV</label>
                  <input type="password" maxLength={4} value={ccForm.cardSecurityCode} onChange={(e) => setCcForm({ ...ccForm, cardSecurityCode: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cuotas</label>
                  <select value={ccForm.installments} onChange={(e) => setCcForm({ ...ccForm, installments: parseInt(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {[1, 2, 3, 6, 12, 24, 36].map((n) => (
                      <option key={n} value={n}>{n} cuota{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Franquicia</label>
                <select value={ccForm.cardBrand} onChange={(e) => setCcForm({ ...ccForm, cardBrand: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">American Express</option>
                  <option value="DINERS">Diners Club</option>
                </select>
              </div>
            </div>
          )}

          {paymentError && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {paymentError}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={paying}
            className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pagar ${Number(invoice.totalAmount).toLocaleString("es-CO")} COP
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Pago procesado de forma segura por PayU Latam
          </p>
        </div>
      )}
    </div>
  );
}
