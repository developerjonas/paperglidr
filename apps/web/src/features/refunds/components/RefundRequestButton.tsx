"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  checkMyRefundEligibility,
  requestRefund,
} from "../actions/refunds";

function formatTimeRemaining(ms: number) {
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return days > 0 ? `${days}d ${remHours}h left` : `${remHours}h left`;
}

export function RefundRequestButton({ purchaseId }: { purchaseId: string }) {
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [completionPercent, setCompletionPercent] = useState<number | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkMyRefundEligibility(purchaseId).then((result) => {
      if ("eligibility" in result && result.eligibility) {
        setEligible(result.eligibility.eligible);
        setMsRemaining(result.eligibility.msRemaining);
        setCompletionPercent(result.eligibility.completionPercent);
      }
    });
  }, [purchaseId]);

  async function handleRequest() {
    setSubmitting(true);
    const result = await requestRefund(purchaseId);
    setSubmitting(false);

    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
      return;
    }

    setRequested(true);
    toast({ title: "Refund request submitted." });
  }

  if (eligible === null) return null; // still loading
  if (requested) return <p className="text-sm text-muted-foreground">Refund request submitted — we&apos;ll follow up by email.</p>;
  if (!eligible) return null; // don't show the button at all once ineligible

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={handleRequest} disabled={submitting} variant="outline">
        {submitting ? "Requesting..." : "Request refund"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {formatTimeRemaining(msRemaining ?? 0)} in the refund window ·{" "}
        {completionPercent}% complete
      </p>
    </div>
  );
}
