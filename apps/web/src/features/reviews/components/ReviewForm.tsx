"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RequiredLabelIcon } from "@/components/RequiredLabelIcon";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/hooks/use-toast";
import { reviewSchema } from "../schemas/reviews";
import { createReview, updateReview } from "../actions/reviews";
import { StarRatingInput } from "./StarRatingInput";

export function ReviewForm({
  courseId,
  review,
  onSuccess,
}: {
  courseId: string;
  review?: { id: string; rating: number; content: string | null };
  onSuccess?: () => void;
}) {
  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: review
      ? { rating: review.rating, content: review.content ?? "" }
      : { rating: 0, content: "" },
  });

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    const action =
      review == null
        ? createReview.bind(null, courseId)
        : updateReview.bind(null, review.id);
    const data = await action(values);
    actionToast({ actionData: data });
    if (!data.error) onSuccess?.();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabelIcon />
                Your rating
              </FormLabel>
              <FormControl>
                <StarRatingInput
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your review</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="What did you think of this course?"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="self-end">
          <Button disabled={form.formState.isSubmitting} type="submit">
            {review == null ? "Submit review" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
