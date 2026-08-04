import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { revalidateUserCache } from "./cache"

export async function insertUser(data: typeof UserTable.$inferInsert) {
  const [newUser] = await db
    .insert(UserTable)
    .values(data)
    .onConflictDoUpdate({
      target: [UserTable.id],
      set: data,
    })
    .returning()

  if (newUser == null) throw new Error("Failed to create user")
  revalidateUserCache(newUser.id)

  return newUser
}

export async function updateUser(
  { id }: { id: string },
  data: Partial<typeof UserTable.$inferInsert>
) {
  const [updatedUser] = await db
    .update(UserTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(UserTable.id, id))
    .returning()

  if (updatedUser == null) throw new Error("Failed to update user")
  revalidateUserCache(updatedUser.id)

  return updatedUser
}

export async function deleteUser({ id }: { id: string }) {
  const [deletedUser] = await db
    .update(UserTable)
    .set({
      deletedAt: new Date(),
      email: `redacted-${id}@deleted.com`,
      name: "Deleted User",
      image: null,
    })
    .where(eq(UserTable.id, id))
    .returning()

  if (deletedUser == null) throw new Error("Failed to delete user")
  revalidateUserCache(deletedUser.id)

  return deletedUser
}
