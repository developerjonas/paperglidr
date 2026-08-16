"use server"

import { db } from "@/drizzle/db"
import { InstructorTable, InstructorPhoneOtpTable } from "@/drizzle/schema"
import { and, eq, isNull, gt } from "drizzle-orm"
import { getCurrentUser } from "@/services/auth"
import { sendSms } from "@/services/sms/smsPasalServer"
import {
  generateOtpCode,
  hashOtpCode,
  getOtpExpiry,
  MAX_ATTEMPTS,
} from "../lib/phoneOtp"
import { requestOtpSchema, verifyOtpSchema } from "../schemas/phoneOtp"
import { getInstructorByUserId } from "../db/instructors"
import { revalidateInstructorCache } from "../db/cache/instructors"
import { z } from "zod"

export async function requestInstructorPhoneOtp(
  unsafeData: z.infer<typeof requestOtpSchema>,
) {
  const user = await getCurrentUser()
  if (!user?.userId) return { error: true, message: "You must be signed in." }

  const { success, data } = requestOtpSchema.safeParse(unsafeData)
  if (!success) return { error: true, message: "Enter a valid phone number." }

  const instructor = await getInstructorByUserId(user.userId)
  if (!instructor) return { error: true, message: "Create your instructor profile first." }

  if (instructor.phoneVerifiedAt != null) {
    return { error: true, message: "Your phone is already verified." }
  }

  // One-instructor-one-number: check BEFORE sending an SMS, so a taken
  // number fails fast without wasting SMS credit. The DB's unique
  // constraint on InstructorTable.phoneNumber is the real enforcement —
  // this is just a friendlier error than a raw constraint violation, and
  // it only catches the number once it's actually saved to an instructor
  // (i.e. after a previous successful verification), not while someone
  // else merely has it pending in an unverified OTP row.
  const numberTaken = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.phoneNumber, data.phoneNumber),
  })
  if (numberTaken && numberTaken.id !== instructor.id) {
    return { error: true, message: "This number is already registered to another instructor." }
  }

  const code = generateOtpCode()
  const smsResult = await sendSms({
    phoneNumber: data.phoneNumber,
    message: `Your paperglidr verification code is ${code}. It expires in 10 minutes.`,
  })
  if (!smsResult.success) {
    return { error: true, message: "Could not send verification code. Try again shortly." }
  }

  await db.insert(InstructorPhoneOtpTable).values({
    instructorId: instructor.id,
    phoneNumber: data.phoneNumber,
    codeHash: hashOtpCode(code),
    expiresAt: getOtpExpiry(),
  })

  return { error: false, message: "Code sent. Check your phone." }
}

export async function verifyInstructorPhoneOtp(
  unsafeData: z.infer<typeof verifyOtpSchema>,
) {
  const user = await getCurrentUser()
  if (!user?.userId) return { error: true, message: "You must be signed in." }

  const { success, data } = verifyOtpSchema.safeParse(unsafeData)
  if (!success) return { error: true, message: "Enter the 6-digit code." }

  const instructor = await getInstructorByUserId(user.userId)
  if (!instructor) return { error: true, message: "Create your instructor profile first." }

  // Most recent unconsumed, unexpired OTP for this instructor.
  const otpRow = await db.query.InstructorPhoneOtpTable.findFirst({
    where: and(
      eq(InstructorPhoneOtpTable.instructorId, instructor.id),
      isNull(InstructorPhoneOtpTable.consumedAt),
      gt(InstructorPhoneOtpTable.expiresAt, new Date()),
    ),
    orderBy: (table, { desc }) => desc(table.createdAt),
  })

  if (!otpRow) {
    return { error: true, message: "Code expired or not found. Request a new one." }
  }
  if (otpRow.attempts >= MAX_ATTEMPTS) {
    return { error: true, message: "Too many attempts. Request a new code." }
  }

  if (hashOtpCode(data.code) !== otpRow.codeHash) {
    await db
      .update(InstructorPhoneOtpTable)
      .set({ attempts: otpRow.attempts + 1 })
      .where(eq(InstructorPhoneOtpTable.id, otpRow.id))
    return { error: true, message: "Incorrect code." }
  }

  // Consume the OTP and mark the instructor verified in one transaction —
  // a crash between the two would otherwise leave a "used" code that
  // never actually verified anyone.
  await db.transaction(async (trx) => {
    await trx
      .update(InstructorPhoneOtpTable)
      .set({ consumedAt: new Date() })
      .where(eq(InstructorPhoneOtpTable.id, otpRow.id))

    await trx
      .update(InstructorTable)
      .set({ phoneNumber: otpRow.phoneNumber, phoneVerifiedAt: new Date() })
      .where(eq(InstructorTable.id, instructor.id))
  })

  revalidateInstructorCache({ id: instructor.id, userId: instructor.userId })

  return { error: false, message: "Phone verified!" }
}
