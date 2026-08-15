// Destination: apps/web/src/features/support/components/SupportTicketForm.tsx
// Follows the same react-hook-form + zodResolver + shadcn Form pattern
// your CategoryForm/InstructorForm use — adjust the form field wiring
// if your actual form.tsx wrapper differs.

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { newTicketSchema } from "../schemas/supportTickets";
import { createSupportTicket } from "../actions/supportTickets";
import { supportTicketCategories } from "@/drizzle/schema";

const categoryLabels: Record<(typeof supportTicketCategories)[number], string> =
  {
    account: "Account",
    billing: "Billing & Payments",
    technical: "Technical Issue",
    instructor: "Instructor / Teaching",
    other: "Other",
  };

export function SupportTicketForm() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof newTicketSchema>>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: { subject: "", category: "other", message: "" },
  });

  async function onSubmit(data: z.infer<typeof newTicketSchema>) {
    const result = await createSupportTicket(data);
    if (result.error) {
      toast({ variant: "destructive", description: result.message });
      return;
    }
    toast({ description: result.message });
    router.push(`/support/${result.ticketId}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Briefly describe the issue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {supportTicketCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabels[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="What's going on? Include as much detail as you can."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Submit Ticket"}
        </Button>
      </form>
    </Form>
  );
}
