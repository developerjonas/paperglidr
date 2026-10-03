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
import { ImageUploadField } from "@/features/images/components/ImageUploadField";
import { safeRedirectPath } from "@/lib/safeRedirect";
import Link from "next/link";

export function InstructorForm({
  defaultValues,
  mustAcceptTerms,
}: {
  defaultValues?: Partial<InstructorFormValues>;
  /** Show the Creator Terms checkbox (not yet accepted, or a new version). */
  mustAcceptTerms: boolean;
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
      acceptCreatorTerms: false,
    },
  });

  async function onSubmit(values: InstructorFormValues) {
    const res = await saveInstructorProfile(values);
    toast({
      description: res.message,
      variant: res.error ? "destructive" : "default",
    });
    if (!res.error) {
      const redirectTo = safeRedirectPath(
        searchParams.get("redirect"),
        `/instructors/${values.handle}`,
      );
      router.push(redirectTo);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="profileImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile photo</FormLabel>
              <FormControl>
                <ImageUploadField
                  purpose="instructor"
                  value={field.value}
                  onChange={field.onChange}
                  previewClassName="aspect-square w-20 rounded-full"
                />
              </FormControl>
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
        {mustAcceptTerms && (
          <FormField
            control={form.control}
            name="acceptCreatorTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value === true}
                      onChange={(event) => field.onChange(event.target.checked)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal leading-relaxed">
                    I agree to the{" "}
                    <Link href="/creator-terms" target="_blank" className="text-primary underline-offset-4 hover:underline">
                      Creator Terms
                    </Link>{" "}
                    and confirm I own the rights to everything I upload, or have permission to use it.
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || (mustAcceptTerms && form.watch("acceptCreatorTerms") !== true)}
        >
          Save profile
        </Button>
      </form>
    </Form>
  );
}
