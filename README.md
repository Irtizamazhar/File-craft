# FileCraft — Hostinger-friendly Next.js full-stack application

**Source release:** 12 November 2026. React 18 + Next.js 14.2.35, Next.js route-handler APIs, MySQL, browser-based file conversion. One project folder, one Node.js website, no companion backend application required.

## What it does

The public tool catalog exposes **48 browser-routed utilities**; six requested advanced utilities are intentionally deferred. Files opened for the listed conversion tools are processed *inside the visitor's browser*, and source document contents are not posted to the backend. Signed-in users can optionally record conversion-event metadata in MySQL. Server APIs handle accounts, sessions, messages, and admin reporting.

**Verification distinction:** Source code and routing checks are not equivalent to a successful Next.js build, real conversion tests in multiple browsers, or deployment validation. This project was prepared in a restricted environment without npm registry access, so installation, production compilation, live MySQL access, and end-to-end file testing remain required before publishing. Read `docs/VALIDATION_STATUS.md`.

## Run on Windows (VS Code)

Install Node.js 20/22/24 and open this extracted folder in VS Code. For guest tools, no local database is necessary.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Visit http://localhost:3000. Browser-based tools should work without configuring MySQL, after package installation and once the local PDF.js worker is copied during npm install.

For registration, contact records, and account history, use a **real MySQL server**, create a database, and import `sql/schema.sql`. Set `DATABASE_URL` in `.env.local` (never commit the file), restart Next.js, then use `npm run dev`. Beekeeper Studio is a database *client*, not the database server.

## Deploy on Hostinger Unlimited (50 GB plan)

1. Confirm your hPanel offers **Add Website → Node.js Web App**. Older versions of the plan may not support this; contact Hostinger if the option is absent.
2. In hPanel create a MySQL database and database user. Import `sql/schema.sql` with phpMyAdmin.
3. Configure environment variables in hPanel, using your **real** domain: `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `NEXT_PUBLIC_INDEXABLE`, and optional Google verification/AdSense values. Hostinger Node + MySQL usually uses `127.0.0.1:3306` inside the hosting account, not the public MySQL hostname.
4. Upload the **project source ZIP** via hPanel Node.js website creation (or connect a GitHub repository). The ZIP must have `package.json` at its root. Select Node.js 22.x or another supported modern LTS version.
5. Run deployment build and verify HTTPS, public pages, and database health. After the website and legal pages are complete, set `NEXT_PUBLIC_INDEXABLE=true`, rebuild, and check `robots.txt` and `sitemap.xml`.
6. Run the `npm run smoke -- https://your-real-domain.com` smoke test from your laptop, then manually perform real file conversions and account tests.

**Hostinger limitation:** This plan has a 120-second Node.js request timeout and does not offer persistent background conversion services. Here, file conversion is deliberately performed in the user's browser to avoid that restriction. CPU and memory usage will occur on visitors' devices. Very large/complex files may not succeed. There is no guarantee of flawless conversion for arbitrary documents.

Read `docs/HOSTINGER_DEPLOYMENT.md` and `docs/ADSENSE_SEO_LAUNCH.md` before attempting a public launch.

## MySQL with Beekeeper Studio

Database tables: `users`, `sessions`, `activity`, `contact_messages`.

For Hostinger remote Beekeeper connections, allowlist **only your laptop's public IP** in hPanel Remote MySQL, then connect to the assigned remote hostname on port 3306. Do not enable open access to all IP addresses. When deployed on Hostinger, the Next.js application should use `127.0.0.1` in its `DATABASE_URL`. Do not put database credentials in public frontend variables.

## Commands

```bash
npm install           # Downloads project dependencies
npm run dev           # Development website and API
npm run test          # Static source/inventory checks only
npm run check:source  # Verifies tool routing inventory
npm run typecheck     # TypeScript check (requires dependencies)
npm run build         # Next.js production build (requires dependencies)
npm run start         # Starts built Next.js server
npm run db:init       # Applies SQL schema when DATABASE_URL is set in process environment
npm run smoke -- https://example.com
```

For MySQL setup, importing `sql/schema.sql` from phpMyAdmin/Beekeeper is the simplest approach. `db:init` expects the `DATABASE_URL` environment variable to already be exported.

## Important launch limitations

- All 48 processing routes have source implementations, **not independently verified browser test passes**.
- Password-protected PDF unlocking, encrypted PDF protection, and OCR are not included; these are not silently shown as working tools.
- PDF/Office conversion fidelity varies. Some transformations explicitly extract text or rasterize pages. Read the warning on each tool page.
- No email verification, password-reset email workflow, payment subscriptions, ad-consent platform, independent security assessment, or AdSense approval is included.
- The site must provide real ownership information, an accurate privacy policy, terms and contact methods before AdSense review.
- AdSense review and search rankings are entirely Google's decisions, not guaranteed by site code.
