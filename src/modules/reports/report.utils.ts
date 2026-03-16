interface DateRangeInput {
  period: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
}

interface CompletedOrderAmount {
  totalAmount: unknown;
  createdAt: Date;
}

interface ReportOrder {
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalAmount: unknown;
}

export function resolveDateRange({ period, startDate, endDate }: DateRangeInput) {
  const now = new Date();

  if (startDate && endDate) {
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);
    return { startDate: rangeStart, endDate: rangeEnd };
  }

  const rangeEnd = new Date(now);
  rangeEnd.setHours(23, 59, 59, 999);

  const rangeStart = new Date(now);
  if (period === "weekly") {
    rangeStart.setDate(rangeStart.getDate() - 7);
  } else if (period === "monthly") {
    rangeStart.setMonth(rangeStart.getMonth() - 1);
  }
  rangeStart.setHours(0, 0, 0, 0);

  return { startDate: rangeStart, endDate: rangeEnd };
}

export function summarizeOrdersForExport(orders: ReportOrder[]) {
  const completedOrders = orders.filter((order) => order.status === "COMPLETED");
  const totalIncome = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const averageOrderValue = completedOrders.length > 0 ? totalIncome / completedOrders.length : 0;

  return {
    totalIncome: roundMoney(totalIncome),
    orderCount: orders.length,
    completedOrders: completedOrders.length,
    averageOrderValue: roundMoney(averageOrderValue),
  };
}

export function buildDailyBreakdown(orders: CompletedOrderAmount[]) {
  const dailyMap = new Map<string, { date: string; income: number; orders: number }>();

  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split("T")[0];
    const currentDay = dailyMap.get(dateKey) || { date: dateKey, income: 0, orders: 0 };
    currentDay.income += Number(order.totalAmount);
    currentDay.orders += 1;
    dailyMap.set(dateKey, currentDay);
  }

  return Array.from(dailyMap.values());
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

