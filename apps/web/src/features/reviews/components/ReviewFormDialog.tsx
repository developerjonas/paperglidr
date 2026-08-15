"use client";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import { useState, ReactNode } from "react";
import { ReviewForm } from "./ReviewForm";

export function ReviewFormDialog({
  courseId,
  review,
  children,
}: {
  courseId: string;
  review?: { id: string; rating: number; content: string | null };
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {review == null ? "Write a review" : "Edit your review"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ReviewForm
            courseId={courseId}
            review={review}
            onSuccess={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
