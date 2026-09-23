import { db } from "@/drizzle/db";
import { UserRole, UserTable } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { canAccessAdminPages } from "@/permissions/general";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

export type AppUser = {
  userId: string | undefined;
  role: UserRole | undefined;
  user?: typeof UserTable.$inferSelect | null;
  redirectToSignIn: () => ReturnType<typeof redirect>;
};

// Both lookups are memoized per request only (React cache), never across
// requests. The user row carries `role`, which every authorization check
// reads — a cross-request cache here meant a promoted or demoted user kept
// their old role indefinitely. One primary-key query per request is the
// price of never deciding authorization on a stale role.
const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export const getUser = cache(async (id: string) =>
  db.query.UserTable.findFirst({ where: eq(UserTable.id, id) }),
);

export async function getCurrentUser({
  allData = false,
} = {}): Promise<AppUser> {
  const redirectToSignIn = () => redirect("/sign-in");

  const session = await getSession();
  const currentDbUserId = session?.user?.id;

  if (!currentDbUserId) {
    return {
      userId: undefined,
      role: undefined,
      user: null,
      redirectToSignIn,
    };
  }

  const user = await getUser(currentDbUserId);

  return {
    userId: user?.id,
    role: user?.role,
    user: allData ? user : undefined,
    redirectToSignIn,
  };
}

/**
 * Gate for every admin page, the admin layout, and every admin-only server
 * action. Non-admins (and signed-out visitors) get notFound() — a 404 that
 * doesn't reveal the route exists. In a server action it throws before any
 * work is done. Uses the fresh, per-request role from getCurrentUser().
 */
export async function requireAdmin() {
  const { userId, role } = await getCurrentUser();
  if (userId == null || !canAccessAdminPages({ role })) notFound();
  return { userId, role: "admin" as const };
}
