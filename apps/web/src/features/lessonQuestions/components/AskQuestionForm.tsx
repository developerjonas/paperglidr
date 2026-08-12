"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { askQuestionSchema } from "@/features/lessonQuestions/schemas/lessonQuestions";
import { askLessonQuestion } from "@/features/lessonQuestions/actions/lessonQuestions";
import { z } from "zod";

// ADJUST: I don't have DiscountCodeForm.tsx/ProductForm.tsx's real submit
// pattern in this conversation. This assumes handleSubmit calls the server
// action directly and reads back { error, message } — matching the action
// contract documented in the handoff — rather than using ActionButton,
// since ActionButton's only confirmed usage in this session is bare
// action-bound buttons (mark complete / prev-next), not form submission.
// If DiscountCodeForm does something different, copy that instead.

const askBodySchema = askQuestionSchema.pick({ body: true });
type FormValues = z.infer<typeof askBodySchema>;

export function AskQuestionForm({ lessonId }: { lessonId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(askBodySchema),
    defaultValues: { body: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const result = await askLessonQuestion(lessonId, values);
    setIsSubmitting(false);

    if (result.error) {
      toast({ variant: "destructive", description: result.message });
      return;
    }

    toast({ description: result.message });
    form.reset();
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Ask a question about this lesson..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="self-end">
          {isSubmitting ? "Posting..." : "Ask question"}
        </Button>
      </form>
    </Form>
  );
}
