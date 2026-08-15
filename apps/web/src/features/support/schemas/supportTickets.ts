// Destination: apps/web/src/features/support/schemas/supportTickets.ts

import { z } from "zod";
import { supportTicketCategories } from "@/drizzle/schema";

export const newTicketSchema = z.object({
  subject: z.string().min(3, "Subject is too short").max(150),
  category: z.enum(supportTicketCategories),
  message: z.string().min(10, "Please give a bit more detail").max(5000),
});

export const replySchema = z.object({
  content: z.string().min(1, "Message can't be empty").max(5000),
});
