# One Sentence at a Time

A collaborative, ever-growing story. Anyone can pay $1 to permanently add the
next sentence. No accounts. No clutter. Just the story.

---

## Stack

- **Next.js 14** (App Router) with **TypeScript**
- **Tailwind CSS** + a small set of custom CSS variables driving two themes
- **Supabase** for Postgres + Realtime
- **Stripe Checkout** (guest mode) for payments
- Hosted on **Vercel**

No component libraries. No analytics. The dependency tree stays tiny on
purpose.

---

## Local setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Provision Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   It creates the `sentences` table, an RLS policy that lets anyone read live /
   removed rows, adds the table to the `supabase_realtime` publication, and
   seeds the opening sentence.
3. Grab `Project URL`, `anon` key, and `service_role` key from
   *Project Settings → API* and paste into `.env.local`.

### 3. Stripe

1. Create a Stripe account (test mode is fine).
2. Copy your **publishable key** and **secret key** from the dashboard into
   `.env.local`.
3. For local webhook testing run:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   ```

   Paste the `whsec_…` value it prints into `STRIPE_WEBHOOK_SECRET`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

ADMIN_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`ADMIN_SECRET` is a string of your choice — it gates `/api/admin/remove`.

---

## How a sentence becomes permanent

1. User clicks **Write sentence #N — $1** and types in the modal.
2. `POST /api/checkout` runs the moderation check, atomically reserves the
   next `order_index` (retrying on a unique-constraint collision), inserts a
   row with `status = 'pending'`, and creates a Stripe Checkout Session whose
   metadata carries the sentence id.
3. The user pays in Stripe's hosted checkout (guest mode — no Stripe account
   required).
4. Stripe redirects them to `/s/[order_index]?fresh=1`.
5. In parallel, Stripe POSTs to `/api/webhook/stripe`. The webhook verifies
   the signature, looks up the sentence id from metadata, and flips
   `status` to `'live'`. Failed / expired sessions delete the pending row.
6. The Supabase Realtime subscription on the homepage picks up the new live
   row and animates it in.

If a `pending` row never converts (user closes the tab on the Stripe page),
the Stripe Checkout `session.expired` webhook (delivered ~24h after creation)
deletes it. You can also run a manual cleanup:

```sql
delete from sentences
 where status = 'pending'
   and created_at < now() - interval '1 hour';
```

Note: this can leave gaps in the visible sequence (e.g. live = 1,2,3,5).
That's an acceptable tradeoff for the simplest possible payment flow.

---

## Moderation

Pre-payment moderation lives in [`lib/moderation.ts`](./lib/moderation.ts) and
runs on every checkout request. It blocks:

- A small slur / abuse blocklist
- URLs and email addresses
- All-caps spam (12+ letters, fully uppercase)

Anything that gets through can be removed by the owner via:

```bash
curl -X POST https://your-site.com/api/admin/remove \
  -H "content-type: application/json" \
  -d '{"secret":"$ADMIN_SECRET","order_index": 312, "reason":"abuse"}'
```

Removed sentences stay in the feed but render as
*"[This sentence has been removed.]"* so `order_index` stays continuous.

---

## Theming

Themes are CSS-variable driven (`app/globals.css`) and toggled by setting
`data-theme` on the `<html>` element from
[`lib/theme.ts`](./lib/theme.ts). Settings persist to `localStorage` under the
key `osaat:settings:v1`.

Other settings (text size, spacing, focus mode, number / author / chapter
visibility) work the same way: each maps to a `data-*` attribute on `<html>`
and the CSS reacts. No re-render of every sentence is required when toggling.

---

## Performance

- The homepage and every `/s/[N]` page use **ISR** with `revalidate = 60`.
- Realtime subscriptions handle the gap between revalidations.
- Reads use Supabase's anon key + RLS (live + removed only); writes are
  exclusively performed by the service-role client on the server.
- The whole client bundle is ~125 kB First Load JS.

---

## Pricing tiers

Pricing is stored as actual cents paid in `paid_amount`. The base style costs
$1; **bold** and **italic** are $3. The `/api/checkout` endpoint accepts an
optional `amountCents` field so you can introduce tiered pricing later (e.g.
sentences 1001–2000 cost $2) without a migration.

---

## File map

```
/app
  page.tsx                       main story page (ISR)
  not-found.tsx                  404
  layout.tsx                     root layout, fonts, metadata
  globals.css                    theme variables + base styles
  /s/[index]/page.tsx            shareable sentence page (ISR + OG)
  /api/checkout/route.ts         create Stripe Checkout session
  /api/webhook/stripe/route.ts   webhook handler
  /api/admin/remove/route.ts     admin moderation endpoint
/components
  StoryFeed.tsx                  story rendering + realtime + modal launcher
  SentenceRow.tsx                single sentence row
  ChapterDivider.tsx             chapter break UI
  TopBar.tsx                     title, count, settings cog
  SettingsPanel.tsx              cog dropdown
  WriteModal.tsx                 write + payment flow
/lib
  supabase.ts                    public + service-role clients
  stripe.ts                      Stripe client (lazy)
  moderation.ts                  blocklist + URL/email checks
  theme.ts                       settings persistence + DOM application
  queries.ts                     shared SSR queries
/types
  index.ts                       Sentence, Settings, chapter helpers
/supabase/migrations
  0001_init.sql                  schema, RLS, seed
```

---

## Deploy

```bash
vercel --prod
```

Then in the Vercel dashboard:

1. Add every variable from `.env.example`.
2. In Stripe → *Webhooks*, point a live endpoint at
   `https://your-domain/api/webhook/stripe`. Copy the signing secret into
   Vercel as `STRIPE_WEBHOOK_SECRET`.
3. Set `NEXT_PUBLIC_SITE_URL` to your final domain.

That's it. Tell people the URL.
