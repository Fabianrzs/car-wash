import { format } from "date-fns";
export function buildNextOrderNumber(lastOrderNumber?: string | null): string {
  const datePrefix = format(new Date(), "yyyyMMdd");
  const prefix = `ORD-${datePrefix}-`;

  let sequence = 1;
  if (lastOrderNumber) {
    const lastSeq = parseInt(lastOrderNumber.split("-").pop() ?? "0", 10);
    if (!isNaN(lastSeq) && lastSeq > 0) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(3, "0")}`;
}
