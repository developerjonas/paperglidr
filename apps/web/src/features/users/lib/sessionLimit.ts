import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

/** Devices (sessions) one account may be signed in on at once. */
export const MAX_SIGNED_IN_DEVICES = 2

/**
 * Called after every sign-in: if the account is now signed in on more
 * than MAX_SIGNED_IN_DEVICES devices, the oldest sessions are signed out,
 * so one purchase can't be shared by a whole class. The newest session
 * (the one just created) always stays. Admins are exempt.
 */
export async function enforceSessionLimit(userId: string, newSessionId: string) {
  const result = await db.execute(sql`
    delete from session
    where user_id = ${userId}
      and id <> ${newSessionId}
      and not exists (select 1 from "user" where id = ${userId} and role = 'admin')
      and id not in (
        select id from session
        where user_id = ${userId} and expires_at > now()
        order by created_at desc, id desc
        limit ${MAX_SIGNED_IN_DEVICES}
      )
    returning id
  `)
  return result.rows.length
}
