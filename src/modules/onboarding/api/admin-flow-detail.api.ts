import {
  deleteFlowHandler,
  getFlowByIdHandler,
  updateFlowHandler,
} from "@/modules/onboarding/handlers/admin-flow-detail.handler";

export const GET = getFlowByIdHandler;
export const PUT = updateFlowHandler;
export const DELETE = deleteFlowHandler;




