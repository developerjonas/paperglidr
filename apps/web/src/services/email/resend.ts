import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export type EmailAttachment = {
  filename: string;
  content: Buffer;
};

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  from: string; // caller-specified — invoices and notifications will want different sender identities (billing@ vs notifications@)
}) {
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments,
  });

  if (error) {
    throw new Error(
      `Resend failed sending "${subject}" to ${to}: ${error.message}`,
    );
  }
}
