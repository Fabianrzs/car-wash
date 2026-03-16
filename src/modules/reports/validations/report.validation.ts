import { z } from "zod";

const PERIOD_VALUES = ["daily", "weekly", "monthly"] as const;
const ORDER_STATUS_VALUES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const dateValue = z.string().trim().datetime().optional();

export const reportQuerySchema = z.object({
  period: z.enum(PERIOD_VALUES).default("daily"),
  startDate: dateValue,
  endDate: dateValue,
});

export const orderReportQuerySchema = z.object({
  period: z.enum(PERIOD_VALUES).default("monthly"),
  startDate: dateValue,
  endDate: dateValue,
  status: z.enum(ORDER_STATUS_VALUES).optional(),
  search: z.string().trim().default(""),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type OrderReportQuery = z.infer<typeof orderReportQuerySchema>;

