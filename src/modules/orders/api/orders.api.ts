import { createOrderHandler } from "@/modules/orders/handlers/create-order.handler";
import { getOrdersHandler } from "@/modules/orders/handlers/get-orders.handler";

export const GET = getOrdersHandler;
export const POST = createOrderHandler;

