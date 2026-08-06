import Image from "next/image";

export function InstructorProfileCard({
  instructor,
}: {
  instructor: { name: string; bio: string; profileImageUrl: string; handle: string };
}) {
  return (
    <div className="flex items-start gap-6">
      <Image
        src={instructor.profileImageUrl}
        alt={instructor.name}
        className="h-24 w-24 rounded-full object-cover border"
      />
      <div>
        <h1 className="text-2xl font-semibold">{instructor.name}</h1>
        <p className="text-muted-foreground">@{instructor.handle}</p>
        <p className="mt-3 max-w-prose">{instructor.bio}</p>
      </div>
    </div>
  );
}
