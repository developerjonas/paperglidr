"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { applyDiscountCode } from "../actions/discounts";

export function PromoCodeInput({
  productId,
  priceInRupees,
  onApplied,
}: {
  productId: string;
  priceInRupees: number;
  onApplied: (result: { amountOffInRupees: number; code: string } | null) => void;
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState<{ code: string; amountOffInRupees: number } | null>(
    null,
  );
  const { toast } = useToast();

  async function handleApply() {
    if (!code.trim()) return;
    setSubmitting(true);
    const result = await applyDiscountCode({ code: code.trim(), productId, priceInRupees });
    setSubmitting(false);

    if (result.error) {
      toast({ title: result.message, variant: "destructive" });
      return;
    }

    const appliedCode = { code: code.trim().toUpperCase(), amountOffInRupees: result.amountOffInRupees };
    setApplied(appliedCode);
    onApplied(appliedCode);
    toast({ title: `Code applied — ₹${result.amountOffInRupees} off` });
  }

  function handleRemove() {
    setApplied(null);
    setCode("");
    onApplied(null);
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <span>
          <strong>{applied.code}</strong> applied — ₹{applied.amountOffInRupees} off
        </span>
        <Button variant="ghost" size="sm" onClick={handleRemove}>
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Promo code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={submitting}
      />
      <Button onClick={handleApply} disabled={submitting || !code.trim()} variant="outline">
        {submitting ? "Checking..." : "Apply"}
      </Button>
    </div>
  );
}
