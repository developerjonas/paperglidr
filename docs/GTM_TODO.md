# GTM TODO: what stands between Chiyali and launch

A plain checklist of what's left before go-to-market. The strategy is in [GTM_PLAN.md](./GTM_PLAN.md), ready-to-send messages in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-10-06.

**Legend:** 🔴 blocks the launch · 🟠 blocks the Play Store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now · ✍️ Claude can draft or prepare it; you review and finish

---

**The critical path now:** the closed test is live and passed review (6 Oct) → keep 12+ testers active for 14 days (until about **19–20 Oct**) → apply for production → Google's review. Realistic Play launch: **late October**. Use the 14 days for courses and creators (section 2); an empty catalogue won't keep anyone.

**Done on 4 Oct:** the first course is live (PHP for Beginners, free, by @devjonas); the reviewer account (`reviewer@chiyali.com`) is created and its password is in Play's Sign in details; free courses can be added in the app ("Enroll for free"); new Browse pages with topic cards.

**Done on 5 Oct:**
- `thedeveloperjonas@gmail.com` is admin in production.
- Both R2 buckets are tested end to end: images on `images.chiyali.com`, private files signed only, upload CORS for both domains.
- Paid video is on Bunny Stream, tested: signed player links only, a watermark, screen capture blocked in the app, 5 GB per creator, and 2 devices per account.
- Security: Next.js 15.5.27 (critical fixes), security headers, and patched dependencies; all tests and the 181-check security smoke test pass.
- Testers collected and the closed-test opt-in link sent; the Creator Terms accepted.
- The leaked Neon password and YouTube key rotated (Vercel and `.env` updated).
- Safety nets: Neon point-in-time restore, test alerts to Discord and email, billing alerts on Bunny, Cloudflare, Vercel and Neon.
- Docs and legal pages follow the move to Bunny: the privacy policy lists Bunny and YouTube/Vimeo, the watermark and the 2-device limit (also in the Terms); unit economics recalculated with Bunny's costs.

**Done on 6 Oct:**
- Play's **Misleading Claims** rejection (5 Oct) fixed: "not a government app" notice and official sources (psc.gov.np, ioe.tu.edu.np, epsnepal.gov.np) in the store listing, on the website and in the app.
- The photo permission (`READ_MEDIA_IMAGES`) that `expo-screen-capture` added is blocked; no declaration needed.
- App **1.0.2 (versionCode 5)** in closed testing, review passed; the opt-in link opens the Play Store page.
- Play developer page: icon and header in `~/Desktop/Chiyali-Play-assets/developer-page/`, promotional text in [GTM_STORE_TEXTS.md](./GTM_STORE_TEXTS.md).

## 1. This week

- [ ] 🟠 **Keep testers active** (Google's production application asks how they used the app): ask all 12+ to open it every 2–3 days (watch a lesson, enroll in a free course, ask a question) and to send a line of feedback ("Send private feedback" on the Play page, or WhatsApp). **Keep a feedback log**: who, what, what you changed.
- [ ] 🟠 **One small update mid-test (day 7–10):** fix 2–3 things testers reported, build and upload to closed testing. It shows Google the feedback was acted on. Claude can do the fixes and the build.
- [ ] 🟠 **Apply for production (about 19–20 Oct):** Dashboard → Apply for production. Google asks how testers were recruited, how they used the app, what feedback came in, what changed, and why it's ready. Claude drafts the answers from the feedback log.
- [ ] 🟡 **Developer page and name:** upload the developer icon and header, featured app Chiyali, website `https://www.chiyali.com`, the promotional text. Optional: change the developer name from "developerjonas" to **Paperglidr Technology** (Account details; Google may re-verify).
- [ ] 🟡 **Content rating label "In-App Purchases":** the app has no buy button. Check the content rating questionnaire's question on buying digital goods; "No" fits what the app itself does.
- [ ] 🟡 **Second admin:** no account with `jonasawasthi@icloud.com` exists in production yet (checked 5 Oct). Sign up once with exactly that email (or Google with that address), or tell Claude the address the account really uses.
- [ ] 🔴 **Real-money run-through on production:**
  - a Rs 10–50 eSewa purchase, then refund it;
  - upload a real paid video and play it on web and in the app;
  - password reset email, SMS OTP, a certificate, and a payout request.

## 2. During the 14 days

- [ ] 🔴 **10–15 approved courses across at least 3 topics** before the public launch, each with a free preview that plays on a mid-range Android over 4G.
- [ ] 🟡✍️ **Shortlist 60 creators:** Loksewa, IOE/CEE entrance, EPS-TOPIK/IELTS, Nepali tech YouTubers, accounting/Excel. Ranked by audience size. Claude can do a first pass from public searches; check follower numbers yourself, since they go out of date. Then a personal message for each (Claude drafts); send 5–10 a day.
- [ ] 🟡✍️ **Your own YouTube playlists as free courses:** send the playlist links; Claude imports each as a course (like PHP for Beginners). Counts toward the 10–15.
- [ ] 🟡 **Creator launch kit:** their `?ref=` link and a launch promo code (both built). Messages, the call script, a Reel/Short script and the poster brief are drafted in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md); Claude can make each creator's poster and thumbnail.

## 3. Business and money

- [ ] 🟡 **Tax on creator payouts:** whether TDS must be withheld on what we pay creators, and how it's reported. **(confirm with an accountant before the first payout)**
- [ ] 🟡⏳ **Fonepay:** ask early whether they need a fixed server IP; Vercel doesn't have one by default. Only eSewa is switched on today.

## 4. Marketing and launch

- [ ] 🟡✍️ **Brand accounts:** Facebook page, Instagram, TikTok, YouTube channel, a WhatsApp/Viber support number. Use the developer-page icon and header; Claude can write the bios and the first 10 posts.
- [ ] 🟡 **Creators' own audiences first** (their `?ref=` links earn them 70%). This is the main channel.
- [ ] 🟡 **Facebook groups** (Loksewa, entrance, EPS-TOPIK, IT jobs): post free preview lessons, not bare sales links. Course links show a share card with the title, teacher and price.
- [ ] 🟡 **Short videos:** 30–60 second clips from preview lessons, in Nepali, posted by the creators.
- [ ] 🟡 **Launch promo codes:** 30–50% off for 72 hours, creator-scoped.
- [ ] 🟡 **Campus ambassadors** (TU colleges, Pulchowk/Thapathali, KU, Pokhara). One-pager drafted in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md) §4; decide the reward first.
- [ ] 🟡 **Press** at public launch: Techpana, TechLekh, ICT Samachar. Press release and pitch email drafted in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md) §5; fill in the course numbers on launch day.

---

## Running Chiyali (routines, from the first sale)

- **Daily:**
  - work through the Overview's "Needs attention" cards;
  - approve submitted courses (`/admin/products`, "Waiting for review");
  - check stuck and disputed payments (`/admin/purchases`; open a payment to see its gateway events and Re-check it);
  - handle new reports and support tickets.
- **Weekly:**
  - pay creators (`/admin/payouts`) on a fixed day; `/admin/commissions` shows what each one is owed;
  - refunds are done by hand in the gateway dashboard, then marked in `/admin/refunds`;
  - glance at `/admin/launch` and call the creators it lists with no sale yet.
- **Support:** answer tickets within 12 hours. Saved replies are built into the admin ticket page (`features/support/lib/savedReplies.ts` to add more).
  - For "I paid but can't open my course": find the user in `/admin/users` and open the payment. If it was really paid, Re-check it, or give the course from their user page.
- **Alerts:** errors arrive in Discord (GlitchTip); payment cron failures arrive by email (cron-job.org).