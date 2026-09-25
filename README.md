# Little Piano

A Vue 3 + Vite + TypeScript app for one child using their adult’s Google session. Choose books, award separate 1–3 stars for Fluency, Dynamics, and Rhythm with optional feedback, and keep every assessment. No assessment is distinct from one star. Progress uses the **latest** assessment, not the highest score.

## Run locally

Requires Node 22.12+ (tested with Node 24) and npm. In Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
# Edit .env.local with your project URL and publishable key.
npm.cmd run dev
```

Open `http://127.0.0.1:5173`. The app displays setup instructions until configured. It never substitutes demo data for missing configuration or failed cloud requests.

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

Find these in your Supabase project’s connection/API settings. These two browser-facing values are sufficient. `.env.local` is ignored. Never put database passwords, service-role keys, secret API keys, Google client secrets or administrative tokens in frontend variables or source control. Restart Vite after changes. No remote changes have been made by the agent.

## Database setup — review before applying

Apply the four files in `supabase/migrations/` in filename order: `202609240001_initial.sql`, `202609240002_catalogue_selection.sql`, `202609250003_assessment_dimensions.sql`, then `202609250004_family_catalogue_sources.sql`. Skip any already applied. The third migration replaces the single overall score with three required scores. It expects no assessment records (as confirmed during design) and safely refuses to proceed if any exist; it never deletes them. The fourth permits explicit family-photo source identifiers alongside publisher HTTPS URLs; no photos are uploaded or made public. It targets Supabase PostgreSQL 15+ and relies on `auth.users`, `auth.uid()`, `anon` and `authenticated` supplied by Supabase.

For your existing free project, **when you are ready to apply it yourself**:

1. Review the migrations. In Supabase SQL Editor, run each pending file once, in order. Do not run it twice; future schema changes should be new timestamped migrations.
2. Run `npm.cmd run seed:generate` locally. This only generates `supabase/seeds/catalogue.sql`; it does not connect to any database.
3. Review the generated SQL, then run its contents in SQL Editor. The catalogue seed can be reapplied. Stable UUIDs and upserts preserve song references and assessments; no private rows are touched.

If using the Supabase CLI migration workflow instead, initialize the local CLI configuration, apply the migration to a local development instance first, and configure `[db.seed] sql_paths = ["./seeds/catalogue.sql"]`. Keep remote migration/deployment as a separate explicitly approved operation. Do not mix untracked SQL Editor changes with CLI migration history without reconciling that history.

The seed intentionally does not remove older catalogue rows. For a correction, keep each existing book/song key stable, modify metadata, regenerate, and review. The seed moves existing song orders to a temporary unused range within the same transaction before importing the reviewed order, avoiding `(book_id, sort_order)` collisions. Do not change song IDs to work around this: old assessments reference them.

## Google sign-in

Follow [Supabase’s Google provider guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

1. In Google Auth Platform, configure a consent screen and a Web application OAuth client. For an initial private test, add your adult Google account as an allowed test user.
2. Add `http://127.0.0.1:5173` as a JavaScript origin. Add the **Supabase callback URL** shown on its Google provider page as Google’s authorized redirect URI (typically `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
3. Enable Google in Supabase Authentication → Providers and enter the Google client ID and secret **there**, never in this app.
4. In Supabase URL configuration, set the local Site URL and allow `http://127.0.0.1:5173/` as an app redirect. If using `localhost`, allow that exact origin too.
5. Sign in, create a nickname, then select a book. The child stays within your session. Keep anonymous sign-ins and unused providers disabled.

There is one child per owner enforced by a unique constraint. Other authenticated accounts cannot access your child; there are no invitations, shared adults or roles. The Google test-user audience can restrict this initial installation to your account. The app is not an account-management product.

## Data and access rules

All six base tables have RLS. Catalogue tables are authenticated-read-only. Students, selected books and assessments are scoped through the child’s owner. Browser clients have only the column-level INSERT grants needed by the app, plus SELECT; no UPDATE or DELETE grants. Ownership, book relationships, creation timestamps and assessment history cannot be rewritten through the client. Account removal and corrections are outside this MVP UI.

The assessment insert trigger rejects any song outside the selected book and stamps server time. Fluency, dynamics, and rhythm are each required database-constrained integers from 1 to 3. There is no combined score. A song is well learned only when all three latest scores are 3. History remains append-only for future assessments. A stable per-submission UUID prevents a repeated network submission from creating another row; the UI also disables saving while a request is running. New intentional assessments receive new IDs.

`latest_assessments` uses `security_invoker=true`, so base-table RLS still applies. The app derives latest ratings from its loaded history using the same timestamp-descending/ID-descending tie break. Queries are paginated to avoid silently truncating history at the API row limit. Supabase’s authenticated client performs every normal operation. See [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Catalogue status

**9 books, 464 entries. My First A/B/C retain their complete page-indexed learning lists. All six Level 1, 2A and 2B books are reconciled against the family’s Progress Chart photos. All nine retained books now have chart-level coverage; edition and subsection limitations are documented below. Levels 3 and 4–5 are removed from the active catalogue.** See the review checklist for all titles, verified pages, unknown pages, and sources.

See [the coverage report](catalogue/COVERAGE.md) for counts, source URLs, edition details and missing information. The new seed hides the eight earlier US books from the chooser while retaining existing references. Those editions are archived in `catalogue/legacy-us.mjs`; a fresh seed imports only the requested 13.

Only metadata is stored. All book graphics in the UI are original CSS typography/shapes, not publisher covers. There are no sheet music files or recordings. Test fixtures live under `tests` / the test harness and are never imported into the real catalogue or application.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run test:db
npm.cmd run test:browser
```

- Unit suite: 26 cases for catalogue reconciliation, latest selection, ties, book/song isolation, unassessed vs one star, and input validation.
- Database suite: 59 checks running the **actual migration and seed in PGlite (PostgreSQL WASM)**. Tests create isolated Auth-compatible users and JWT subject settings, then switch to actual database roles. They cover saving/reloading, newest rather than highest rating, repeated seeds, duplicate submissions, invalid/fractional stars, wrong-book songs, anonymous denial, unrelated-account denial, forged ownership, relationship changes, immutable history, forged timestamps, and the RLS-respecting latest view. Nothing is sent to a remote database.
- Browser suite: six Playwright tests using isolated request fixtures. Tests cover sign-in gating; profile creation, book selection, double-submit protection, save/reload and history at 390/768/1280px; load errors; and save-error retry. It uses installed Google Chrome (`channel: 'chrome'`). To use Playwright Chromium, remove that setting and run `npx playwright install chromium`. Test fixtures are not proof of Supabase transport or OAuth correctness; the database suite separately exercises SQL security.
- Browser screenshots are written under ignored `test-results/` for layout review. Fonts use optional Google Fonts with system fallbacks.

On this Windows workspace, Playwright’s web-server teardown waited after the six test cases finished; stopping the Vite processes created by that test run allowed a clean exit (`6 passed`). If this occurs locally, stop only the test server on port 5174. You can also start a dedicated fixture-configured test server yourself and set `PLAYWRIGHT_REUSE_SERVER=1` for the test command. Never use real credentials on that fixture server.

**Still requires a configured Supabase environment:** a real Google consent/callback round trip; real PostgREST requests with project keys; session expiration/refresh; and cross-account checks against the deployed policies. Local SQL tests prove the migration behavior, not that the migration has been applied to your project. No remote migration, OAuth configuration, cloud assessment write or deployment has been performed.

After configuring the project, smoke-test by signing in as the owner, creating a child, selecting a book and saving two different ratings. Refresh: both should remain, and the newer should be current even if lower. In a separate unrelated Google session (temporarily allowed in the test audience), query the private tables and latest view: all must return no owner rows. An unauthenticated REST request must fail. Attempts to insert 0/4 stars or a song from another book must fail. Use only the publishable key and the respective users’ sessions; no administrative key is needed. Remove the extra test audience member afterwards.

## Vercel later

No deployment has been made. When you instruct deployment: import the repository with the Vite preset, install with `npm ci`, build with `npm run build`, and serve `dist`. Set both `VITE_SUPABASE_*` variables in Vercel before building. `vercel.json` includes SPA rewrites. Set the production origin in Supabase Site URL/redirect allowlist and Google authorized origins; the Google callback remains the Supabase callback. Only allow trusted preview origins if previews need login. See [Vercel’s Vite guide](https://vercel.com/docs/frameworks/frontend/vite).

## Files

- `src/App.vue`: sign-in, first-use profile, shelf, song list and rating/history screens.
- `src/lib.ts`: configured authenticated client, rating validation and latest selection.
- `supabase/migrations/`: versioned schema, permissions, RLS and integrity checks.
- `catalogue/`: reviewed metadata and coverage notes.
- `scripts/seed.mjs`: repeatable SQL generator; `supabase/seeds/catalogue.sql`: ready-to-review output.
- `scripts/test-db.mjs`, `src/lib.test.ts`, `tests/browser/`: isolated verification suites.
