import {
  createAdminPlanHandler,
  getAdminPlansHandler,
} from "@/modules/plans/handlers/admin-plans.handler";

export const GET = getAdminPlansHandler;
export const POST = createAdminPlanHandler;

