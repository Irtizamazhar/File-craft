# FileCraft
Existing Next.js App Router + React + TypeScript + mysql2/promise application. The approved coral/navy/blush/lavender design is applied across public, tool, account and system screens. All existing tool routes and database records are retained.

## Windows startup
Use Node.js 22 LTS or another supported runtime. Keep .env.local private and point DATABASE_URL at the existing filecraft database. Beekeeper Studio is a database client. NEXT_PUBLIC_SITE_URL must match the actual local browser origin (normally http://localhost:3000).

~~~powershell
npm.cmd install
npm.cmd run db:verify
npm.cmd run dev
~~~

Open http://localhost:3000. Do not copy .env.example over your existing configuration.

For a new database only, npm.cmd run db:init creates missing tables and plan seeds without resetting records. Inspect the schema before applying it to an existing database. No migrations were needed during the UI redesign.

Production: npm.cmd run build then npm.cmd start. Development uses .next-development; production uses .next-production. Configure the real HTTPS public domain before a deployment build.

## Implemented workflows
- 48 existing browser document/image utilities with validated selection, actual processing and downloads.
- Homepage file selection handed directly to an explicitly chosen compatible tool in memory.
- Redesigned /tools directory: 51 entries, combined search/filters, desktop sidebar and mobile category sheet.
- /edit-pdf: real supported original object removal/replacement plus additions, page/history controls and PDF export.
- /remove-background: general-object BiRefNet Lite by default, optional portrait mode, subject-region selection, soft brushes/edges, history, transforms and alpha PNG export.
- /file-compressor: real PDF/image/Office/ZIP compression, per-format settings, byte savings and batch downloads.
- Database-informed Free plan/current account state; planned paid features labeled accurately.
- Account profile/password settings, activity, browser-local saved shortcuts, contact records.
- Cookie/features/conversion pages, tool-specific output/limitation content and FAQ.

No paid purchase activation, SMTP reset/verification, full editable Office reconstruction, OCR, account deletion or full admin management is claimed.

## Real verification
- npm.cmd run typecheck; npm.cmd run lint; npm.cmd test (24 passed); npm.cmd run build.
- npm.cmd run db:verify: real SELECT 1 and six tables/index inventories.
- npm.cmd run test:browser:chromium: latest background-remover run: 220 passed, 2 failed (the retained purple-lit laptop quality assertions). All 48 original tools passed on both profiles. Signup/contact write tests were excluded to preserve database records.
- npm.cmd run test:browser includes Firefox/WebKit, currently blocked by Windows DLL dependencies. This is not a claim of universal browser support.
- Browser tests default to localhost:3100; start a local app at that origin or set TEST_BASE_URL. See the final report for an isolated QA command.
- npm.cmd run test:auth performs real account writes and retains its clearly identified verification account under the no-deletion policy. Point it only at an authorized test environment.

Security updates include Next.js 15.5.29, MySQL2 3.24.6, Mammoth 1.13.0 and a PostCSS override. Remaining dependency findings and release limitations are documented. Never commit real credentials in .env.example or .env.local.

Advanced assets are already local. Build/postinstall copy runtime files from installed dependencies and verify the pinned portrait model checksum; production builds do not download models. General-object segmentation needs visual review: a purple-lit laptop still fails the quality fixture. The optional MODNet mode remains portrait-specific. PDF replacement uses supported top-level objects and Helvetica Latin/ASCII. OCR and media compression are not implemented. Dependency audit still reports one high and eight moderate findings.

The general-object model is already present locally. For a fresh checkout, run `node scripts/setup-object-model.mjs` before installation/build; the 192 MB weights are ignored by Git and validated against a pinned SHA-256. Model copying/builds remain offline after setup. See the background-remover report for current QA failures and performance limits.

## Handover
- [Background remover fix, real watch results and remaining quality failure](docs/FILECRAFT_BACKGROUND_REMOVER_QA.md)
- [Advanced upgrade, measured outputs, screenshots and limitations](docs/FILECRAFT_ALL_TOOLS_ADVANCED_UPGRADE.md)
- [Final QA, exact file inventory and startup](docs/FILECRAFT_FINAL_QA_REPORT.md)
- [Design system](docs/FILECRAFT_UI_DESIGN_SYSTEM.md)
- [Every tool status](docs/FILECRAFT_TOOL_VERIFICATION.md)
- [Initial audit](docs/FILECRAFT_INITIAL_AUDIT.md)
- [SEO audit](docs/FILECRAFT_SEO_AUDIT.md)
- [AdSense readiness](docs/FILECRAFT_ADSENSE_READINESS.md)
- [Hostinger deployment](docs/FILECRAFT_HOSTINGER_DEPLOYMENT.md)
- [MySQL setup](docs/MYSQL_BEEKEEPER_SETUP.md)

No Git push or production deployment was performed. Full public production readiness is not claimed.
