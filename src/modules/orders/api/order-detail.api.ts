import { getOrderByIdHandler } from "@/modules/orders/handlers/get-order-by-id.handler";
import { updateOrderNotesHandler } from "@/modules/orders/handlers/update-order-notes.handler";

export const GET = getOrderByIdHandler;
export const PUT = updateOrderNotesHandler;

