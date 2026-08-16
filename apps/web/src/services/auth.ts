import { db } from "@/drizzle/db";
import { UserRole, UserTable } from "@/drizzle/schema";
import { getUserIdTag } from "@/features/users/db/cache";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
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
  const redirectToSignIn = () => redirect("/sign-in");

  // Fetch the session from Better Auth using request headers
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const currentDbUserId = session?.user?.id;

  if (!currentDbUserId) {
    return {
      userId: undefined,
      role: undefined,
      user: null,
      redirectToSignIn,
    };
  }

  // Fetch user details from Drizzle DB using your cached query
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
