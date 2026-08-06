export function AddToLinkedInButton({
  certificateCode,
  courseTitle,
  issuedAt,
}: {
  certificateCode: string
  courseTitle: string
  issuedAt: Date
}) {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: courseTitle,
    organizationName: "Your Platform Name", // TODO: swap in your real brand name
    issueYear: String(issuedAt.getFullYear()),
    issueMonth: String(issuedAt.getMonth() + 1),
    certUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateCode}`,
    certId: certificateCode,
  })
  return (
    <a
      href={`https://www.linkedin.com/profile/add?${params.toString()}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm underline text-muted-foreground self-center"
    >
      Add to LinkedIn profile
    </a>
  )
}
