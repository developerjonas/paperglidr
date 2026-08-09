import { lessonStatusEnum } from "@/drizzle/schema"
import { z } from "zod"

export const lessonSchema = z.object({
  name: z.string().min(1, "Required"),
  sectionId: z.string().min(1, "Required"),
  status: z.enum(lessonStatusEnum.enumValues),
  description: z
    .string()
    .transform(v => (v === "" ? null : v))
    .nullable(),
})
