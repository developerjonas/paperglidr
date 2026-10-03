import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { FoundingBadge } from "./FoundingBadge";

export function InstructorProfileCard({
  instructor,
}: {
  instructor: { name: string; bio: string; profileImageUrl: string; handle: string; isVerified?: boolean; isFounding?: boolean };
}) {
  return (
    <div className="flex items-start gap-6">
      <Image
        src={instructor.profileImageUrl}
        alt={instructor.name}
        className="h-24 w-24 rounded-full object-cover border"
      />
      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold">
          {instructor.name}
          {instructor.isVerified && <BadgeCheck className="h-5 w-5 text-primary" aria-label="Verified instructor" />}
          {instructor.isFounding && <FoundingBadge />}
        </h1>
        <p className="text-muted-foreground">@{instructor.handle}</p>
        <p className="mt-3 max-w-prose">{instructor.bio}</p>
      </div>
    </div>
  );
}
