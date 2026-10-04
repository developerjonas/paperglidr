# Unit economics: what a sale earns, what it costs, and how Chiyali stays profitable

Written 2026-10-04 with prices checked that day on each provider's pricing page. All money is in NPR at **USD 1 = NPR 150** (the rate was about 144–152 in 2026). The numbers come from a small model; change an assumption and the conclusions mostly hold, because infrastructure is a small share of the money.

**The short version:**
- **Video is not the cost-eater:** free courses use YouTube (cost 0), and paid video streams from Cloudflare R2, which charges **nothing for bandwidth**. Delivering a whole course to one buyer costs about **NPR 0.20**.
- **The real costs per sale** are the creator's share (50–70%), the payment gateway fee (about 3%), and possibly **VAT (13%)**. The VAT question is the single biggest open number.
- **Fixed running costs** are about **NPR 6,000–14,000 a month**. That's covered by roughly **17–37 sales a month at NPR 999**.
- **To pay one salary and a marketing budget**, you need about **400+ paid sales a month**. Growth (sales volume) is the whole game, not cost-cutting.

---

## 1. What we pay for (October 2026 prices)

| Service | What it does for Chiyali | Price | Today |
|---|---|---|---|
| **Vercel Pro** | Hosts the website and the app's API | $20/month, includes $20 usage credit and 1 TB transfer; then $0.15/GB. Hobby is not allowed for commercial use | ~NPR 3,000/month |
| **Neon** (Launch plan) | The Postgres database (Singapore) | $0.106 per CU-hour + $0.35/GB-month storage; no minimum. Always-on at 0.25 CU ≈ $19/month; 1 CU ≈ $77/month | ~NPR 3,000/month |
| **Cloudflare R2** | Paid lesson videos, PDFs, invoices, images | Storage **$0.015/GB-month**; reads $0.36 per million; **bandwidth (egress) free**. Free tier: 10 GB, 1M writes, 10M reads a month | ~NPR 0–750/month at launch |
| **YouTube / Vimeo** | Free lessons and previews | Free | NPR 0 |
| **Bunny Stream** (not used yet) | Adaptive video (HLS) if R2 MP4 isn't smooth enough on slow 4G | Storage from $0.01/GB; delivery **$0.03/GB in Asia** (standard) or $0.005/GB (volume network); encoding free; $1 minimum | NPR 0 until switched on |
| **Resend** | Invoices, password resets, notifications | Free: 3,000 emails/month, **100 a day**. Pro $20/month for 50,000 | NPR 0 now; NPR 3,000 once over 100 emails a day |
| **GlitchTip** | Error reports | Free: 1,000 events/month; $15/month for 100,000 | NPR 0 now |
| **Expo EAS** | App builds | Free: 15 Android builds a month; Starter $19/month | NPR 0 |
| **eSewa** (Khalti, Fonepay later) | Taking payments | A % of each payment, set in the merchant agreement (not public). **Assumed 3%** here; use your real rate | ~3% of every sale |
| **SMSPasal** | Instructor phone OTP | A few rupees per SMS; creators only | Negligible |
| **cron-job.org**, Google Search Console | Payment cron, SEO | Free | NPR 0 |
| **Google Play** / **Apple** | App stores | $25 once / $99 a year (later) | Paid / later |
| **Domain** | chiyali.com | ~$15 a year | ~NPR 190/month |

**Fixed monthly total:**
- **About NPR 6,200** at launch (Vercel, Neon, domain; everything else on free tiers).
- **About NPR 13,700** once email, errors and the database grow (Resend Pro, GlitchTip, more Neon compute).

---

## 2. Video: what it really costs

**Assumptions:**
- Creators upload 720p H.264 at about 2 Mbps (the upload guidance), which is **0.9 GB per hour of video**.
- An average paid course is 6 hours: **5.4 GB stored**.
- A buyer watches about 60% of it, including rewatches: **3.2 GB delivered per buyer**.

| | R2 (today: MP4 from R2) | Bunny Stream, Asia standard | Bunny Stream, volume network |
|---|---|---|---|
| Delivering one course to one buyer | **NPR 0.17** (only read requests; bandwidth free) | **NPR 14.6** | NPR 2.4 |
| Storing one 6-hour course, per month | **NPR 12** (NPR 146 a year) | ~NPR 20 (several renditions) | ~NPR 20 |
| Storing 100 courses, per month | ~NPR 1,200 | ~NPR 2,000 | ~NPR 2,000 |
| Free learners on YouTube previews and free courses | **NPR 0** | NPR 0 | NPR 0 |

**What this means:**
1. **R2's free bandwidth is why video isn't a cost problem.** Hosting the same video on a normal CDN or S3 would cost about NPR 15–40 per buyer. On R2 it's well under a rupee.
2. **Free learners cost nothing.** The free-tier rule (free courses and previews must use YouTube/Vimeo links, enforced in `features/lessons/lib/freeTier.ts`) means the people who pay nothing also cost nothing to serve. **Keep that rule.**
3. **Switching to Bunny later is affordable.** If buyers on slow 4G complain about buffering (MP4 has no adaptive quality), HLS on Bunny costs about NPR 15 per buyer: **about 1.5% of a NPR 999 sale**. Switch when playback complaints pass about 5% of tickets, not before.
4. **Storage grows forever; bandwidth doesn't.** Every uploaded file is paid for monthly, sold or not. 1 TB on R2 is only NPR 2,250 a month, but set limits anyway (see section 6).

---

## 3. One sale, rupee by rupee

Commission today (`apps/web/src/lib/comissionRate.ts`):
- **Through the creator's own link:** Chiyali keeps **30%**, the creator **70%**.
- **Chiyali brought the buyer:** Chiyali keeps **50%**, the creator **50%**.
- The gateway fee is absorbed by Chiyali, not deducted from creators (per the Creator Terms).

**A NPR 999 course:**

| | Chiyali brought the buyer | Creator's own link |
|---|---|---|
| Buyer pays | 999 | 999 |
| Creator's share | 499.5 | 699.3 |
| Chiyali's fee | **499.5** | **299.7** |
| − eSewa fee (3% of 999) | −30.0 | −30.0 |
| − video delivery (R2) | −0.2 | −0.2 |
| **Chiyali keeps** | **≈ 469** | **≈ 270** |
| …if delivered with Bunny Asia | ≈ 455 | ≈ 255 |
| …if VAT 13% is due on the **whole** price (see section 4) | **≈ 355** | **≈ 155** |

**At other prices** (Chiyali's margin, R2 video, no VAT):

| Price | Chiyali brought the buyer | Creator's own link |
|---|---|---|
| NPR 299 | 140 | 81 |
| NPR 499 | 234 | 135 |
| NPR 999 | 469 | 270 |
| NPR 1,499 | 704 | 405 |
| NPR 1,999 | 939 | 540 |
| NPR 2,999 | 1,409 | 810 |

**Refunds** (7 days, under 20% watched): Chiyali gives back its fee and the creator's share is reversed. The gateway fee is probably **not** returned by eSewa (confirm), so each refund costs about 3% of the price. At a 5% refund rate that's about NPR 1.5 per sale on average: small, as long as refunds stay rare.

---

## 4. VAT: the biggest open number (decide with an accountant before real sales)

Nepal's VAT is 13%. Whether and how Chiyali charges it changes the margin more than anything technical:

| How Chiyali is set up | VAT on a NPR 999 sale | Chiyali keeps (platform sale / link sale) |
|---|---|---|
| Not VAT-registered yet (below the registration threshold) | 0 | 469 / 270 |
| VAT-registered, **agent model**: VAT only on Chiyali's commission | 13% of the fee: ~65 / ~39 | ~404 / ~231 |
| VAT-registered, **seller of record**: VAT on the whole price (prices are VAT-inclusive) | 999 × 13/113 = **115** | **355 / 155** |

Today the invoice names **Chiyali as the seller** (`invoices.sellerName`), which points to the third row once registered. On creator-link sales, that would take **43% of Chiyali's margin**.

**Questions for the accountant:**
1. What is the VAT registration threshold for this kind of service, and when do we cross it?
2. Can Chiyali act as an **agent** (VAT on the commission only), with creators as the sellers?
3. If not, should the creator's share be calculated on the price **after VAT**? That's common for marketplaces, but it would need a Creator Terms change.
4. Must TDS be withheld on creator payouts? That's the creator's tax, not a Chiyali cost, but it's paperwork and cash flow.

---

## 5. Break-even and what profitability needs

**Fixed costs only** (NPR 6,200–13,700 a month), with an average margin of NPR 370 per NPR 999 sale on a 50/50 mix of link and platform sales:

| Goal | Sales a month needed |
|---|---|
| Cover infrastructure at launch | **≈ 17** |
| Cover infrastructure once growing | **≈ 37** |
| Plus one salary (NPR 80,000) and NPR 50,000 marketing | **≈ 410** |

**At 1,000 paid sales a month** (NPR 999 average, half through creators' links):

| | NPR / month |
|---|---|
| Sales (GMV) | 999,000 |
| Chiyali's fees | 399,600 |
| − eSewa fees (3%) | −29,970 |
| − video delivery (R2) / (Bunny Asia) | −175 / −14,580 |
| − video storage (100 courses) | −1,215 |
| − infrastructure at that scale (~$150) | −22,500 |
| **Left before people, marketing and tax** | **≈ 345,700** (87% of fees) |
| …if VAT on the whole price | ≈ 230,800 |
| …if VAT on the commission only | ≈ 293,800 |

**Where the money actually goes**, from biggest to smallest:
1. creators' share;
2. VAT, depending on the structure;
3. people (support, moderation, payouts) and marketing;
4. payment fees;
5. infrastructure;
6. video.

---

## 6. Pricing strategy and rules to stay profitable

**Prices:**
1. **Paid courses in the NPR 499–1,999 band**, with NPR 999–1,499 as the sweet spot. That's impulse range for wallet payments, and big enough that fixed costs per sale don't matter.
2. **A floor of NPR 299 for paid courses.** Below it, a link sale leaves Chiyali under NPR 80, and refunds or support eat that.
3. **Bundles at NPR 1,999–2,999** (several courses from one creator). One payment fee, a higher margin per buyer.
4. **Free courses (YouTube-based) stay free and unlimited.** They cost nothing and bring in students. This is the cheapest marketing Chiyali has.
5. **Launch promos (30–50% off for 72 hours) are fine.** Both shares shrink in proportion and the margin stays positive. Avoid going below the NPR 299 floor after discount.

**Commission:**
6. **Keep 70/30 (creator's link) and 50/50 (Chiyali's traffic).** Both leave healthy margins.
7. **Founding-creator deal:** a lower fee on **creator-link sales only** (e.g. Chiyali 20%, creator 80%) for 90 days. That still leaves about NPR 170 on a NPR 999 link sale, and platform sales stay 50/50. Write it into the Creator Terms before offering it.
8. **Consider deducting the payment fee before the split** (common on marketplaces). It adds about 1.5% of every sale to Chiyali's side. It's a Creator Terms change: announce it before the first payout, not after.

**Keep costs from creeping:**
9. **Keep the free-tier video rule** (free = YouTube links; paid = uploaded MP4). It's what makes free learners cost zero.
10. **A storage limit per creator** (e.g. 30 GB uploaded; ask for more), and **delete never-published drafts' videos after 90 days** with a warning email. Stops storage from growing for content that never sells.
11. **Keep video off Vercel.** Videos already stream straight from R2 via signed links, which is why Vercel's bandwidth isn't touched. Keep it that way (no proxying video through the app).
12. **Watch Vercel image optimisation** once there are thousands of thumbnails. Serving them from the R2 image domain as-is is free.
13. **Region:** the database is in Singapore. Put Vercel Functions in Singapore (`sin1`) too: faster pages for Nepal, and no cost difference.

**Later, once there's a large catalogue:**
14. **A subscription** (e.g. all Loksewa courses for NPR 499/month), once 15–20 courses exist in one topic. It turns one-off buyers into monthly revenue.
15. **Institution deals** (coaching centres buying seats in bulk).

---

## 7. Assumptions to replace with real numbers

| Assumption | Used | Where to get the real one |
|---|---|---|
| eSewa fee | 3% of each payment | Your eSewa merchant agreement |
| Is the gateway fee returned on refunds? | No | eSewa |
| VAT treatment | Three scenarios | Accountant |
| Video bitrate | 2 Mbps (0.9 GB per hour) | Look at real uploads in R2 |
| Average paid course length | 6 hours | The catalogue, once it exists |
| Share watched per buyer | 60% | Lesson progress data after launch |
| Mix of creator-link vs Chiyali sales | 50/50 | `/admin/commissions` ("Via their link") |
| Exchange rate | NPR 150 per USD | Bank rate when paying Vercel and Neon |
