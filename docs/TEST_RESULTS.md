> Historical report from the earlier database pass. Current UI, browser and security evidence: [FILECRAFT_FINAL_QA_REPORT.md](FILECRAFT_FINAL_QA_REPORT.md).

# Actual verification ? 13 November 2026

| Check | Result | Evidence / limitation |
|---|---|---|
| npm.cmd run typecheck | VERIFIED | Exit 0; application TypeScript passes. Optional uninstalled Playwright sources excluded. |
| npm.cmd test | VERIFIED | 19 tests pass; 11 PDF engine operations produce parseable output. |
| npm.cmd run db:init | VERIFIED | Ran against existing filecraft database, CREATE TABLE IF NOT EXISTS and INSERT IGNORE; no resets. |
| npm.cmd run db:verify | VERIFIED | SELECT 1, selected database, six required tables and index inventory pass. |
| npm.cmd run test:auth | VERIFIED | Passed against local dev server and final production server on port 3100. |
| npm.cmd run build | VERIFIED | Exit 0, compiled and generated 81 pages into .next-production. ESLint absent warning and webpack cache warnings remain. This does not constitute a lint pass. |
| npm.cmd run check:source | VERIFIED | 48 routed tool definitions, six deferred; inventory only. |
| npm.cmd run lint | BLOCKED | ESLint missing. Install attempt failed EACCES in sandbox and ENETUNREACH after elevated retry. |
| npm.cmd run test:browser | BLOCKED | Playwright unavailable; dependency installation failed. No viewport/browser or download UI verification claimed. |
| Public HTTP smoke | VERIFIED | Production /, /tools, /login, /register, /dashboard, /pricing, /privacy, /robots.txt, /sitemap.xml and /ads.txt return 200. Rendering is not browser interaction verification. |
| Hostinger | BLOCKED | No deployed-site access/tests. |

Auth test exercises real signup, duplicate rejection, normalized email, stored scrypt hash, persisted Free subscription, HttpOnly cookie, authenticated session, wrong-password rejection, exact-origin CSRF rejection, admin denial, profile update, activity write/read, password change with session revocation, session expiration, re-login and logout. Only the uniquely generated @example.invalid account is deleted afterward; related test subscriptions/sessions/activity cascade. Existing users/records are retained. No payment is processed.

Observed production failure and fix: a concurrently running development server overwrote .next/server/app-paths-manifest.json with a partial development manifest. Production APIs returned 500 although direct handlers worked. Production output now uses .next-production while development retains .next. Rebuild and production API integration pass after this correction.

Local DATABASE_URL already selected filecraft. Its credentials were not displayed or changed. Missing original tables were created after the user created the database. Local public URL changed from a placeholder to http://localhost:3000; production requires a real HTTPS domain and rebuild. Server reports MySQL Community Server - GPL, version 26.7.0; MySQL 8 compatibility still needs target verification.

Unverified: remaining 37 conversion engines with real browser fixtures; visual fidelity/content checks for numbering and watermark; responsive interactions, Lighthouse, SMTP, reset/verification/deletion, certified CMP, billing/webhooks, full admin management, dependency vulnerability audit and deployed-site operations.

Files changed or added in this implementation (plus this report):

- .env.example
- .gitignore
- README.md
- app/api/activity/route.ts
- app/api/admin/activity/route.ts
- app/api/admin/stats/route.ts
- app/api/auth/me/route.ts
- app/api/auth/register/route.ts
- app/api/health/route.ts
- app/dashboard/page.tsx
- app/globals.css
- app/layout.tsx
- catalog/tools.json
- components/AuthForm.tsx
- components/ToolProcessor.tsx
- docs/HOSTINGER_DEPLOYMENT.md
- lib/auth.ts
- lib/browser-engine.ts
- lib/db.ts
- lib/site.ts
- next.config.mjs
- package.json
- scripts/init-db.mjs
- sql/schema.sql
- tsconfig.json
- .eslintrc.json
- app/api/account/route.ts
- app/api/plans/route.ts
- components/AccountSettings.tsx
- docs/ADSENSE_READINESS.md
- docs/FEATURE_VERIFICATION.md
- docs/MYSQL_BEEKEEPER_SETUP.md
- docs/RELEASE_CHECKLIST.md
- docs/SECURITY_REVIEW.md
- docs/SEO_AUDIT.md
- docs/SETUP_WINDOWS.md
- playwright.config.ts
- scripts/test-auth.mjs
- scripts/verify-db.mjs
- tests/browser/site.spec.ts
- tests/processing.test.mjs
