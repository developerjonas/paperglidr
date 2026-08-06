"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { instructorSchema, type InstructorFormValues } from "../schemas/instructors";
import { saveInstructorProfile } from "../actions/instructors";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function InstructorForm({
  defaultValues,
}: {
  defaultValues?: Partial<InstructorFormValues>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const form = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      handle: defaultValues?.handle ?? "",
      name: defaultValues?.name ?? "",
      bio: defaultValues?.bio ?? "",
      profileImageUrl: defaultValues?.profileImageUrl ?? "",
    },
  });

  const profileImageUrl = form.watch("profileImageUrl");

  async function onSubmit(values: InstructorFormValues) {
    const res = await saveInstructorProfile(values);
    toast({
      description: res.message,
      variant: res.error ? "destructive" : "default",
    });
    if (!res.error) {
      const redirectTo = searchParams.get("redirect") ?? `/instructors/${values.handle}`;
      router.push(redirectTo);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {profileImageUrl && (
          <Image
            src={profileImageUrl}
            alt="Profile preview"
            className="h-20 w-20 rounded-full object-cover border"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <FormField
          control={form.control}
          name="profileImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile photo URL</FormLabel>
              <FormControl><Input placeholder="https://..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handle</FormLabel>
              <FormControl><Input placeholder="e.g. jonas" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short bio</FormLabel>
              <FormControl><Textarea rows={4} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save profile
        </Button>
      </form>
    </Form>
  );
}
