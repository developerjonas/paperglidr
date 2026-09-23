import { Resend } from "resend";

// Created on first send, not at module load — `next build` imports this
// module while collecting page data, and must not require RESEND_API_KEY.
let resend: Resend | null = null;

function getResend() {
  resend ??= new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

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
  const { error } = await getResend().emails.send({
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
