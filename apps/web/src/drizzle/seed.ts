// Production bootstrap seed — `pnpm db:seed`. Safe to run any number of
// times: categories are inserted with ON CONFLICT (slug) DO NOTHING, and the
// admin promotion is a plain UPDATE.
//
// Needs only the DB_* variables (see src/data/env/db.ts) plus, optionally,
// ADMIN_EMAIL. See docs/DB_SETUP.md.
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { CategoryTable, UserTable } from "@/drizzle/schema"

const LAUNCH_CATEGORIES = [
  { name: "Loksewa", slug: "loksewa" },
  { name: "Entrance Prep", slug: "entrance-prep" },
  { name: "Languages", slug: "languages" },
  { name: "Programming", slug: "programming" },
  { name: "Accounting & Finance", slug: "accounting-finance" },
  { name: "Design", slug: "design" },
  { name: "Digital Skills", slug: "digital-skills" },
  { name: "Academic", slug: "academic" },
]

async function seedCategories() {
  const inserted = await db
    .insert(CategoryTable)
    .values(LAUNCH_CATEGORIES)
    .onConflictDoNothing({ target: CategoryTable.slug })
    .returning({ slug: CategoryTable.slug })

  console.log(
    `categories: ${inserted.length} inserted, ${LAUNCH_CATEGORIES.length - inserted.length} already present`,
  )
}

// The admin must already exist — they sign in with Google once, which
// creates their user row, and this promotes it. Returns false when
// ADMIN_EMAIL is set but no such user exists yet.
async function promoteAdmin(): Promise<boolean> {
  const rawEmail = process.env.ADMIN_EMAIL
  if (!rawEmail) {
    console.log("admin: ADMIN_EMAIL not set, skipping")
    return true
  }

  const email = z.string().trim().email().parse(rawEmail)

  const [user] = await db
    .update(UserTable)
    .set({ role: "admin", updatedAt: new Date() })
    .where(sql`lower(${UserTable.email}) = lower(${email})`)
    .returning({ id: UserTable.id, email: UserTable.email })

  if (user == null) {
    console.error(
      `admin: no user with email ${email}. Sign in to the app with that Google account first, then re-run the seed.`,
    )
    return false
  }

  console.log(`admin: ${user.email} is admin`)
  return true
}

async function main() {
  try {
    await seedCategories()
    if (!(await promoteAdmin())) process.exitCode = 1
  } finally {
    // Close the shared pg pool so the process can exit on its own.
    await db.$client.end()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
