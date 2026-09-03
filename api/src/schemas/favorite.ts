import { z } from "zod";

export const favoriteBodySchema = z.object({
  event_id: z.string().min(1),
});
