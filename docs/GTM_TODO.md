# GTM TODO: what stands between Chiyali and launch

A plain checklist of what's left before go-to-market. The strategy is in [GTM_PLAN.md](./GTM_PLAN.md), ready-to-send messages in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-10-05.

**Legend:** 🔴 blocks the launch · 🟠 blocks the Play Store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now · ✍️ Claude can draft or prepare it; you review and finish

---

**The critical path now:** closed test approved → 12+ testers opted in for 14 days → apply for production. Realistic Play launch: **late October**.

**Done on 4 Oct:** the first course is live (PHP for Beginners, free, by @devjonas); the reviewer account (`reviewer@chiyali.com`) is created and its password is in Play's Sign in details; free courses can be added in the app ("Enroll for free"); new Browse pages with topic cards.

**Done on 5 Oct:**
- `thedeveloperjonas@gmail.com` is admin in production.
- Both R2 buckets are tested end to end: images on `images.chiyali.com`, private files signed only, upload CORS for both domains.
- Paid video is on Bunny Stream, tested: signed player links only, a watermark, screen capture blocked in the app, 5 GB per creator, and 2 devices per account.
- Security: Next.js 15.5.27 (critical fixes), security headers, and patched dependencies; all tests and the 181-check security smoke test pass.

## 1. This week

- [ ] 🟠⏳ **Testers: collect 15–20 Gmail addresses now** (message in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md) §2) and send the opt-in link as soon as the closed test is approved.
- [ ] 🔴 **Rotate the leaked keys:** the Neon database password and the YouTube API key were pasted in a chat. Neon → Roles → `neondb_owner` → Reset password; Google Cloud → Credentials → regenerate the key (or restrict it to the YouTube Data API). Then update Vercel and `apps/web/.env`.
- [ ] 🟡 **Second admin:** sign up with `jonasawasthi@icloud.com`, then Claude makes it admin.
- [ ] 🔴 **Real-money run-through on production:**
  - a Rs 10–50 eSewa purchase, then refund it;
  - upload a real paid video and play it on web and in the app;
  - password reset email, SMS OTP, a certificate, and a payout request.
- [ ] 🔴 **Safety nets:**
  - Neon point-in-time restore on (7+ days);
  - a test alert reaching Discord (GlitchTip) and email (cron-job.org);
  - billing alerts on Bunny, Cloudflare, Vercel and Neon.
- [ ] 🟡 **Accept the Creator Terms** in your own creator profile (`/instructors/onboarding`) before publishing more courses.
- [ ] 🟡 **App 1.0.2** (Bunny player with watermark, screen-capture block, Enroll for free, topic cards in Browse): build and upload to closed testing **after** Google finishes the current review. Claude can run the build.

## 2. During the 14 days

- [ ] 🔴 **10–15 approved courses across at least 3 topics** before the public launch, each with a free preview that plays on a mid-range Android over 4G.
- [ ] 🟡✍️ **Shortlist 60 creators:** Loksewa, IOE/CEE entrance, EPS-TOPIK/IELTS, Nepali tech YouTubers, accounting/Excel. Ranked by audience size. Claude can do a first pass from public searches; check follower numbers yourself, since they go out of date.
- [ ] 🟡 **Creator launch kit:** their `?ref=` link and a launch promo code (both built). Messages, the call script, a Reel/Short script and the poster brief are drafted in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md); Claude can make each creator's poster and thumbnail.

## 3. Business and money

- [ ] 🟡 **Tax on creator payouts:** whether TDS must be withheld on what we pay creators, and how it's reported. **(confirm with an accountant before the first payout)**
- [ ] 🟡⏳ **Fonepay:** ask early whether they need a fixed server IP; Vercel doesn't have one by default. Only eSewa is switched on today.

## 4. Marketing and launch

- [ ] 🟡 **Brand accounts:** Facebook page, Instagram, TikTok, YouTube channel, a WhatsApp/Viber support number.
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