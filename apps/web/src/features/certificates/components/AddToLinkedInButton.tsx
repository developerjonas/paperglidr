export function AddToLinkedInButton({
  certificateCode,
  courseTitle,
  issuedAt,
}: {
  certificateCode: string;
  courseTitle: string;
  issuedAt: Date;
}) {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: courseTitle,
    organizationName: "PaperGlidr",
    issueYear: String(issuedAt.getFullYear()),
    issueMonth: String(issuedAt.getMonth() + 1),
    certUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateCode}`,
    certId: certificateCode,
  });

  return (
    <a
      href={`https://www.linkedin.com/profile/add?${params.toString()}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-[5px] bg-[#0A66C2] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0958A8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2]"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4 shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
      Add to LinkedIn profile
    </a>
  );
}
