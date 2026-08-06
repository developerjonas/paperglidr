"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { actionToast } from "@/hooks/use-toast"
import { requestPayout } from "../actions/payouts"

const formSchema = z.object({
  amountInRupees: z.coerce.number().positive("Enter an amount greater than 0"),
  bankDetailsSnapshot: z.string().min(1, "Required"),
})

export function PayoutRequestForm({ availableBalanceInRupees }: { availableBalanceInRupees: number }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amountInRupees: 0, bankDetailsSnapshot: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = await requestPayout(values)
    actionToast({ actionData: data })
    if (!data.error) form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Available balance: NPR {availableBalanceInRupees.toFixed(2)}
        </p>
        <FormField
          control={form.control}
          name="amountInRupees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (NPR)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bankDetailsSnapshot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Details</FormLabel>
              <FormControl>
                <Textarea placeholder="Bank name, account number, account holder name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Request Payout
        </Button>
      </form>
    </Form>
  )
}
