# CI/CD for Little Piano

GitHub Actions runs npm run check on pushes and pull requests: unit/catalogue tests, isolated PostgreSQL security tests, TypeScript checking and the production build. No Supabase credentials or repository secrets are needed. Browser/OAuth end-to-end tests are not included in this workflow.

Vercel and GitHub Actions run independently. vercel.json also sets the Vercel build command to npm run check, so a failed unit/database/type/build check prevents that deployment from publishing.

## One-time setup

1. Push these files to GitHub. A push to main triggers the connected Vercel production deployment.
2. Confirm CI / Tests and production build passes in GitHub Actions.
3. In Vercel, confirm the connected repository is Harry-Zhao-AU/LittlePiano and main is the production branch. Keep the two VITE_SUPABASE variables in Vercel. Confirm npm run check appears in the deployment build logs.
4. Optionally protect main with a GitHub ruleset requiring pull requests and the Tests and production build check. Availability depends on your GitHub plan and repository visibility. No second reviewer is necessary for a solo project.

## Updating the app

Create a branch, edit, run npm.cmd run check, commit the specific changed files, and push the branch. Open a pull request, review CI and the Vercel preview, then merge into main. Vercel automatically updates https://little-piano.vercel.app/ after a successful build.

Preview builds need Preview environment variables to connect to Supabase. Using the production Supabase project in a preview means reads and writes affect real progress. Google sign-in requires the exact preview URL in the Supabase redirect allowlist. Do not allow all vercel.app sites with a broad wildcard.

## Database changes remain manual

CI tests SQL locally; it never applies migrations or seeds to remote Supabase. Review and apply pending migrations before releasing app code that depends on them. Catalogue updates also require manually applying the reviewed generated seed. Never add administrative credentials to the frontend or this workflow.

For v0.2, apply `supabase/migrations/202609270007_everyday_management.sql` after migration 006 before deploying the matching frontend. No reseed is required. Ask users to refresh existing sessions. Once corrections or archived books exist, v0.1 is not a compatible rollback: it reads original ratings and does not filter archived books. Preserve the new records and deploy a compatible fix instead. See the README upgrade instructions for verification and data preservation details.

## Failed releases

Check GitHub Actions or Vercel logs, fix the branch and push again. Failed Vercel builds leave the previous successful deployment live. Revert a published code change with a new pull request; this does not revert database changes.
