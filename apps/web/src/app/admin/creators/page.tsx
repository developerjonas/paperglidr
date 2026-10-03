import Link from "next/link"
import { and, asc, count, desc, eq } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { AdminSwitch } from "@/components/admin/AdminSwitch"
import { db } from "@/drizzle/db"
import { InstructorTable, ProductTable, UserTable } from "@/drizzle/schema"
import { setCreatorFlag } from "@/features/instructors/actions/adminCreators"
import { CREATOR_TERMS_VERSION } from "@/config/company"
import { requireAdmin } from "@/services/auth"

const day = (date: Date | null) => (date ? new Date(date).toLocaleDateString() : null)

/**
 * Every creator, with the switches only an admin sets: Verified (the
 * tick next to their name) and Founding creator (badge; they're listed
 * first on the home page). Also whether they accepted the Creator Terms.
 */
export default async function AdminCreatorsPage() {
  await requireAdmin()

  const creators = await db
    .select({
      id: InstructorTable.id,
      handle: InstructorTable.handle,
      name: InstructorTable.name,
      email: UserTable.email,
      isVerified: InstructorTable.isVerified,
      isFounding: InstructorTable.isFounding,
      phoneVerifiedAt: InstructorTable.phoneVerifiedAt,
      termsAcceptedAt: InstructorTable.creatorTermsAcceptedAt,
      termsVersion: InstructorTable.creatorTermsVersion,
      createdAt: InstructorTable.createdAt,
      liveProducts: count(ProductTable.id),
    })
    .from(InstructorTable)
    .innerJoin(UserTable, eq(UserTable.id, InstructorTable.userId))
    .leftJoin(ProductTable, and(eq(ProductTable.authorId, InstructorTable.userId), eq(ProductTable.status, "public")))
    .groupBy(InstructorTable.id, UserTable.email)
    .orderBy(desc(InstructorTable.isFounding), desc(count(ProductTable.id)), asc(InstructorTable.name))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Creators" />
      <p className="max-w-3xl text-sm text-muted-foreground">
        <strong>Verified</strong> shows a tick next to the creator&apos;s name. <strong>Founding creator</strong> shows a
        badge on their profile, courses and the home page, where they&apos;re listed first. Changes show on the site
        within seconds.
      </p>

      {creators.length === 0 ? (
        <p className="text-sm text-muted-foreground">No creators yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead>Live courses</TableHead>
              <TableHead>Creator Terms</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Founding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators.map((creator) => (
              <TableRow key={creator.id}>
                <TableCell className="text-sm">
                  <Link href={`/instructors/${creator.handle}`} className="font-medium hover:underline">
                    {creator.name}
                  </Link>{" "}
                  <span className="text-muted-foreground">@{creator.handle}</span>
                  <br />
                  <span className="text-muted-foreground">{creator.email}</span>
                </TableCell>
                <TableCell className="text-sm">{creator.liveProducts}</TableCell>
                <TableCell className="text-sm">
                  {creator.termsAcceptedAt == null ? (
                    <span className="text-destructive">Not accepted</span>
                  ) : (
                    <>
                      {day(creator.termsAcceptedAt)}
                      {creator.termsVersion !== CREATOR_TERMS_VERSION && (
                        <span className="text-muted-foreground"> (older version)</span>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{day(creator.phoneVerifiedAt) ?? "—"}</TableCell>
                <TableCell>
                  <AdminSwitch
                    label={`Verified: ${creator.name}`}
                    checked={creator.isVerified}
                    onChangeAction={setCreatorFlag.bind(null, creator.id, "isVerified")}
                  />
                </TableCell>
                <TableCell>
                  <AdminSwitch
                    label={`Founding creator: ${creator.name}`}
                    checked={creator.isFounding}
                    onChangeAction={setCreatorFlag.bind(null, creator.id, "isFounding")}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
