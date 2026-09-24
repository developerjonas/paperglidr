"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { actionToast } from "@/hooks/use-toast"
import { requestPayout } from "../actions/payouts"
import { payoutRequestSchema } from "../schemas/payouts"

type FormValues = z.input<typeof payoutRequestSchema>

const METHOD_LABELS = { bank: "Bank transfer", esewa: "eSewa", khalti: "Khalti" } as const

export function PayoutRequestForm({
  availableBalanceInRupees,
  heldBalanceInRupees,
  holdDays,
  minimumPayout,
}: {
  availableBalanceInRupees: number
  heldBalanceInRupees: number
  holdDays: number
  minimumPayout: string
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(payoutRequestSchema),
    defaultValues: {
      amountInRupees: 0,
      details: { method: "bank", bankName: "", accountName: "", accountNumber: "", branch: "" },
    },
  })
  const method = form.watch("details.method")

  async function onSubmit(values: FormValues) {
    const data = await requestPayout(values)
    actionToast({ actionData: data })
    if (!data.error) form.reset()
  }

  const textField = (name: string, label: string, placeholder?: string) => (
    <FormField
      key={name}
      control={form.control}
      name={name as "details.accountName"}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Available to withdraw: <strong>NPR {availableBalanceInRupees.toFixed(2)}</strong>
          </p>
          <p>
            On hold: NPR {heldBalanceInRupees.toFixed(2)}. Earnings from a sale
            become available {holdDays} days after the purchase, when its
            refund window closes. Minimum payout: {minimumPayout}.
          </p>
        </div>
        <FormField
          control={form.control}
          name="amountInRupees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (NPR)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value as number}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="details.method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pay me by</FormLabel>
              <Select
                value={field.value}
                onValueChange={value => {
                  const accountName = form.getValues("details.accountName")
                  form.setValue(
                    "details",
                    value === "bank"
                      ? { method: "bank", bankName: "", accountName, accountNumber: "", branch: "" }
                      : { method: value as "esewa" | "khalti", walletId: "", accountName },
                  )
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {method === "bank"
          ? [
              textField("details.bankName", "Bank name"),
              textField("details.branch", "Branch"),
              textField("details.accountName", "Account holder name"),
              textField("details.accountNumber", "Account number"),
            ]
          : [
              textField("details.walletId", `${METHOD_LABELS[method]} ID (mobile number)`, "98XXXXXXXX"),
              textField("details.accountName", "Name on the wallet"),
            ]}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Request Payout
        </Button>
      </form>
    </Form>
  )
}
