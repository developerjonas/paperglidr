// Creates (or resets) the demo account for Google Play / App Store reviewers:
// a normal learner login with access to a real course, so a reviewer can
// sign in and open lessons. It's what goes in Play Console → App content →
// App access ("Sign-in details").
//
// - Signs in with email or username + password (a strong one is generated,
//   or set REVIEWER_PASSWORD). Run it again to reset the password.
// - Gets access to every course in one public product: the one you pass,
//   or the most-reviewed paid one. No purchase is recorded (purchases are
//   financial records); access is granted directly, as an admin would.
// - Dry run by default: shows what it would do. Add --yes to write.
//
// Usage (from apps/web, with the production DB_* or DATABASE_URL):
//   pnpm reviewer:create                       # dry run
//   pnpm reviewer:create --yes                 # create / reset
//   pnpm reviewer:create --yes --product=<product id>
//   pnpm reviewer:create --yes --email=reviewer@chiyali.com
import pg from "pg"
import { hashPassword } from "better-auth/crypto"
import { generateStrongPassword } from "@repo/password-policy"

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=")
    return [key!, rest.join("=") || "true"] as const
  }),
)
const write = args.get("yes") === "true"
const email = (args.get("email") ?? "reviewer@chiyali.com").toLowerCase()
const username = "store_reviewer"
const productArg = args.get("product")

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

async function main() {
  await client.connect()
  const q = async <T extends Record<string, unknown>>(text: string, values: unknown[] = []) =>
    (await client.query<T>(text, values)).rows

  // The product whose courses the reviewer can open.
  const [product] = productArg
    ? await q<{ id: string; name: string }>(`select id, name from products where id = $1 and status = 'public'`, [productArg])
    : await q<{ id: string; name: string }>(
        `select p.id, p.name
         from products p
         left join course_products cp on cp."productId" = p.id
         left join course_reviews r on r.course_id = cp."courseId" and r.is_hidden = false
         where p.status = 'public' and p."priceInRupees" > 0
         group by p.id
         order by count(r.id) desc, p."createdAt" asc
         limit 1`,
      )
  if (!product) throw new Error(productArg ? `No public product with id ${productArg}.` : "No public paid product yet. Publish one first, or pass --product=<id>.")
  const courses = await q<{ id: string; name: string }>(
    `select c.id, c.name from course_products cp join courses c on c.id = cp."courseId" where cp."productId" = $1 order by c.name`,
    [product.id],
  )

  const [existing] = await q<{ id: string; deleted_at: Date | null }>(`select id, deleted_at from "user" where email = $1`, [email])
  if (existing?.deleted_at) throw new Error(`${email} belongs to a deleted account; use another --email.`)

  console.log(write ? "Creating the reviewer account:" : "Dry run (add --yes to write):")
  console.log(`  Account:  ${email} / ${username} (${existing ? "exists; password will be reset" : "new"})`)
  console.log(`  Access:   "${product.name}" — ${courses.map((c) => c.name).join(", ") || "no courses!"}`)
  if (!write) return

  const password = process.env.REVIEWER_PASSWORD ?? generateStrongPassword(20, { email, username })
  const hash = await hashPassword(password)

  await client.query("begin")
  try {
    const userId =
      existing?.id ??
      (
        await q<{ id: string }>(
          `insert into "user"(name, email, email_verified, username, display_username)
           values ('Store Reviewer', $1, true, $2, $2) returning id`,
          [email, username],
        )
      )[0]!.id
    // Better Auth's email/password sign-in: a "credential" account whose
    // accountId is the user id, holding the password hash.
    const [credential] = await q<{ id: string }>(
      `select id from account where user_id = $1 and provider_id = 'credential'`,
      [userId],
    )
    if (credential) {
      await client.query(`update account set password = $1, updated_at = now() where id = $2`, [hash, credential.id])
    } else {
      await client.query(
        `insert into account(account_id, provider_id, user_id, password) values ($1, 'credential', $2, $3)`,
        [userId, userId, hash],
      )
    }
    // A fresh password ends any old sessions.
    await client.query(`delete from session where user_id = $1`, [userId])
    for (const course of courses) {
      await client.query(
        `insert into user_course_access("userId", "courseId") values ($1, $2) on conflict do nothing`,
        [userId, course.id],
      )
    }
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  }

  console.log("\nDone. Give the store reviewers:")
  console.log(`  Email or username: ${email}  (or ${username})`)
  console.log(`  Password:          ${password}`)
  console.log(`  Then open My learning → "${product.name}".`)
  console.log("The password isn't stored anywhere else; run this again to set a new one.")
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => client.end())
