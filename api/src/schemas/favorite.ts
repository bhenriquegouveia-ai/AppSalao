import { z } from "zod";

export const favoriteBodySchema = z.object({
  device_id: z.string().min(1),
  event_id: z.string().min(1),
});
