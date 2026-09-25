// Destination: apps/web/src/app/(consumer)/support/new/page.tsx
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { SupportTicketForm } from "@/features/support/components/SupportTicketForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewSupportTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ purchaseId?: string; topic?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser.userId == null) redirect("/sign-in");

  // Prefill from the payment-failure page's "I was charged" link. Only a
  // well-formed purchase id is echoed back into the form.
  const { purchaseId, topic } = await searchParams;
  const reference = z.string().uuid().safeParse(purchaseId).success ? purchaseId : null;
  const defaultValues =
    reference != null
      ? {
          subject: `Charged but no access — purchase ${reference}`,
          category: "billing" as const,
          message: `I was charged for purchase ${reference} but didn't get access.\n\nPayment method (eSewa / Khalti / Fonepay):\nTime of payment:\nTransaction ID from the app, if any:\n`,
        }
      : topic === "billing"
        ? { subject: "", category: "billing" as const, message: "" }
        : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            New Support Ticket
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-xl">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Describe your issue</CardTitle>
              <CardDescription>
                Tell us what&apos;s going on and we&apos;ll get back to you as
                soon as we can.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupportTicketForm defaultValues={defaultValues} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
