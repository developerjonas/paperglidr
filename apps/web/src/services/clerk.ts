import { db } from "@/drizzle/db";
import { UserRole, UserTable } from "@/drizzle/schema";
import { getUserIdTag } from "@/features/users/db/cache";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";

export type AppUser = {
  userId: string | undefined;
  role: UserRole | undefined;
  user?: typeof UserTable.$inferSelect | null;
  redirectToSignIn: () => ReturnType<typeof redirect>;
};

export async function getCurrentUser({
  allData = false,
} = {}): Promise<AppUser> {
  // Safe redirect helper
  const redirectToSignIn = () => redirect("/sign-in");

  // TODO: Replace this block with your new session resolver (e.g., Better Auth / Auth.js)
  // For now, returning null handles the guest state cleanly without errors.
  const currentDbUserId: string | undefined = undefined; // e.g., session?.user?.id

  if (!currentDbUserId) {
    return {
      userId: undefined,
      role: undefined,
      user: null,
      redirectToSignIn,
    };
  }

  // Fetch user details from Drizzle DB
  const user = await getUser(currentDbUserId);

  return {
    userId: user?.id,
    role: user?.role,
    user: allData ? user : undefined,
    redirectToSignIn,
  };
}

export const getUser = (id: string) =>
  unstable_cache(
    async () => {
      console.log("Called getUser for ID:", id);
      return db.query.UserTable.findFirst({
        where: eq(UserTable.id, id),
      });
    },
    [`user-${id}`],
    {
      tags: [getUserIdTag(id)],
    },
  )();
