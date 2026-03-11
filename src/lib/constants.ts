export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-amber-50 text-amber-700 ring-amber-600/20",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-600/20",
  COMPLETED:   "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED:   "bg-slate-100 text-slate-500 ring-slate-400/20",
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN:      "Sedán",
  SUV:        "Camioneta",
  TRUCK:      "Camión",
  MOTORCYCLE: "Motocicleta",
  VAN:        "Van",
  OTHER:      "Otro",
};

export const ITEMS_PER_PAGE = 10;
