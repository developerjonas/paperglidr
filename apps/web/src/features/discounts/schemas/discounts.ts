import { z } from "zod";
import { discountTypes, discountScopes } from "@/drizzle/schema/discountCode";

export const discountCodeSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, - or _ only")
      .transform((v) => v.toUpperCase()),
    scopeType: z.enum(discountScopes),
    productId: z.string().uuid().nullable(),
    discountType: z.enum(discountTypes),
    amount: z.number().int().positive(),
    maxRedemptions: z.number().int().positive().nullable(),
    maxRedemptionsPerUser: z.number().int().positive().default(1),
    expiresAt: z.date().nullable(),
  })
  .refine(
    (d) => (d.scopeType === "product" ? d.productId != null : d.productId == null),
    {
      message:
        "productId is required when scope is 'product' and must be empty for 'storewide'",
      path: ["productId"],
    },
  )
  .refine((d) => d.discountType !== "percentage" || d.amount <= 100, {
    message: "Percentage discounts must be 100 or less",
    path: ["amount"],
  });

export type DiscountCodeFormValues = z.infer<typeof discountCodeSchema>;
