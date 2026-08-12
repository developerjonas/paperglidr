"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  requestOtpSchema,
  verifyOtpSchema,
  type RequestOtpValues,
  type VerifyOtpValues,
} from "../schemas/phoneOtp"
import {
  requestInstructorPhoneOtp,
  verifyInstructorPhoneOtp,
} from "../actions/phoneOtp"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon } from "lucide-react"

export function PhoneVerificationForm({
  phoneVerifiedAt,
}: {
  phoneVerifiedAt: Date | null
}) {
  const [step, setStep] = useState<"request" | "verify">("request")
  const [pendingNumber, setPendingNumber] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const requestForm = useForm<RequestOtpValues>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { phoneNumber: "+977" },
  })

  const verifyForm = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  })

  async function onRequestSubmit(values: RequestOtpValues) {
    const res = await requestInstructorPhoneOtp(values)
    toast({ description: res.message, variant: res.error ? "destructive" : "default" })
    if (!res.error) {
      setPendingNumber(values.phoneNumber)
      setStep("verify")
    }
  }

  async function onVerifySubmit(values: VerifyOtpValues) {
    const res = await verifyInstructorPhoneOtp(values)
    toast({ description: res.message, variant: res.error ? "destructive" : "default" })
    if (!res.error) {
      router.refresh()
    }
  }

  async function handleResend() {
    const res = await requestInstructorPhoneOtp({ phoneNumber: pendingNumber })
    toast({ description: res.message, variant: res.error ? "destructive" : "default" })
  }

  if (phoneVerifiedAt != null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2Icon className="size-4 text-green-600" />
        Phone verified
      </div>
    )
  }

  if (step === "request") {
    return (
      <Form {...requestForm}>
        <form
          onSubmit={requestForm.handleSubmit(onRequestSubmit)}
          className="space-y-4"
        >
          <FormField
            control={requestForm.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input placeholder="+977XXXXXXXXXX" {...field} />
                </FormControl>
                <FormDescription>
                  You&apos;ll need to verify this number before you can publish courses.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={requestForm.formState.isSubmitting}>
            {requestForm.formState.isSubmitting ? "Sending..." : "Send code"}
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <Form {...verifyForm}>
      <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Code sent to {pendingNumber}.
        </p>
        <FormField
          control={verifyForm.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification code</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={verifyForm.formState.isSubmitting}>
            {verifyForm.formState.isSubmitting ? "Verifying..." : "Verify"}
          </Button>
          <Button type="button" variant="outline" onClick={handleResend}>
            Resend code
          </Button>
        </div>
      </form>
    </Form>
  )
}
