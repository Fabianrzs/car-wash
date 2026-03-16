import {
  createFlowHandler,
  getFlowsHandler,
} from "@/modules/onboarding/handlers/admin-flows.handler";

export const GET = getFlowsHandler;
export const POST = createFlowHandler;


