"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RequiredLabelIcon } from "@/components/RequiredLabelIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/hooks/use-toast";
import { discountCodeSchema } from "../schemas/discounts";
import { discountTypes, discountScopes } from "@/drizzle/schema/discountCode";
import {
  createDiscountCode,
  updateDiscountCodeAction,
} from "../actions/discounts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DiscountCodeForm({
  discountCode,
  products,
  presetProductId,
}: {
  discountCode?: {
    id: string;
    code: string;
    scopeType: (typeof discountScopes)[number];
    productId: string | null;
    discountType: (typeof discountTypes)[number];
    amount: number;
    maxRedemptions: number | null;
    maxRedemptionsPerUser: number;
    expiresAt: Date | null;
  };
  products: { id: string; name: string }[];
  presetProductId?: string;
}) {
  const form = useForm<z.infer<typeof discountCodeSchema>>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues: discountCode ?? {
      code: "",
      scopeType: presetProductId ? "product" : "storewide",
      productId: presetProductId ?? null,
      discountType: "percentage",
      amount: 10,
      maxRedemptions: null,
      maxRedemptionsPerUser: 1,
      expiresAt: null,
    },
  });

  const scopeType = form.watch("scopeType");
  const discountType = form.watch("discountType");

  async function onSubmit(values: z.infer<typeof discountCodeSchema>) {
    const action =
      discountCode == null
        ? createDiscountCode
        : updateDiscountCodeAction.bind(null, discountCode.id);
    const data = await action(values);
    actionToast({ actionData: data });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col"
      >
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Code
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="SUMMER25"
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Discount type
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {discountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "percentage" ? "Percentage" : "Fixed amount"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  {discountType === "percentage" ? "Percent off" : "Rupees off"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    step={1}
                    min={1}
                    max={discountType === "percentage" ? 100 : undefined}
                    onChange={(e) =>
                      field.onChange(
                        isNaN(e.target.valueAsNumber)
                          ? ""
                          : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scopeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applies to</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "storewide") form.setValue("productId", null);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="storewide">All my products</SelectItem>
                    <SelectItem value="product">One product</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {scopeType === "product" && (
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <RequiredLabelIcon />
                    Product
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="maxRedemptions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total use limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={1}
                    min={1}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormDescription>Leave blank for unlimited.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxRedemptionsPerUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Uses per customer
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    step={1}
                    min={1}
                    onChange={(e) =>
                      field.onChange(
                        isNaN(e.target.valueAsNumber)
                          ? ""
                          : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expires</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value ? field.value.toISOString().slice(0, 10) : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : new Date(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>Leave blank to never expire.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="self-end">
          <Button disabled={form.formState.isSubmitting} type="submit">
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
