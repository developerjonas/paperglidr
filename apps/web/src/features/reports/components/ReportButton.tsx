"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { reportCourse } from "../actions/reports";
import { reportReasons } from "@/drizzle/schema/report";

const REASON_LABELS: Record<(typeof reportReasons)[number], string> = {
  scam: "Scam / not as described",
  piracy: "Pirated / stolen content",
  misleading: "Misleading claims",
  inappropriate: "Inappropriate content",
  other: "Other",
};

export function ReportButton({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit() {
    if (!reason) {
      toast({ title: "Please choose a reason", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const result = await reportCourse({
      courseId,
      reason: reason as (typeof reportReasons)[number],
      details: details || undefined,
    });
    setSubmitting(false);

    if (result?.error) {
      toast({ title: result.error, variant: "destructive" });
      return;
    }

    toast({ title: "Thanks — we'll take a look at this." });
    setOpen(false);
    setReason("");
    setDetails("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Report course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this course</DialogTitle>
        </DialogHeader>

        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Why are you reporting this course?" />
          </SelectTrigger>
          <SelectContent>
            {reportReasons.map((r) => (
              <SelectItem key={r} value={r}>
                {REASON_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Any additional details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />

        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit report"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
