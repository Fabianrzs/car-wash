import { z } from "zod";

export const onboardingKeyParamsSchema = z.object({
  key: z.string().trim().min(1),
});

