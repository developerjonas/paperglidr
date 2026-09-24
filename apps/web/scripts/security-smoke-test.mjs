#!/usr/bin/env node
// Security smoke test — calls pages and server actions over HTTP exactly as
// a browser (or an attacker) would, then asserts on the DATABASE, not just
// the HTTP status.
//
// WRITES TEST DATA and installs/drops a temporary trigger. Run only against
// a throwaway database. See docs/DB_SETUP.md ("Security smoke test").
//
// Prerequisites:
//   1. an empty Postgres, migrated (pnpm db:migrate) and seeded (pnpm db:seed)
//   2. the app built and running against it (pnpm build && pnpm start), with
//      the same DB_* and BETTER_AUTH_SECRET as this script sees
//
// Usage (from apps/web):
//   SMOKE_TEST_DB_IS_THROWAWAY=1 BASE_URL=http://localhost:3000 \
//     pnpm test:security-smoke
//
// Exit code 0 = all checks passed.
import crypto from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

if (process.env.SMOKE_TEST_DB_IS_THROWAWAY !== "1") {
  console.error(
    "Refusing to run: this script writes test data. Set SMOKE_TEST_DB_IS_THROWAWAY=1 to confirm the database is disposable.",
  )
  process.exit(2)
}
for (const name of ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "BETTER_AUTH_SECRET"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}`)
    process.exit(2)
  }
}

// Must render for signed-out visitors (marketing site + catalogue + legal).
const PUBLIC_ROUTES = [
  "/",
  "/browse",
  "/legal",
  "/tos",
  "/privacy",
  "/refund-policy",
  "/creator-terms",
  "/content",
  "/dmca",
  "/contact",
  "/sitemap.xml",
  "/robots.txt",
]

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "")
const SECRET = process.env.BETTER_AUTH_SECRET
const manifest = JSON.parse(
  readFileSync(path.join(webRoot, ".next/server/server-reference-manifest.json"), "utf8"),
).node

const db = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
})
const q = async (sql, params) => (await db.query(sql, params)).rows
const one = async (sql, params) => (await q(sql, params))[0]

// Better Auth session cookie: token + "." + base64 HMAC-SHA256(secret, token)
function sessionCookie(token) {
  const signature = crypto.createHmac("sha256", SECRET).update(token).digest("base64")
  return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`
}

function findAction(match) {
  const entry = Object.entries(manifest).find(([, v]) => match(v))
  if (entry == null) throw new Error("Server action not found in build manifest")
  return entry
}
const actionByName = name => findAction(v => v.exportedName === name)

// Server actions are dispatched through a page that imports them; any
// concrete route from the action's worker list works.
function routeFor([, entry], productId) {
  const worker =
    Object.keys(entry.workers).find(key => key.endsWith("/page")) ??
    Object.keys(entry.workers)[0]
  return (
    worker
      .replace(/^app/, "")
      .replace(/\/\([^)]+\)/g, "")
      .replace(/\/(page|route)$/, "")
      .replace(/\[[^\]]+\]/g, productId) || "/"
  )
}

async function callAction(action, args, token, productId) {
  const response = await fetch(BASE_URL + routeFor(action, productId), {
    method: "POST",
    redirect: "manual",
    headers: {
      "Next-Action": action[0],
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      ...(token ? { Cookie: sessionCookie(token) } : {}),
    },
    body: JSON.stringify(args),
  })
  return { status: response.status, body: await response.text() }
}

async function getStatus(pathname, token) {
  const response = await fetch(BASE_URL + pathname, {
    redirect: "manual",
    headers: token ? { Cookie: sessionCookie(token) } : {},
  })
  return response.status
}

let passed = 0
let failed = 0
function check(label, ok, detail = "") {
  if (ok) passed++
  else failed++
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? `  (${detail})` : ""}`)
}
const message = body => body.match(/"message":"([^"]*)"/)?.[1]
const decoded = text => {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

async function createUser(label, run) {
  const user = await one(
    `insert into "user"(name, email, email_verified) values ($1, $2, true) returning id`,
    [label, `${label}-${run}@smoke.test`],
  )
  const token = `smoke_${label}_${run}_${crypto.randomBytes(8).toString("hex")}`
  await q(
    `insert into session(expires_at, token, user_id) values (now() + interval '1 hour', $1, $2)`,
    [token, user.id],
  )
  return { id: user.id, token }
}

async function main() {
  await db.connect()
  const run = crypto.randomBytes(4).toString("hex")

  // ---------------------------------------------------------------- fixtures
  const creatorA = await createUser("creator-a", run)
  const creatorB = await createUser("creator-b", run)
  const attacker = await createUser("attacker", run)
  const admin = await createUser("admin", run)
  await q(`update "user" set role = 'admin' where id = $1`, [admin.id])

  const courseB = await one(
    `insert into courses(name, description, author_id) values ('B course', 'd', $1) returning id`,
    [creatorB.id],
  )
  const courseA = await one(
    `insert into courses(name, description, author_id) values ('A course', 'd', $1) returning id`,
    [creatorA.id],
  )
  const productB = await one(
    `insert into products(name, description, "imageUrl", "priceInRupees", status, author_id)
     values ('B product', 'd', '/x.png', 999, 'public', $1) returning id`,
    [creatorB.id],
  )
  await q(`insert into course_products("courseId", "productId") values ($1, $2)`, [courseB.id, productB.id])
  const productA = await one(
    `insert into products(name, description, "imageUrl", "priceInRupees", status, author_id)
     values ('A product', 'd', '/a.png', 500, 'public', $1) returning id`,
    [creatorA.id],
  )
  const freeProductB = await one(
    `insert into products(name, description, "imageUrl", "priceInRupees", status, author_id)
     values ('B free', 'd', '/f.png', 0, 'public', $1) returning id`,
    [creatorB.id],
  )
  await q(`insert into course_products("courseId", "productId") values ($1, $2)`, [courseB.id, freeProductB.id])

  // creator A bought creator B's product
  const purchase = await one(
    `insert into purchases("pricePaidInPaisa", "productDetails", "userId", "productId", gateway, status, "gatewayCheckoutId", "idempotencyKey")
     values (99900, '{"name":"B product","description":"d","imageUrl":"/x.png"}', $1, $2, 'khalti', 'completed', $3, $3)
     returning id`,
    [creatorA.id, productB.id, `smoke-${run}`],
  )
  await q(`insert into user_course_access("userId", "courseId") values ($1, $2)`, [creatorA.id, courseB.id])
  await q(
    `insert into ledger_entries("purchaseId", "courseId", "instructorId", "entryType", "revenueSource", "platformFeeRateBps", "grossAmountPaisa", "platformFeePaisa", "creatorEarningsPaisa")
     values ($1, $2, $3, 'sale', 'platform', 5000, 99900, 49950, 49950)`,
    [purchase.id, courseB.id, creatorB.id],
  )
  await q(
    `insert into discount_codes(code, creator_id, "scopeType", "discountType", amount)
     values ($1, $2, 'storewide', 'percentage', 50)`,
    [`SMOKE${run}`.toUpperCase(), creatorA.id],
  )
  const ticket = await one(`insert into support_tickets(user_id, subject) values ($1, 'help') returning id`, [creatorA.id])
  const payout = await one(
    `insert into payouts("instructorId", "amountPaisa", "bankDetailsSnapshot") values ($1, 100000, 'x') returning id`,
    [creatorB.id],
  )
  const review = await one(
    `insert into course_reviews(rating, user_id, course_id) values (5, $1, $2) returning id`,
    [creatorA.id, courseB.id],
  )
  const certificate = await one(
    `insert into certificates("certificateCode", "userId", "courseId", "userNameSnapshot", "courseTitleSnapshot", "instructorNameSnapshot", "courseDurationMinutesSnapshot")
     values ($1, $2, $3, 'a', 'c', 'b', 0) returning id`,
    [`CERT-SMOKE-${run}`, creatorA.id, courseB.id],
  )
  const section = await one(
    `insert into course_sections(name, "order", "courseId") values ('B section', 0, $1) returning id`,
    [courseB.id],
  )
  const category = await one(`select id from categories limit 1`)
  if (category == null) throw new Error("No categories — run pnpm db:seed first")

  const call = (name, args, token) => callAction(actionByName(name), args, token, productB.id)

  // ---------------------------------------------------------------- public routes
  console.log("== public routes (signed out)")
  for (const route of PUBLIC_ROUTES.concat([`/products/${productB.id}`])) {
    const status = await getStatus(route)
    check(`signed-out ${route} -> 200`, status === 200, `http ${status}`)
  }

  // Every internal link the signed-out home page renders (header + footer)
  // must resolve: a page, or a redirect to sign-in — never a 404/500.
  const homeHtml = await (await fetch(`${BASE_URL}/`)).text()
  const hrefs = [...new Set([...homeHtml.matchAll(/href="(\/[^"#?]*)"/g)].map(m => m[1]))]
    .filter(href => !href.startsWith("/_next") && !/\.(ico|png|svg|css|js)$/.test(href))
  check("home page renders internal links", hrefs.length > 10, `${hrefs.length} links`)
  for (const href of hrefs) {
    const status = await getStatus(href)
    check(`link ${href} resolves when signed out`, status < 400, `http ${status}`)
  }

  // ---------------------------------------------------------------- lesson delivery (task 11/12)
  console.log("== lesson delivery")
  const liveSection = await one(
    `insert into course_sections(name, "order", "courseId", status) values ('B live', 1, $1, 'public') returning id`,
    [courseB.id],
  )
  const addLesson = async (name, status) =>
    one(`insert into lessons(name, "order", status, "sectionId") values ($1, 0, $2, $3) returning id`, [
      name,
      status,
      liveSection.id,
    ])
  const addAsset = async (lessonId, status = "ready") =>
    one(
      `insert into lesson_assets("lessonId", type, provider, role, "storageKey", "fileName", "mimeType", status)
       values ($1, 'video_file', 'r2', 'primary', $2, 'v.mp4', 'video/mp4', $3) returning id`,
      [lessonId, `courses/${courseB.id}/lessons/${lessonId}/smoke-${run}.mp4`, status],
    )
  const previewLesson = await addLesson("B preview", "preview")
  const lockedLesson = await addLesson("B locked", "public")
  const privateLesson = await addLesson("B private", "private")
  const previewAsset = await addAsset(previewLesson.id)
  const pendingAsset = await addAsset(previewLesson.id, "pending")
  const lockedAsset = await addAsset(lockedLesson.id)
  const privateAsset = await addAsset(privateLesson.id)

  const deliver = async (lessonId, assetId, token) => {
    const response = await fetch(`${BASE_URL}/api/lessons/${lessonId}/assets/${assetId}/deliver`, {
      redirect: "manual",
      headers: token ? { Cookie: sessionCookie(token) } : {},
    })
    const body = await response.json().catch(() => ({}))
    return { status: response.status, body, cacheControl: response.headers.get("cache-control") ?? "" }
  }

  let d = await deliver(previewLesson.id, previewAsset.id)
  check("preview lesson plays signed out", d.status === 200 && typeof d.body.url === "string", `http ${d.status}`)
  check("deliver responses are private, no-store", d.cacheControl.includes("no-store") && d.cacheControl.includes("private"), d.cacheControl)
  const expires = Number(new URL(d.body.url ?? "http://x/?X-Amz-Expires=0").searchParams.get("X-Amz-Expires"))
  check("signed video URL is short-lived (<= 3 h)", expires > 0 && expires <= 3 * 60 * 60, `X-Amz-Expires=${expires}`)
  d = await deliver(previewLesson.id, pendingAsset.id)
  check("pending (unconfirmed) upload is not served", d.status === 404, `http ${d.status}`)
  d = await deliver(lockedLesson.id, lockedAsset.id)
  check("locked lesson signed out -> 401", d.status === 401, `http ${d.status}`)
  d = await deliver(lockedLesson.id, lockedAsset.id, attacker.token)
  check("locked lesson, signed in without access -> 403", d.status === 403, `http ${d.status}`)
  d = await deliver(lockedLesson.id, lockedAsset.id, creatorB.token)
  check("author plays their own locked lesson", d.status === 200 && typeof d.body.url === "string", `http ${d.status}`)
  d = await deliver(privateLesson.id, privateAsset.id, creatorB.token)
  check("author plays their own private lesson", d.status === 200, `http ${d.status}`)
  d = await deliver(privateLesson.id, privateAsset.id, admin.token)
  check("admin plays any lesson", d.status === 200, `http ${d.status}`)
  d = await deliver(privateLesson.id, privateAsset.id, creatorA.token)
  check("private lesson, buyer who isn't the author -> 403", d.status === 403, `http ${d.status}`)
  d = await deliver(lockedLesson.id, lockedAsset.id, creatorA.token)
  check("buyer plays a purchased lesson", d.status === 200, `http ${d.status}`)
  d = await deliver(lockedLesson.id, previewAsset.id, creatorB.token)
  check("asset from another lesson -> 404", d.status === 404, `http ${d.status}`)

  // ---------------------------------------------------------------- uploads (task 12 + images)
  console.log("== upload requests")
  let up
  const assetCount = async () => (await one(`select count(*)::int n from lesson_assets where "lessonId" = $1`, [lockedLesson.id])).n
  const assetsBefore = await assetCount()
  const uploadInput = over => [{
    lessonId: lockedLesson.id, fileName: "v.mp4", mimeType: "video/mp4", fileSizeBytes: 1000,
    role: "primary", downloadable: false, durationSeconds: 60, ...over,
  }]
  up = await call("requestLessonAssetUploadUrl", uploadInput({ mimeType: "video/quicktime", fileName: "v.mov" }), creatorB.token)
  check("lesson upload: non-MP4 video rejected", message(up.body)?.includes("MP4") && (await assetCount()) === assetsBefore, message(up.body))
  up = await call("requestLessonAssetUploadUrl", uploadInput({ fileSizeBytes: 2 * 1024 ** 3 + 1 }), creatorB.token)
  check("lesson upload: MP4 over 2 GB rejected", message(up.body)?.includes("2 GB") && (await assetCount()) === assetsBefore, message(up.body))
  up = await call("requestLessonAssetUploadUrl", uploadInput({}), attacker.token)
  check("lesson upload: non-author can't request an upload URL", (await assetCount()) === assetsBefore, `http ${up.status}`)
  up = await call("requestLessonAssetUploadUrl", uploadInput({}), creatorB.token)
  const newAsset = await one(`select status from lesson_assets where "lessonId" = $1 order by "createdAt" desc limit 1`, [lockedLesson.id])
  check("lesson upload: valid MP4 starts as pending", (await assetCount()) === assetsBefore + 1 && newAsset?.status === "pending", newAsset?.status)
  check("lesson upload: presigned PUT signs content-length", /X-Amz-SignedHeaders=[^&]*content-length/.test(decoded(up.body)), "")

  up = await call("requestImageUploadUrl", [{ purpose: "product", mimeType: "image/gif", fileSizeBytes: 1000 }], creatorB.token)
  check("image upload: GIF rejected", message(up.body)?.includes("JPEG, PNG or WebP"), message(up.body))
  up = await call("requestImageUploadUrl", [{ purpose: "product", mimeType: "image/png", fileSizeBytes: 5 * 1024 ** 2 + 1 }], creatorB.token)
  check("image upload: over 5 MB rejected", message(up.body)?.includes("5 MB"), message(up.body))
  up = await call("requestImageUploadUrl", [{ purpose: "product", mimeType: "image/png", fileSizeBytes: 1000 }])
  check("image upload: signed out rejected", message(up.body)?.includes("Sign in"), message(up.body))
  up = await call("requestImageUploadUrl", [{ purpose: "instructor", mimeType: "image/webp", fileSizeBytes: 1000 }], creatorB.token)
  check("image upload: staged in the private bucket under the caller's id", decoded(up.body).includes(`image-uploads/instructor/${creatorB.id}/`), "")
  up = await call("confirmImageUpload", [{ purpose: "instructor", stagingKey: `image-uploads/instructor/${creatorB.id}/00000000-0000-0000-0000-000000000000.png` }], attacker.token)
  check("image upload: can't confirm another user's upload", message(up.body) === "Upload not found.", message(up.body))

  // ---------------------------------------------------------------- post-login redirect (task 14)
  console.log("== redirectTo")
  const signUpLink = async (redirectTo) => {
    const html = await (await fetch(`${BASE_URL}/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`)).text()
    return html.match(/href="(\/sign-up[^"]*)"/)?.[1]?.replaceAll("&amp;", "&")
  }
  check("redirectTo keeps a relative path", (await signUpLink("/courses")) === `/sign-up?redirectTo=${encodeURIComponent("/courses")}`, await signUpLink("/courses"))
  for (const external of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"]) {
    const link = await signUpLink(external)
    check(`redirectTo rejects ${external}`, link === "/sign-up", link)
  }
  for (const [callbackURL, expectOk] of [["https://evil.example/steal", false], ["/courses", true]]) {
    const response = await fetch(`${BASE_URL}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ provider: "google", callbackURL, disableRedirect: true }),
    })
    check(
      `Better Auth ${expectOk ? "accepts" : "rejects"} callbackURL ${callbackURL}`,
      expectOk ? response.ok : response.status === 403,
      `http ${response.status}`,
    )
  }

  // ---------------------------------------------------------------- /api/v1 (mobile flag off)
  console.log("== /api/v1 with MOBILE_API_ENABLED off")
  const v1 = async (method, pathname, token, body) => {
    const response = await fetch(`${BASE_URL}/api/v1${pathname}`, {
      method,
      headers: {
        ...(token ? { Cookie: sessionCookie(token) } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { status: response.status, text: await response.text() }
  }
  for (const [method, pathname, body] of [
    ["GET", "/me/courses"],
    ["GET", "/purchases"],
    ["GET", "/certificates"],
    ["GET", `/certificates/${certificate.id}`],
    ["GET", `/lessons/${lockedLesson.id}`],
    ["POST", `/lessons/${lockedLesson.id}/complete`],
    ["GET", "/support"],
    ["POST", "/support", { subject: "s", message: "m", category: "other" }],
    ["GET", `/support/${ticket.id}`],
    ["POST", `/support/${ticket.id}/messages`, { body: "m" }],
    ["GET", "/wishlist"],
    ["POST", "/wishlist", { productId: productB.id }],
    ["DELETE", `/wishlist/${productB.id}`],
  ]) {
    const res = await v1(method, pathname, creatorA.token, body)
    check(`${method} /api/v1${pathname} -> 404 (signed in)`, res.status === 404, `http ${res.status}`)
  }
  let res = await v1("GET", "/products")
  check("public GET /api/v1/products still works", res.status === 200, `http ${res.status}`)
  const hiddenProduct = await one(
    `insert into products(name, description, "imageUrl", "priceInRupees", status, author_id)
     values ('B hidden', 'd', '/h.png', 100, 'private', $1) returning id`,
    [creatorB.id],
  )
  res = await v1("GET", `/products/${hiddenProduct.id}`)
  check("public GET /api/v1/products/<private product> -> 404", res.status === 404, `http ${res.status}`)
  res = await v1("GET", `/courses/${courseA.id}`)
  check("public GET /api/v1/courses/<course in no public product> -> 404", res.status === 404, `http ${res.status}`)
  const phone = `98${String(Date.now()).slice(-8)}`
  await q(
    `insert into instructors("userId", handle, name, bio, "profileImageUrl", phone_number) values ($1, $2, 'B', 'bio', '/b.png', $3)`,
    [creatorB.id, `smoke_${run}`, phone],
  )
  res = await v1("GET", `/instructors/smoke_${run}`)
  check(
    "public instructor profile has no phone number or user id",
    res.status === 200 && !res.text.includes(phone) && !res.text.includes(creatorB.id) && res.text.includes("B product"),
    `http ${res.status}`,
  )

  // ---------------------------------------------------------------- certificate verification
  const verifyHtml = await (await fetch(`${BASE_URL}/verify/CERT-SMOKE-${run}`)).text()
  check(
    "/verify shows the certificate without internal ids",
    verifyHtml.includes(`CERT-SMOKE-${run}`) && !verifyHtml.includes(certificate.id) && !verifyHtml.includes(creatorA.id) && !verifyHtml.includes(courseB.id),
  )

  // ---------------------------------------------------------------- support ticket page (moved)
  check("support ticket page at /support/<id>", (await getStatus(`/support/${ticket.id}`, creatorA.token)) === 200)
  check("old /support/support/<id> is gone", (await getStatus(`/support/support/${ticket.id}`, creatorA.token)) === 404)

  // ---------------------------------------------------------------- money ops (fix/money-ops)
  console.log("== refunds, moderation, reports, payouts, checkout, middleware")
  const act = async (name, args, token) => {
    const res = await call(name, args, token)
    return { ...res, msg: message(res.body) }
  }
  const redirectOf = async (pathname, token) => {
    const response = await fetch(BASE_URL + pathname, {
      redirect: "manual",
      headers: token ? { Cookie: sessionCookie(token) } : {},
    })
    return { status: response.status, location: response.headers.get("location") ?? "" }
  }

  // Refunds (task 16): creator A's completed purchase of product B is fresh
  // and 0% complete, so it's eligible.
  const purchaseHtml = await (await fetch(`${BASE_URL}/purchases/${purchase.id}`, { headers: { Cookie: sessionCookie(creatorA.token) } })).text()
  check("purchase page shows 'Request refund' for an eligible purchase", purchaseHtml.includes("Request refund"))
  const refundRows = async () => q(`select status, "reviewedBy" from refund_requests where "purchaseId" = $1`, [purchase.id])
  let res1 = await act("requestRefund", [purchase.id, "not what I expected"], attacker.token)
  check("requestRefund on someone else's purchase rejected", res1.msg === "Purchase not found" && (await refundRows()).length === 0, res1.msg)
  res1 = await act("requestRefund", [purchase.id, "not what I expected"], creatorA.token)
  check("buyer can request a refund", res1.msg === "Refund request submitted." && (await refundRows()).length === 1, res1.msg)
  res1 = await act("requestRefund", [purchase.id], creatorA.token)
  check("only one open refund request per purchase", (await refundRows()).length === 1, res1.msg)
  const refundRequest = await one(`select id from refund_requests where "purchaseId" = $1`, [purchase.id])
  res1 = await act("approveRefund", [refundRequest.id], attacker.token)
  check(
    "approveRefund by a normal user rejected (purchase untouched)",
    (await refundRows())[0].status === "pending" && (await one(`select status from purchases where id = $1`, [purchase.id])).status === "completed",
    `http ${res1.status}`,
  )
  const refundsPage = await (await fetch(`${BASE_URL}/admin/refunds`, { headers: { Cookie: sessionCookie(admin.token) } })).text()
  check("admin refunds page lists the request with the gateway reference", refundsPage.includes("B product") && refundsPage.includes(`smoke-${run}`))
  res1 = await act("rejectRefund", [refundRequest.id, "Outside policy"], admin.token)
  const rejected = (await refundRows())[0]
  check("admin rejects with a reason (access kept)", rejected.status === "denied" && rejected.reviewedBy === admin.id, res1.msg)

  // Moderation (task 18): a verified creator's "Publish" lands in review.
  const creatorC = await createUser("creator-c", run)
  await q(
    `insert into instructors("userId", handle, name, bio, "profileImageUrl", phone_verified_at) values ($1, $2, 'C', 'bio', '/c.png', now())`,
    [creatorC.id, `smoke_c_${run}`],
  )
  const courseC = await one(`insert into courses(name, description, author_id) values ('C course', 'd', $1) returning id`, [creatorC.id])
  const sectionC = await one(`insert into course_sections(name, "order", "courseId", status) values ('C s', 0, $1, 'public') returning id`, [courseC.id])
  const lessonC = await one(`insert into lessons(name, "order", status, "sectionId") values ('C intro', 0, 'preview', $1) returning id`, [sectionC.id])
  await q(
    `insert into lesson_assets("lessonId", type, provider, role, "externalId", status) values ($1, 'youtube', 'youtube', 'primary', 'dQw4w9WgXcQ', 'ready')`,
    [lessonC.id],
  )
  const productName = `C product ${run}`
  await act("createProduct", [{
    name: productName,
    priceInRupees: 500,
    description: "A complete, practical course for the Loksewa exam with worked examples and past papers. ".repeat(2),
    imageUrl: "/c.png",
    status: "public",
    categoryId: null,
    tagIds: [],
    courseIds: [courseC.id],
  }], creatorC.token)
  const productC = await one(`select id, status from products where name = $1`, [productName])
  check("a creator's new product lands in pending_review", productC?.status === "pending_review", productC?.status)
  check("a product in review can't be opened publicly", (await getStatus(`/products/${productC.id}`)) === 404)
  await act("approveProductReview", [productC.id], attacker.token)
  check("approveProductReview by a normal user rejected", (await one(`select status from products where id = $1`, [productC.id])).status === "pending_review")
  res1 = await act("approveProductReview", [productC.id], admin.token)
  check("admin approves -> public", (await one(`select status from products where id = $1`, [productC.id])).status === "public", res1.msg)

  // Reports (task 18)
  res1 = await act("reportContent", [{ targetType: "product", targetId: productB.id, reason: "piracy", details: "copied" }], attacker.token)
  const report = await one(`select id, status from reports where "reporterId" = $1 and "targetId" = $2`, [attacker.id, productB.id])
  check("signed-in user can report a product", report?.status === "pending", res1.msg)
  res1 = await act("reportContent", [{ targetType: "product", targetId: hiddenProduct.id, reason: "scam" }], attacker.token)
  check("can't report a product that isn't public", res1.msg === "That content couldn't be found.", res1.msg)
  res1 = await act("reportContent", [{ targetType: "lesson", targetId: lockedLesson.id, reason: "scam" }], attacker.token)
  check("can't report a lesson you can't open", res1.msg === "That content couldn't be found.", res1.msg)
  await act("reviewReport", [{ reportId: report.id, status: "dismissed" }], attacker.token)
  check("reviewReport by a normal user rejected", (await one(`select status from reports where id = $1`, [report.id])).status === "pending")

  // Payouts (task 17): creator B has earnings but no verified phone.
  const payoutsBefore = (await one(`select count(*)::int n from payouts where "instructorId" = $1`, [creatorB.id])).n
  res1 = await act("requestPayout", [{ amountInRupees: 1000, details: { method: "esewa", walletId: "9800000000", accountName: "B" } }], creatorB.token)
  check(
    "payout blocked without a verified phone",
    res1.msg?.includes("Verify your phone") && (await one(`select count(*)::int n from payouts where "instructorId" = $1`, [creatorB.id])).n === payoutsBefore,
    res1.msg,
  )

  // Buying twice
  res1 = await act("initiatePurchase", [{ productId: productB.id, gateway: "esewa", idempotencyKey: `${crypto.randomUUID()}:esewa` }], creatorA.token)
  check("initiatePurchase rejects a product the buyer already owns", res1.msg?.includes("already own"), res1.msg)

  // YouTube on free previews only
  res1 = await act("setLessonYouTubeVideo", [lockedLesson.id, "https://youtu.be/dQw4w9WgXcQ"], creatorB.token)
  check("YouTube refused on a paid lesson", res1.msg?.includes("free preview lessons"), res1.msg)
  res1 = await act("setLessonYouTubeVideo", [previewLesson.id, "https://youtu.be/dQw4w9WgXcQ"], attacker.token)
  check("YouTube can't be set on another creator's lesson", !(await q(`select 1 from lesson_assets where "lessonId" = $1 and provider = 'youtube'`, [previewLesson.id])).length)

  // Teach product pages are owner-only. Profiles are inserted with SQL,
  // which doesn't clear the app's cached "no instructor profile" for a
  // user who already hit /teach, so use a creator that hasn't: creator C
  // (owner of product C) and a fresh creator D.
  const creatorD = await createUser("creator-d", run)
  await q(
    `insert into instructors("userId", handle, name, bio, "profileImageUrl") values ($1, $2, 'D', 'bio', '/d.png')`,
    [creatorD.id, `smoke_d_${run}`],
  )
  check("another creator's product editor -> 404", (await getStatus(`/teach/products/${productC.id}/edit`, creatorD.token)) === 404)
  check("owner opens their product editor", (await getStatus(`/teach/products/${productC.id}/edit`, creatorC.token)) === 200)
  const emptyProductC = await one(
    `insert into products(name, description, "imageUrl", "priceInRupees", status, author_id)
     values ('C empty', 'd', '/c.png', 100, 'private', $1) returning id`,
    [creatorC.id],
  )
  check("author opens the editor of a product with no courses", (await getStatus(`/teach/products/${emptyProductC.id}/edit`, creatorC.token)) === 200)
  check("another creator can't open it", (await getStatus(`/teach/products/${emptyProductC.id}/edit`, creatorD.token)) === 404)
  const teachList = await (await fetch(`${BASE_URL}/teach/products`, { headers: { Cookie: sessionCookie(creatorD.token) } })).text()
  check("/teach/products lists only your own products", !teachList.includes(productName) && !teachList.includes("B product"))

  // Middleware: /courses and /support keep redirectTo; previews stay public
  let red = await redirectOf("/courses")
  check("signed-out /courses -> sign-in with redirectTo", red.status === 307 && red.location.includes("/sign-in?redirectTo=%2Fcourses"), red.location)
  red = await redirectOf("/support/new?purchaseId=x")
  check("signed-out /support/new -> sign-in with redirectTo (query kept)", red.status === 307 && red.location.includes("redirectTo=%2Fsupport%2Fnew%3FpurchaseId%3Dx"), red.location)
  check("signed-out preview lesson page still 200", (await getStatus(`/courses/${courseB.id}/lessons/${previewLesson.id}`)) === 200)

  // ---------------------------------------------------------------- admin routes
  console.log("== /admin routes")
  const adminRoutes = [
    "/admin",
    "/admin/revenue",
    "/admin/payouts",
    "/admin/support",
    `/admin/support/${ticket.id}`,
    "/admin/categories",
    "/admin/categories/new",
    "/admin/reviews",
    "/admin/purchases",
    "/admin/purchases?status=disputed",
    "/admin/refunds",
    "/admin/products",
    "/admin/reports",
  ]
  for (const route of adminRoutes) {
    check(`normal user gets 404 on ${route}`, (await getStatus(route, attacker.token)) === 404)
  }
  check("signed-out visitor gets 404 on /admin (no redirect)", (await getStatus("/admin")) === 404)
  check("admin gets 200 on /admin", (await getStatus("/admin", admin.token)) === 200)
  check("admin gets 200 on /admin/purchases", (await getStatus("/admin/purchases", admin.token)) === 200)
  for (const route of ["/admin/refunds", "/admin/products", "/admin/reports"]) {
    check(`admin gets 200 on ${route}`, (await getStatus(route, admin.token)) === 200)
  }

  const promoted = await createUser("promoted", run)
  const before = await getStatus("/admin", promoted.token)
  await q(`update "user" set role = 'admin' where id = $1`, [promoted.id])
  const after = await getStatus("/admin", promoted.token)
  await q(`update "user" set role = 'user' where id = $1`, [promoted.id])
  const demoted = await getStatus("/admin", promoted.token)
  check("role change applies on the next request", before === 404 && after === 200 && demoted === 404, `${before} → ${after} → ${demoted}`)

  // ---------------------------------------------------------------- admin-only actions as a normal user
  console.log("== admin-only actions called by a normal user")
  let r = await call("revokeAccess", [{ purchaseId: purchase.id }], attacker.token)
  let state = await one(`select status from purchases where id = $1`, [purchase.id])
  check("revokeAccess rejected", state.status === "completed", `http ${r.status}`)
  r = await call("deleteCategory", [category.id], attacker.token)
  check("deleteCategory rejected", (await q(`select 1 from categories where id = $1`, [category.id])).length === 1, `http ${r.status}`)
  r = await call("createCategory", [{ name: "Hacked", slug: `hacked-${run}` }], attacker.token)
  check("createCategory rejected", (await q(`select 1 from categories where slug = $1`, [`hacked-${run}`])).length === 0, `http ${r.status}`)
  r = await call("approvePayout", [payout.id], attacker.token)
  check("approvePayout rejected", (await one(`select status from payouts where id = $1`, [payout.id])).status === "requested", `http ${r.status}`)
  r = await call("denyPayout", [payout.id, "x"], attacker.token)
  check("denyPayout rejected", (await one(`select status from payouts where id = $1`, [payout.id])).status === "requested", `http ${r.status}`)
  r = await call("hideReview", [review.id, true], attacker.token)
  check("hideReview rejected", (await one(`select is_hidden from course_reviews where id = $1`, [review.id])).is_hidden === false, `http ${r.status}`)
  r = await call("updateSupportTicketStatus", [ticket.id, "closed"], attacker.token)
  check("updateSupportTicketStatus rejected", (await one(`select status from support_tickets where id = $1`, [ticket.id])).status === "open", `http ${r.status}`)
  r = await call("revokeCertificate", [certificate.id, { reason: "x" }], attacker.token)
  check("revokeCertificate rejected", (await one(`select "revokedAt" from certificates where id = $1`, [certificate.id])).revokedAt === null, `http ${r.status}`)

  // ---------------------------------------------------------------- ownership
  console.log("== ownership checks")
  r = await call("confirmPurchase", [{ purchaseId: purchase.id }], attacker.token)
  check("confirmPurchase on another user's purchase rejected", message(r.body) === "Purchase not found", message(r.body))
  r = await call("confirmPurchase", [{ purchaseId: purchase.id }], creatorA.token)
  check("confirmPurchase by the owner still works", message(r.body) === "Already confirmed", message(r.body))
  r = await call("deleteSection", [section.id], attacker.token)
  check("deleteSection on another creator's course rejected", (await q(`select 1 from course_sections where id = $1`, [section.id])).length === 1, `http ${r.status}`)
  r = await call("updateSection", [section.id, { name: "pwned", status: "public" }], attacker.token)
  check("updateSection on another creator's course rejected", (await one(`select name from course_sections where id = $1`, [section.id])).name === "B section", `http ${r.status}`)
  const sectionCount = (await one(`select count(*)::int n from course_sections where "courseId" = $1`, [courseB.id])).n
  r = await call("createSection", [courseB.id, { name: "injected", status: "public" }], attacker.token)
  check("createSection on another creator's course rejected", (await one(`select count(*)::int n from course_sections where "courseId" = $1`, [courseB.id])).n === sectionCount, `http ${r.status}`)
  r = await call(
    "createProduct",
    [{ name: `steal-${run}`, priceInRupees: 0, description: "x", imageUrl: "/x.png", status: "private", categoryId: null, tagIds: [], courseIds: [courseB.id] }],
    attacker.token,
  )
  check("createProduct bundling another creator's course rejected", (await q(`select 1 from products where name = $1`, [`steal-${run}`])).length === 0, message(r.body))

  const enroll = findAction(v => v.filename?.includes("products/[productId]/purchase/page") && v.exportedName.startsWith("$$RSC_SERVER_ACTION"))
  r = await callAction(enroll, [productB.id], attacker.token, productB.id)
  check(
    "free-enroll action rejects a paid product",
    (await q(`select 1 from user_course_access where "userId" = $1`, [attacker.id])).length === 0,
    `http ${r.status}`,
  )

  // ---------------------------------------------------------------- discounts
  console.log("== discount scoping")
  const code = `SMOKE${run}`.toUpperCase()
  r = await call("applyDiscountCode", [{ code, productId: productB.id, priceInRupees: 999 }], attacker.token)
  check("creator A's storewide code rejected on creator B's product", message(r.body) === "That code doesn't apply to this product", message(r.body))
  r = await call("applyDiscountCode", [{ code, productId: productA.id, priceInRupees: 500 }], attacker.token)
  check("same code accepted on creator A's own product", r.body.includes('"valid":true') && r.body.includes('"amountOffInRupees":250'))

  // ---------------------------------------------------------------- payments
  console.log("== payments")
  const pendingPurchase = async (gateway, userId = creatorA.id) => {
    const id = crypto.randomUUID()
    return one(
      `insert into purchases(id, "pricePaidInPaisa", "productDetails", "userId", "productId", gateway, status, "gatewayCheckoutId", "idempotencyKey")
       values ($1, 99900, '{"name":"B product","description":"d","imageUrl":"/x.png"}', $2, $3, $4, 'pending', $5, $6) returning id`,
      [id, userId, productB.id, gateway, gateway === "esewa" ? id : `pidx-${id}`, `${crypto.randomUUID()}:${gateway}`],
    )
  }
  const accessFor = async userId =>
    (await q(`select 1 from user_course_access where "userId" = $1 and "courseId" = $2`, [userId, courseB.id])).length

  // Cron endpoint
  const cronUrl = `${BASE_URL}/api/cron/reconcile-payments`
  const cronStatus = async headers => (await fetch(cronUrl, { headers })).status
  check("cron rejects a request with no secret", (await cronStatus({})) === 401)
  check("cron rejects a wrong secret", (await cronStatus({ Authorization: "Bearer wrong-secret-wrong-secret-wrong-secret" })) === 401)
  check("cron rejects the secret without 'Bearer'", (await cronStatus({ Authorization: process.env.CRON_SECRET ?? "" })) === 401)
  if (process.env.CRON_SECRET) {
    const response = await fetch(cronUrl, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } })
    const body = await response.json().catch(() => null)
    check("cron accepts the right secret (GET or POST)", response.status === 200 && typeof body?.checked === "number", JSON.stringify(body))
  } else {
    console.log("SKIP cron with the right secret (CRON_SECRET not set for this script)")
  }

  // Return routes
  const esewaPurchase = await pendingPurchase("esewa", attacker.id)
  const khaltiPurchase = await pendingPurchase("khalti", attacker.id)
  const routeStatus = async path => (await fetch(BASE_URL + path, { redirect: "manual" })).status
  check("esewa return: unknown purchase -> 404", (await routeStatus(`/api/payments/esewa/return/${crypto.randomUUID()}`)) === 404)
  check("esewa return: non-uuid -> 404", (await routeStatus(`/api/payments/esewa/return/not-a-uuid`)) === 404)
  check("esewa return: a Khalti purchase -> 404", (await routeStatus(`/api/payments/esewa/return/${khaltiPurchase.id}`)) === 404)
  check("khalti return: an eSewa purchase -> 404", (await routeStatus(`/api/payments/khalti/return/${esewaPurchase.id}`)) === 404)

  // Forged eSewa success payloads. Even one correctly signed with the
  // PUBLIC sandbox key (anyone can do that) must not complete a purchase:
  // the status API decides, and eSewa's sandbox has no such payment.
  const esewaData = (secret, overrides = {}) => {
    const fields = {
      transaction_code: "FORGED",
      status: "COMPLETE",
      total_amount: "999.0",
      transaction_uuid: esewaPurchase.id,
      product_code: "EPAYTEST",
      signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
      ...overrides,
    }
    const message = fields.signed_field_names.split(",").map(name => `${name}=${fields[name]}`).join(",")
    const signature = crypto.createHmac("sha256", secret).update(message).digest("base64")
    return encodeURIComponent(Buffer.from(JSON.stringify({ ...fields, signature })).toString("base64"))
  }
  for (const [label, data] of [
    ["badly signed", esewaData("attacker-key")],
    ["validly signed with the public sandbox key", esewaData("8gBm/:&EnhH.1/q")],
  ]) {
    const response = await fetch(`${BASE_URL}/api/payments/esewa/return/${esewaPurchase.id}?data=${data}`, { redirect: "manual" })
    const status = (await one(`select status from purchases where id = $1`, [esewaPurchase.id])).status
    check(
      `forged eSewa success (${label}) does not complete the purchase`,
      response.status === 303 && status === "pending" && (await accessFor(attacker.id)) === 0,
      `http ${response.status} -> ${response.headers.get("location")}, status=${status}`,
    )
  }
  const esewaEvent = await one(
    `select outcome, "gatewayStatus" from payment_events where "purchaseId" = $1 order by "createdAt" desc limit 1`,
    [esewaPurchase.id],
  )
  check(
    "the eSewa return route asked the real sandbox status API",
    esewaEvent?.gatewayStatus === "NOT_FOUND",
    `last event: ${JSON.stringify(esewaEvent)}`,
  )

  const failureResponse = await fetch(`${BASE_URL}/api/payments/esewa/failure/${esewaPurchase.id}`, { redirect: "manual" })
  check(
    "esewa failure route -> failure page, purchase unchanged",
    failureResponse.status === 303 &&
      failureResponse.headers.get("location")?.includes("/products/purchase-failure") &&
      (await one(`select status from purchases where id = $1`, [esewaPurchase.id])).status === "pending",
    failureResponse.headers.get("location"),
  )

  const khaltiResponse = await fetch(
    `${BASE_URL}/api/payments/khalti/return/${khaltiPurchase.id}?pidx=forged&status=Completed&amount=99900`,
    { redirect: "manual" },
  )
  check(
    "khalti return with forged query params does not complete the purchase",
    (await one(`select status from purchases where id = $1`, [khaltiPurchase.id])).status === "pending" && (await accessFor(attacker.id)) === 0,
    `http ${khaltiResponse.status}`,
  )

  // Fonepay status: owner only
  const fonepayPurchase = await pendingPurchase("fonepay", creatorA.id)
  const fonepayStatus = async token =>
    (await fetch(`${BASE_URL}/api/payments/fonepay/status/${fonepayPurchase.id}`, { headers: token ? { Cookie: sessionCookie(token) } : {} })).status
  check("fonepay status: another user gets 404", (await fonepayStatus(attacker.token)) === 404)
  check("fonepay status: signed-out gets 404", (await fonepayStatus()) === 404)
  check("fonepay status: owner gets 200", (await fonepayStatus(creatorA.token)) === 200)

  // Admin re-check action
  r = await call("recheckPurchasePayment", [esewaPurchase.id], attacker.token)
  check("recheckPurchasePayment rejected for a normal user", r.status === 404, `http ${r.status}`)
  r = await call("recheckPurchasePayment", [esewaPurchase.id], admin.token)
  check("recheckPurchasePayment works for an admin", message(r.body) === "Gateway says the payment is still pending.", message(r.body))

  // Checkout page: only enabled gateways, test-mode banner
  const checkoutHtml = await (await fetch(`${BASE_URL}/products/${productB.id}/purchase`, { headers: { Cookie: sessionCookie(attacker.token) } })).text()
  check("checkout shows eSewa", checkoutHtml.includes("Pay with eSewa"))
  // Match the button label: the word "Fonepay" also appears in site-wide
  // meta/marketing copy.
  check("checkout hides Fonepay (no credentials)", !checkoutHtml.includes("Pay with Fonepay"))
  check(
    `checkout ${process.env.KHALTI_SECRET_KEY ? "shows" : "hides"} Khalti (${process.env.KHALTI_SECRET_KEY ? "test key set" : "no key"})`,
    checkoutHtml.includes("Pay with Khalti") === Boolean(process.env.KHALTI_SECRET_KEY),
  )
  check("checkout shows the TEST MODE banner in sandbox", checkoutHtml.includes("TEST MODE"))

  // initiatePurchase tampering
  const privateProduct = await one(
    `insert into products(name, description, "imageUrl", "priceInRupees", status, author_id)
     values ('B private', 'd', '/p.png', 500, 'private', $1) returning id`,
    [creatorB.id],
  )
  const initiate = (args, token = attacker.token, productId = productB.id) =>
    callAction(actionByName("initiatePurchase"), [args], token, productId)
  const purchaseCount = async () => (await one(`select count(*)::int n from purchases where "userId" = $1`, [attacker.id])).n
  const purchasesBefore = await purchaseCount()
  r = await initiate({ productId: privateProduct.id, gateway: "esewa", idempotencyKey: `${crypto.randomUUID()}:esewa` })
  check("initiatePurchase rejects a private product", r.body.includes('"error":true') && (await purchaseCount()) === purchasesBefore, message(r.body))
  for (const gateway of ["free", "fonepay", "stub"]) {
    r = await initiate({ productId: productB.id, gateway, idempotencyKey: `${crypto.randomUUID()}:${gateway}` })
    check(`initiatePurchase rejects gateway "${gateway}"`, r.body.includes('"error":true') && (await purchaseCount()) === purchasesBefore, message(r.body))
  }
  // The payments section left the attacker a pending eSewa checkout of
  // product B (inserted directly, with no gateway page). A new checkout
  // would correctly be told to wait for it, so close it first.
  await q(`update purchases set status = 'failed' where id = $1 and status = 'pending'`, [esewaPurchase.id])
  r = await initiate({
    productId: productB.id,
    gateway: "esewa",
    idempotencyKey: `${crypto.randomUUID()}:esewa`,
    pricePaidInPaisa: 100,
    amountInPaisa: 100,
    priceInRupees: 1,
  })
  const tampered = await one(`select "pricePaidInPaisa", status from purchases where "userId" = $1 order by "createdAt" desc limit 1`, [attacker.id])
  check(
    "initiatePurchase ignores client amount fields (charges the product price)",
    tampered?.pricePaidInPaisa === 99900 && r.body.includes('"total_amount":"999.00"'),
    `charged ${tampered?.pricePaidInPaisa} paisa`,
  )

  // ---------------------------------------------------------------- transactions
  console.log("== transactions")
  // Successful multi-statement transactions
  r = await callAction(enroll, [freeProductB.id], attacker.token, freeProductB.id)
  const freePurchase = await q(`select status from purchases where "userId" = $1 and "productId" = $2`, [attacker.id, freeProductB.id])
  const freeAccess = await q(`select 1 from user_course_access where "userId" = $1 and "courseId" = $2`, [attacker.id, courseB.id])
  check("free enrollment commits purchase + access together", freePurchase.length === 1 && freePurchase[0].status === "completed" && freeAccess.length === 1, `http ${r.status}`)
  await q(`delete from user_course_access where "userId" = $1`, [attacker.id])

  r = await call(
    "createProduct",
    [{ name: `own-${run}`, priceInRupees: 300, description: "x", imageUrl: "/a.png", status: "private", categoryId: null, tagIds: [], courseIds: [courseA.id] }],
    creatorA.token,
  )
  const ownProduct = await one(`select id from products where name = $1`, [`own-${run}`])
  const ownLinks = ownProduct ? await q(`select 1 from course_products where "productId" = $1`, [ownProduct.id]) : []
  check("createProduct commits product + course links together", ownProduct != null && ownLinks.length === 1, `http ${r.status}`)

  // revokeAccess atomicity: make the ledger-reversal step (the LAST write in
  // the transaction) fail, and require that the earlier writes roll back.
  await q(`
    create or replace function smoke_block_refund() returns trigger language plpgsql as $$
    begin
      if new."entryType" = 'refund' and new."purchaseId" = '${purchase.id}' then
        raise exception 'smoke test: forced ledger failure';
      end if;
      return new;
    end $$;
    drop trigger if exists smoke_block_refund on ledger_entries;
    create trigger smoke_block_refund before insert on ledger_entries
      for each row execute function smoke_block_refund();
  `)
  try {
    r = await call("revokeAccess", [{ purchaseId: purchase.id }], admin.token)
    state = await one(`select status, "refundedAt" from purchases where id = $1`, [purchase.id])
    const accessRows = await q(`select 1 from user_course_access where "userId" = $1 and "courseId" = $2`, [creatorA.id, courseB.id])
    const refundRows = await q(`select 1 from ledger_entries where "purchaseId" = $1 and "entryType" = 'refund'`, [purchase.id])
    check(
      "revokeAccess rolls back completely when the ledger step fails",
      state.status === "completed" && state.refundedAt === null && accessRows.length === 1 && refundRows.length === 0,
      `http ${r.status}, status=${state.status}, access rows=${accessRows.length}, refund rows=${refundRows.length}`,
    )
  } finally {
    await q(`drop trigger if exists smoke_block_refund on ledger_entries; drop function if exists smoke_block_refund();`)
  }

  r = await call("revokeAccess", [{ purchaseId: purchase.id }], admin.token)
  state = await one(`select status, "refundedAt" from purchases where id = $1`, [purchase.id])
  const accessAfter = await q(`select 1 from user_course_access where "userId" = $1 and "courseId" = $2`, [creatorA.id, courseB.id])
  const refund = await q(`select "creatorEarningsPaisa" from ledger_entries where "purchaseId" = $1 and "entryType" = 'refund'`, [purchase.id])
  const net = (await one(`select coalesce(sum("creatorEarningsPaisa"), 0)::int n from ledger_entries where "purchaseId" = $1`, [purchase.id])).n
  check(
    "admin revokeAccess: refunded + access removed + ledger reversed",
    state.status === "refunded" && state.refundedAt != null && accessAfter.length === 0 && refund.length === 1 && net === 0,
    `status=${state.status}, access rows=${accessAfter.length}, refund=${refund[0]?.creatorEarningsPaisa}, net=${net}`,
  )
  r = await call("revokeAccess", [{ purchaseId: purchase.id }], admin.token)
  const refundCount = (await one(`select count(*)::int n from ledger_entries where "purchaseId" = $1 and "entryType" = 'refund'`, [purchase.id])).n
  check("revokeAccess is idempotent (no second ledger reversal)", refundCount === 1, `refund rows=${refundCount}`)

  r = await call("hideReview", [review.id, true], admin.token)
  check("admin hideReview works", (await one(`select is_hidden from course_reviews where id = $1`, [review.id])).is_hidden === true)

  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0
}

main()
  .then(ok => {
    process.exitCode = ok ? 0 : 1
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 2
  })
  .finally(() => db.end())
