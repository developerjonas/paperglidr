# Legal review checklist

For the lawyer reviewing Chiyali's policies before launch. The pages are written as complete drafts for a Nepal-based course marketplace. Nothing on the site is marked as a draft; review status is tracked **only here**.

**Last updated in code:** `LEGAL_LAST_UPDATED` in `apps/web/src/config/company.ts`.

## How the pages are built (so edits stay consistent)

- **Company details** (legal name, registered address, registration number, PAN, emails) come from **one file**: `apps/web/src/config/company.ts`. The registration number and PAN are `null` and display as "Registration in progress"; filling each one in is a one-line change.
- **Numbers** (refund window, completion threshold, platform fees, minimum payout, referral window, minimum description length) are not typed into the pages. They are read from the constants the code enforces, via `apps/web/src/config/policyTerms.ts`. **To change a number, change the code, not the text.** Otherwise the policy and the product would disagree.
- Pages live in `apps/web/src/app/(consumer)/<route>/page.tsx`.

## Status

| Page | Route | Status | Reviewer | Date |
|---|---|---|---|---|
| Terms of Service | `/tos` | ☐ Not reviewed | | |
| Privacy Policy | `/privacy` | ☐ Not reviewed | | |
| Refund Policy | `/refund-policy` | ☐ Not reviewed | | |
| Creator Terms | `/creator-terms` | ☐ Not reviewed | | |
| Content Policy | `/content` | ☐ Not reviewed | | |
| DMCA & Takedown Policy | `/dmca` | ☐ Not reviewed | | |
| Contact | `/contact` | ☐ Not reviewed | | |
| Legal index | `/legal` | ☐ Not reviewed | | |
| Footer company block | every page | ☐ Not reviewed | | |

## Decisions needed across all pages

1. **Company registration and PAN.** Both are pending. Confirm whether the site may operate publicly, and take payments, while it shows "Registration in progress", or whether launch must wait for both.
2. **E-commerce legislation.** Confirm whether Nepal's e-commerce legislation (for example the E-Commerce Act, 2081) applies. If it does, what must the site display: registration details, a grievance officer, a complaint procedure, response times? The old footer referred to an "E-Commerce Act" requirement, and the product doesn't implement one.
3. **Individual Privacy Act, 2075 and its Regulation, 2077.** Confirm which data-subject rights, consent requirements and response time limits must be stated. Confirm any grievance or privacy-officer requirement. The privacy policy states rights in general terms (access, correction, deletion, objection) without citing sections.
4. **Electronic Transactions Act, 2063.** Confirm that clickwrap acceptance (creating an account or buying means agreeing) is effective, and whether electronic invoices and records meet its requirements.
5. **Consumer Protection Act, 2075.** Confirm that the refund policy doesn't conflict with statutory consumer rights. The draft says the policy does not limit them.
6. **Tax.**
   - How long must purchase, invoice and payout records be kept? The privacy policy says "as long as Nepal's tax and accounting laws require" without a number.
   - Must Chiyali withhold tax (TDS) on creator payouts?
   - When does VAT registration apply? Invoices currently show no VAT and no PAN.
7. **Governing courts.** The ToS says "competent courts of Nepal". Decide whether to name a court (for example the Lalitpur District Court) and whether to add arbitration.
8. **Minimum age.** The drafts use 18, with under-18s allowed only with a parent or guardian, and creators 18+ only. Confirm this, and what "consent" requires in practice.
9. **Cross-border processing.** Cloudflare, Resend, Google and the hosting provider process data outside Nepal. Confirm whether consent or other safeguards are required.

## Page by page

### Terms of Service (`/tos`)
- **Assumed:** acceptance is clickwrap. It also assumes that access continues if a creator stops selling a course; the code does keep access.
- **Assumed:** a new liability cap: "the amount you paid us in the six months before the claim". Confirm or change.
- **Decide:** the suspension and termination wording, including closing accounts without notice for serious breaches.
- **Changed: product-page access claim.** The product page used to promise "Full lifetime access". It now says "Access for as long as Chiyali operates", because accounts can be closed, courses removed for policy breaches, or the platform shut down. That was the only place the phrase appeared. **Confirm** the new wording, and that "Certificate of completion" (also on that page) is acceptable.
- **Changed: marketing claims.** The home page used to say "No approval queue… no reviewer deciding if your course is good enough" and "no reviewer in the loop". Those lines are removed, because the policies reserve the right to remove content and task 18 may add review before publishing. The home page now says only that there is no application or waitlist to sign up.

### Privacy Policy (`/privacy`)
- **Assumed:** every data category and processor listed matches the current code.
  - Google and GitHub sign-in, including provider tokens stored with the account.
  - Session IP address and user agent.
  - Instructor phone numbers (only a hash of the OTP is stored).
  - Payout details: bank name, branch, account name and number, or an eSewa/Khalti wallet ID.
  - Gateway responses stored verbatim.
  - Invoices.
  - Progress, certificates and posted content.
  - A session cookie and a 30-day referral cookie.
  - Processors: eSewa, Khalti, Fonepay, Google, Cloudflare R2, Resend, SMSPasal, and the hosting and database providers.
- **Assumed:** no analytics or advertising cookies. None exist in the code today. **This must be updated if analytics are added.**
- **Decide: named providers.** The hosting and database providers aren't named yet; the assumption is Vercel plus managed Postgres. Name them?
- **Decide: specific retention periods** for account data after closure, logs, and support tickets.
- **Decide: breach notification.** The draft promises to notify users and authorities "as required by law". Confirm what the law requires.
- **Note:** there is no self-service account deletion. Deletion is by email request to legal@. Confirm this is acceptable.
- **Note:** anyone with a certificate's code can see the holder's name, course and date. The policy says so.

### Refund Policy (`/refund-policy`)
- **The rule is taken from the code** (`features/refunds/lib/eligibility.ts`):
  - the request must come within 7 days (168 hours) of when the order was placed, counted to the minute;
  - **and** strictly less than 20% of the course's lessons must be complete;
  - eligibility is judged at the time of the request.
- **Fixed (task 16):** the completion check now uses the purchase's courses (it used the product ID and always saw 0%). Buyers request refunds from the purchase page; an admin approves or rejects at /admin/refunds, and the buyer is emailed either way. Approval ends access and reverses the creator's earnings; the money is returned by hand in the gateway dashboard.
- **Implemented:** the bundle rule. Completion is measured across all the courses in the purchase taken together, as the draft says. **Confirm** that's the intended rule.
- **Decide:** the discretionary refunds wording: "may refund outside these conditions… e.g. materially different from description".
- **Decide:** whether to promise a processing time. The draft deliberately doesn't. Refunds are issued manually in each gateway's merchant dashboard.
- **Assumed:** refunds go only to the original payment method, for the amount actually paid, and access ends on refund.

### Creator Terms (`/creator-terms`)
- **The numbers are taken from the code:**
  - a platform fee of 30% when the buyer came through the creator's own `?ref=` link, clicked within the last 30 days (the last click wins), and 50% otherwise;
  - a minimum payout of NPR 1,000;
  - the fee is applied to the amount actually paid, after discounts;
  - a bundle's price is split equally across its courses;
  - payouts are manual, by bank transfer or to an eSewa/Khalti wallet, to the details the creator enters;
  - **new (fix/money-ops):** earnings from a sale are withdrawable only after that sale's refund window (7 days) closes, and a payout needs a verified mobile number;
  - a refunded sale is deducted from the creator's balance even after payout.
- **Decide:** the licence scope granted to Chiyali (hosting, streaming, and promotion using previews, titles and the creator's name). Should it survive after a creator leaves?
- **Decide:** who bears gateway fees. The code doesn't deduct them from creators, so the platform absorbs them. Confirm whether this should be stated.
- **Decide:** payout timing. None is promised. Add a service level, for example within 7 working days of a request?
- **Changed:** earnings from a sale are now held until its refund window closes (task 17), and payouts require a verified mobile number. The Creator Terms and the onboarding page say so; both read the rule from code. **Confirm** the wording.
- **Decide:** notice period for fee changes. The draft says "before the change takes effect" without a number.
- **Aligned:** the onboarding page used to say phone verification is "required before you can publish courses or receive payouts". It now matches the code and the terms: verification is optional and only raises the limit on how many products can be on sale at once.

### Content Policy (`/content`)
- The publishing requirements now match the code: a thumbnail and price, a description of at least 100 characters, at least one course, and a preview lesson with a video.
- **Removed claims that were false:** "downloads are traceable to the buyer" (buyer stamping isn't implemented).
- **Changed (task 18):** publishing now goes through an admin review (approve, or reject with a reason). Section 3 says so and that a review is not an endorsement. The "Report" button is back on product and lesson pages, and the policy points to it. **Confirm** the wording.
- **Decide:** the prohibited-content list for Nepal specifically, for example leaked exam papers, content involving minors, and hate speech.

### DMCA & Takedown Policy (`/dmca`)
- Framed as a DMCA-*style* process under the Copyright Act, 2059 and the Electronic Transactions Act, 2063, without claiming US law applies.
- **Replaced** the US "under penalty of perjury" wording with a plain statement that the information is accurate. Confirm whether a stronger declaration is needed under Nepali law.
- **Decide:** the **10 working days** a complainant has to start legal proceedings after a counter-notice, before content may be restored.
- **Decide:** whether a designated agent must be named.

### Contact and Legal index (`/contact`, `/legal`)
- Support: support@chiyali.com. Legal, copyright and privacy: legal@chiyali.com. Registered office: Lalitpur Metropolitan City, Ward No. 22, Lalitpur, Nepal.
- **Decide:** whether a phone number, office hours or a named grievance officer must be listed. See decision 2 above.

## Where the product and the policies still differ

Engineering follow-ups; the policies describe the intended behaviour.

| Policy says | Product today | Tracked |
|---|---|---|
| Refund if less than 20% complete | Enforced, across all courses in a bundle | Done (task 16) |
| Ask for a refund in the app or through support | "Request refund" on the purchase page; admins approve at /admin/refunds | Done (task 16) |
| Report content in the app or through support | "Report" on product and lesson pages; admins review at /admin/reports | Done (task 18) |
| Earnings clawed back after refunds | Yes; sales are held for the refund window before they can be withdrawn | Done (task 17) |
