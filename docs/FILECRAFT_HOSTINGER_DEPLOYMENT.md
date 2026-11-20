# FileCraft Hostinger deployment
No production deployment was authorized or performed. Compatibility is local-build verified, not account/deployment verified.

This remains one Next.js 15.5.29 + Node.js application with mysql2/promise. Use Node.js 22 LTS (or supported equivalent) in hPanel. The local tests ran Node 24. No Docker, Redis, Python daemon, external worker or document-processing executable was added. Tool processing remains in visitors' browsers; Node stores account/contact/activity/plan data only.

Hostinger plan name or 50 GB storage alone does not prove Node support. Confirm your exact plan exposes managed Node.js Web App with Next.js backend support. Official references: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/ and https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/ . The prior audit documented 120-second requests and unavailable permanent workers/inbound WebSockets; recheck actual account limits at deployment.

1. Export a database backup before deploying any application update. No schema changes were needed in this redesign pass.
2. Configure private DATABASE_URL with the hPanel-provided host and percent-encoded credentials. Do not upload .env.local or real passwords in .env.example.
3. Configure public HTTPS NEXT_PUBLIC_SITE_URL, business/contact details and any verified Google settings. Keep indexing/advertising disabled during staging.
4. Deploy source via the existing Hostinger Node workflow or authorized GitHub connection. Do not upload .git, node_modules, artifacts, test-results or local development caches.
5. Install with npm ci and run npm run build. Production output is .next-production; development output is .next-development. Preserve the next.config.mjs directory configuration.
6. Start with npm start or the provider's supported Next.js start configuration. The existing script uses port 3000; if hPanel assigns a port, configure its supported start command/port handling rather than assuming a static export.
7. Check HTTPS, /api/health, real database reads, signup/login/logout/cookies, contact, tool outputs, domain canonicals, 404, robots, sitemap and ads.txt.
8. Resolve the remaining dependency advisory, run Firefox/WebKit checks on a suitable host and perform operational security review before public release.

Local MySQL connectivity and accounts pass; the observed server version is 26.7.0, not a verified MySQL 8 target. Repeat all persistence tests on the actual deployment database without deleting customer data.
