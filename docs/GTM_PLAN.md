# Chiyali Go-To-Market Plan

**Goal:** real creators publishing and real students paying, as fast as possible. Anything not needed for that waits until after launch.

Last updated: 2026-10-04. The checklist of what's left is [GTM_TODO.md](./GTM_TODO.md); ready-to-send messages, scripts and drafts are in [GTM_OUTREACH_KIT.md](./GTM_OUTREACH_KIT.md).

---

## Where we are

**The product is built.** Everything in the original launch plan (23 September) is done and live:
- **Trust and money:**
  - admin-only actions;
  - payment config with sandbox and live modes;
  - server-verified return routes and amount checks;
  - the reconciliation cron (on cron-job.org every 5 minutes) with failed and disputed states and a payment event log;
  - discount scoping;
  - refunds with a 7-day and 20% rule;
  - payouts with a 7-day hold, a row lock and phone verification;
  - a moderation queue.
- **Product:**
  - preview playback;
  - upload limits;
  - the free-tier video rules;
  - YouTube playlist import;
  - legal pages;
  - observability (GlitchTip, with Discord alerts);
  - the admin panel.
- **The Android app** (1.0.1) is in Google Play testing. It wasn't in the original launch plan.

The details live in the code and in [PAYMENTS.md](./PAYMENTS.md) (including the per-gateway go-live checklist), [SETUP.md](./SETUP.md) (database, storage, monitoring, deploys) and [MOBILE_API.md](./MOBILE_API.md).

**What's left is supply, demand and time:** courses from real creators, testers for Google's 14-day closed test, and the launch push.

---

## What we deliberately keep simple at launch

| Kept simple | How it works now | Build the real thing when… |
|---|---|---|
| Payouts | Creator requests; the founder pays by bank transfer or eSewa on a fixed weekly day, then marks it paid in `/admin/payouts` | More than 50 payouts a month, or payouts take more than 2 hours a week |
| Refunds | Money returned in the gateway's merchant dashboard; `/admin/refunds` fixes access and the ledger | More than 20 refunds a month |
| Moderation | Manual approval queue plus the report button; the founder checks the preview, description and creator | More than 30 submissions a week, or the first real piracy case |
| Video | Paid video on Bunny Stream (adaptive quality, signed player links, 5 GB per creator); free tier uses YouTube or Vimeo links | Bunny's bill passes about NPR 5,000 a month (then try its volume network), or creators need more than 5 GB as standard |
| Watermarking | The viewer's name and email drift over paid video; screen capture blocked in the app; 2 signed-in devices per account. No DRM | The first confirmed leak despite the watermark (then Bunny's MediaCage DRM) |
| Founding-creator deal | Badge and a home-page spot; any reduced fee is a manual top-up at payout time, tracked in a spreadsheet | More than one permanent commission tier |
| VAT on invoices | Not charged (`vatRatePercent: null`) | VAT registration (turnover threshold) |
| Gateways | eSewa only | Khalti and Fonepay as their merchant approvals come through (env vars only; see PAYMENTS.md) |
| Analytics | `/admin/launch` plus saved SQL ([WATCHLIST.sql](./WATCHLIST.sql)) | Signs of product-market fit |
| iOS | Not yet | An Apple developer account; then follow Apple's payment rules (no buy button or "buy on the website" in the iOS app) |

---

## Supply: the first 10–20 creators

**What a good first creator looks like:**
- Has an existing audience: a YouTube, Facebook or TikTok following, or classroom students. **Distribution matters more than polish at this stage.**
- Has at least 2 hours of recorded material, or can record it in two weeks.
- Owns the rights to it: no reuploaded coaching-centre recordings, no copied books.
- Can price at NPR 499–2,999, the impulse range for wallet payments.

**Who to target** (where Nepali learners already pay):
1. **Loksewa (PSC) exam prep tutors.** A huge, recurring market that already buys notes and online classes.
2. **Entrance prep:** IOE/CEE, CMAT/BBS and nursing-licence tutors, many of them at Putalisadak or Bagbazar coaching centres, who want their own brand.
3. **Language tutors for work and study abroad:** EPS-TOPIK Korean, Japanese JLPT/NAT, IELTS/PTE.
4. **Nepali tech and skills YouTubers** with 10k–200k subscribers: coding, Excel/Tally/accounting, design, digital marketing, freelancing.
5. **CA/CS/ACCA and +2 subject teachers** with established followings.

**How:** shortlist 60 → personal message → a 10-minute call by the founder → **20 calls → 15 committed → 10–15 published.** The messages, call script and onboarding checklist are in the [outreach kit](./GTM_OUTREACH_KIT.md).

**What we do for them:**
- set up their profile and first course (from a YouTube playlist or a Drive folder);
- write the description and make the thumbnail;
- give them their `?ref=` link and a launch promo code;
- the Founding creator badge, and a home-page spot;
- pay them weekly, with a direct WhatsApp line to the founder. Payout trust is why creators stay.

**Ready for the public launch when:**
- at least 10 approved courses with a playable preview;
- across at least 3 topics;
- at least 5 creators have posted about Chiyali to their audience.

## Demand: Nepal-specific channels

In priority order:
1. **Creators' own audiences through their `?ref=` links.** The main channel: creators keep 70% on their own traffic, so they're motivated to share.
2. **Facebook groups and pages:** Loksewa, entrance-prep, EPS-TOPIK and IT-jobs groups. Post the free preview lesson as the hook, never a bare sales link.
3. **TikTok, Reels and Shorts:** 30–60-second clips from preview lessons, in Nepali, made by the creators.
4. **Viber and Messenger groups** that tutors already run for their batches.
5. **Launch-week promo codes:** creator-scoped, 30–50% off for the first 72 hours.
6. **Campus ambassadors** at TU colleges, Pulchowk/Thapathali, KU and Pokhara, run by hand at first (see the kit).
7. **Tech and startup press** at the public launch: Techpana, TechLekh, ICT Samachar.
8. **Later:** eSewa and Khalti offers pages (a partnership ask once there's volume), SEO for exam-prep keywords, and paid ads only once conversion is known.

**Messages that matter:** pay in rupees with eSewa · learn on your phone · a certificate with a QR code employers can verify · learn from teachers you already follow.

---

## Launch stages and success metrics

| Stage | When | What happens | Success looks like |
|---|---|---|---|
| **1. Creator beta + closed test** | Now → about 20 Oct | First creators publish with our help; 15–20 testers on the Play closed test for 14 days | At least 10 approved courses; every preview plays on a mid-range Android over 4G; 12+ testers opted in for 14 days; no crash patterns in GlitchTip |
| **2. Soft launch, real money** | As soon as courses are live | Live payments (eSewa); traffic **only** from creators' own audiences, no press | First **100 paid purchases**; checkout success (completed ÷ started) **at least 85%**; **no** paid-without-access case older than 24 hours; refund rate **under 5%**; first weekly payout on time; first support reply within 12 hours |
| **3. Public launch** | After Play production approval, late October | Press, ambassadors, Facebook and TikTok push, launch promo week | Weekly paid purchases and revenue growing week over week; product-page conversion **at least 1.5%**; **at least 50%** of sales through creators' links; **at least 60%** of creators with a sale; lesson-1 completion by **at least 60%** of buyers; at most 5 support tickets per 100 orders |

`/admin/launch` shows these numbers.

## Risks

| Risk | Likelihood / impact | What we do |
|---|---|---|
| Too few courses at launch | High / blocks launch | Founder calls now; YouTube playlist import for fast free courses; we do the setup |
| Not enough Play testers, or they drop out | Medium / delays the app | Recruit 15–20, not 12; ask creators and their students |
| Paid but no access (tab closed, network drop) | Medium / destroys trust | Payment cron every 5 minutes, admin Re-check, "I was charged" support path, daily watchlist |
| Creators leave after slow first sales | High / supply collapses | Launch kit, founder check-ins, home-page features, weekly payouts |
| Piracy: screen recordings or reuploads | High eventually / creators leave | Signed Bunny links, a name-and-email watermark, screen capture blocked in the app, 2 devices per account; DMCA page and fast takedown; close the leaking account |
| Video playback on slow mobile data | Medium / refunds | 720p H.264 guidance and upload limits; YouTube links for free and preview lessons |
| The 50% fee on Chiyali-sourced sales feels high | Medium | Lead with "70% on your own audience"; review the rates after 90 days with data |
| Content-rights disputes | Medium | Rights promise in the Creator Terms; manual approval; fast takedown |
| Tax and legal readiness (company, PAN, TDS on payouts, VAT threshold) | Medium | Accountant before the first payout; register for VAT when required |
| One admin doing everything | High at launch | Fixed routines (daily approvals, weekly payouts); delegate support after 100 orders a week |
| Only one payment gateway | Medium / lost sales when eSewa is down | Apply for Khalti and Fonepay; turning them on is env vars only |

## Watchlist for the first 30 days

Run [WATCHLIST.sql](./WATCHLIST.sql) daily (read-only) and check GlitchTip:
- purchases pending for more than 1 hour (should be about 0), and disputed ones;
- checkout success rate per day;
- refund requests pending, and refund rate per course (look at any course above 10%);
- payout requests pending, and how long they've waited;
- courses waiting for review, and new reports;
- sign-up → first purchase, and the share of sales through `?ref=` links;
- creators with no sales yet (they get a check-in call).

## Assumptions

- **Commission:** Chiyali keeps 30% on sales through the creator's own link (the creator keeps 70%) and 50% otherwise (`apps/web/src/lib/comissionRate.ts`).
- **Refunds:** within 7 days and under 20% of the course watched, as in the code and the Terms.
- **Hosting:** Vercel, with the payment cron on cron-job.org and Postgres on Neon.
- **Gateways:** eSewa first; Khalti and Fonepay depend on merchant approval (Fonepay may need a fixed server IP; ask early).
- **Legal text** should be reviewed by a Nepali lawyer (status in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md)).
