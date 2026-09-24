"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { actionToast } from "@/hooks/use-toast";
import { requestRefund } from "../actions/refunds";

function formatTimeRemaining(ms: number) {
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return days > 0 ? `${days}d ${remHours}h left` : `${remHours}h left`;
}

/**
 * Rendered by the purchase page only when the server says the purchase is
 * eligible. requestRefund re-checks everything server-side.
 */
export function RefundRequestButton({
  purchaseId,
  msRemaining,
  completionPercent,
}: {
  purchaseId: string;
  msRemaining: number;
  completionPercent: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  async function handleRequest() {
    setSubmitting(true);
    const result = await requestRefund(purchaseId, reason);
    setSubmitting(false);
    actionToast({ actionData: result });
    if (!result.error) setRequested(true);
  }

  if (requested) {
    return (
      <p className="text-sm text-muted-foreground">
        Refund request submitted. We&apos;ll email you when it has been reviewed.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {open ? (
        <>
          <Textarea
            placeholder="Why are you asking for a refund? (optional)"
            value={reason}
            maxLength={2000}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
          />
          <div className="flex gap-2">
            <Button onClick={handleRequest} disabled={submitting} variant="destructive">
              {submitting ? "Requesting…" : "Confirm refund request"}
            </Button>
            <Button onClick={() => setOpen(false)} disabled={submitting} variant="outline">
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
          Request refund
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {formatTimeRemaining(msRemaining)} in the refund window ·{" "}
        {completionPercent}% complete
      </p>
    </div>
  );
}
