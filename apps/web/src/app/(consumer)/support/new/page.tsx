// Destination: apps/web/src/app/(consumer)/support/new/page.tsx

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { SupportTicketForm } from "@/features/support/components/SupportTicketForm";
import { PageHeader } from "@/components/PageHeader";

export default async function NewSupportTicketPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.userId == null) redirect("/sign-in");

  return (
    <div className="container my-6 max-w-xl space-y-6">
      <PageHeader title="New Support Ticket" />
      <SupportTicketForm />
    </div>
  );
}
