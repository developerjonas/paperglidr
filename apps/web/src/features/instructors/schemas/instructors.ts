import { z } from "zod";

export const instructorSchema = z.object({
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  name: z.string().min(2, "Name is required").max(80),
  bio: z.string().min(20, "Tell learners a bit more about you").max(500),
  profileImageUrl: z.string().url("Enter a valid image URL"),
});

export type InstructorFormValues = z.infer<typeof instructorSchema>;
