// Free-tier video report — read-only, changes nothing.
//
// Free-tier lessons (previews, and every lesson of a course in a public
// product priced at 0) must use a YouTube or Vimeo link for their video;
// Chiyali-hosted video (R2 MP4, Bunny) is for paid lessons only. The app
// enforces this on every write since the free-tier change, but rows from
// before it may break the rule. This lists them so creators can be asked
// to fix them:
//
//   1. Free-tier lessons with hosted video — no longer delivered; the
//      lesson shows no video until the creator adds a link.
//   2. Paid lessons with a YouTube/Vimeo link — no longer delivered; the
//      creator needs to upload an MP4 (or make the lesson a preview).
//   3. Embeds whose stored ID doesn't validate against @repo/video-embeds.
//
// It never deletes or edits anything, and there is no "apply" mode on
// purpose: every fix is the creator's choice (which video to use), and
// hosted files are only removed through the normal asset deletion path.
// It runs inside a READ ONLY transaction.
//
// Usage (from apps/web, with the same DB_* env as the app, or DATABASE_URL):
//   pnpm report:free-tier-video           # human-readable
//   pnpm report:free-tier-video --json    # machine-readable
import pg from "pg"
import { EMBED_PROVIDER_NAMES, fromStoredEmbed } from "@repo/video-embeds"

type Row = {
  assetId: string
  provider: string
  type: string
  externalId: string | null
  fileName: string | null
  assetStatus: string
  lessonId: string
  lessonName: string
  lessonStatus: string
  courseId: string
  courseName: string
  authorEmail: string | null
  freeCourse: boolean
}

const json = process.argv.includes("--json")

const client = new pg.Client(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === "false" || !process.env.DB_SSL ? false : { rejectUnauthorized: false },
      },
)

// Same definitions as features/lessons/lib/freeTier.ts.
const SQL = `
  with free_courses as (
    select distinct cp."courseId"
    from course_products cp
    join products p on p.id = cp."productId"
    where p.status = 'public' and p."priceInRupees" = 0
  )
  select a.id as "assetId", a.provider::text as provider, a.type::text as type, a."externalId",
         a."fileName", a.status::text as "assetStatus",
         l.id as "lessonId", l.name as "lessonName", l.status::text as "lessonStatus",
         c.id as "courseId", c.name as "courseName", u.email as "authorEmail",
         (fc."courseId" is not null) as "freeCourse"
  from lesson_assets a
  join lessons l on l.id = a."lessonId"
  join course_sections s on s.id = l."sectionId"
  join courses c on c.id = s."courseId"
  left join "user" u on u.id = c.author_id
  left join free_courses fc on fc."courseId" = c.id
  where a.provider = 'bunny'
     or (a.provider = 'r2' and a.type = 'video_file')
     or a.provider::text = any($1)
  order by c.name, l.name`

async function main() {
  await client.connect()
  await client.query("begin transaction read only")
  const { rows } = await client.query<Row>(SQL, [EMBED_PROVIDER_NAMES])
  await client.query("rollback")
  await client.end()

  const isEmbed = (r: Row) => (EMBED_PROVIDER_NAMES as string[]).includes(r.provider)
  const freeTier = (r: Row) => r.lessonStatus === "preview" || r.freeCourse
  const report = {
    hostedVideoOnFreeTier: rows.filter(r => !isEmbed(r) && freeTier(r)),
    embedOnPaidLesson: rows.filter(r => isEmbed(r) && !freeTier(r)),
    invalidEmbed: rows.filter(r => isEmbed(r) && fromStoredEmbed(r) == null),
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const why = (r: Row) =>
    [r.lessonStatus === "preview" && "preview", r.freeCourse && "free course"].filter(Boolean).join(", ") || "paid"
  const line = (r: Row) =>
    `  - ${r.courseName} › ${r.lessonName}  [${why(r)}; ${r.provider} ${r.type}${r.assetStatus === "pending" ? ", unfinished upload" : ""}]\n` +
    `      lesson ${r.lessonId}  asset ${r.assetId}  author ${r.authorEmail ?? "?"}`
  const section = (title: string, list: Row[], fix: string) => {
    console.log(`\n${title}: ${list.length}`)
    if (list.length > 0) {
      console.log(`  Fix: ${fix}`)
      list.forEach(r => console.log(line(r)))
    }
  }

  console.log("Free-tier video report (read-only — nothing was changed)")
  section(
    "1. Free-tier lessons with Chiyali-hosted video",
    report.hostedVideoOnFreeTier,
    "the creator replaces it with a YouTube/Vimeo link (or makes the lesson/course paid).",
  )
  section(
    "2. Paid lessons with a YouTube/Vimeo link",
    report.embedOnPaidLesson,
    "the creator uploads an MP4 (or makes the lesson a preview).",
  )
  section("3. Embeds with an invalid stored ID", report.invalidEmbed, "the creator pastes the link again.")
  const total = report.hostedVideoOnFreeTier.length + report.embedOnPaidLesson.length + report.invalidEmbed.length
  console.log(total === 0 ? "\nAll lessons follow the rule." : `\n${total} to follow up.`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
