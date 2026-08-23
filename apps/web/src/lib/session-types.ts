// apps/web/src/lib/session-types.ts
import type { auth } from "./auth";
import type { UserRole } from "@/drizzle/schema";

type InferredSession = typeof auth.$Infer.Session;

/** Same shape as Better Auth's inferred session, but with `role` narrowed
 *  from `string` to the real UserRole union. Use this type (and the
 *  toTypedSession helper below) anywhere you read session.user.role. */
export type TypedSession = Omit<InferredSession, "user"> & {
  user: Omit<InferredSession["user"], "role"> & { role: UserRole };
};

export function toTypedSession(session: InferredSession): TypedSession {
  return session as TypedSession;
}
