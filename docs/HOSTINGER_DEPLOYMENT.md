# Production deployment: Hostinger Unlimited 50 GB

## Target architecture

- **One Next.js project**: React frontend + Next.js Route Handler backend, running in Hostinger's managed Node.js web application.
- **Hostinger MySQL**: Stores user accounts, sessions, contact forms and optional activity metadata.
- **Browser**: PDF, Office (supported subset) and image conversions take place locally on the visitor's device.
- **Beekeeper Studio**: Optional MySQL management client on your PC. It does not need to stay connected for the website to operate.

## 1. Check the correct plan

Hostinger documentation currently lists Node.js web apps on Business/Unlimited and Cloud plans, with Next.js support. Confirm that your specific plan/version displays **Add website → Node.js**. A 50 GB disk allowance does not mean unlimited RAM/CPU.

## 2. Database

In hPanel, create MySQL database and user. Export the credentials to a private password manager. Import `sql/schema.sql` through phpMyAdmin. The app connects using `DATABASE_URL` set server-side:

`mysql://YOUR_DB_USER:YOUR_PASSWORD@127.0.0.1:3306/YOUR_DATABASE`

Percent-encode special characters in the password for a URL. If you prefer direct Beekeeper access from your PC, enable Remote MySQL specifically for your public IP and use Hostinger's remote MySQL hostname rather than 127.0.0.1.

## 3. Deployment

1. Prepare your custom domain and HTTPS.
2. Choose **Node.js Web App → Upload ZIP** in hPanel and upload the project-source ZIP with root-level `package.json`.
3. Configure Node 22.x (or another supported version) and the environment variables from `.env.example` in hPanel.
4. Let hPanel install/build with `npm install` and `npm run build`.
5. If hPanel asks for start command use `npm run start` or the hPanel-generated Next.js start command appropriate for its Node web app.
6. Open `/api/health`. A healthy database returns `mysql: true`. The site can offer guest tool conversions while database is missing, but accounts/contact will not work.
7. Test `/tools/merge-pdf`, `/tools/csv-to-xlsx`, `/tools/resize-image` using real files. Ensure generated output opens correctly.
8. Register a test account, check the `users` and `sessions` tables through Beekeeper/phpMyAdmin, and test logout/re-login.
9. Confirm `/robots.txt`, `/sitemap.xml`, `/ads.txt`, HTTPS redirect, mobile layout, and correct canonical domain.
10. Switch `NEXT_PUBLIC_INDEXABLE=true` **only after** content/legal/ads readiness review and redeploy.

## 4. Safety and operations

- Keep `DATABASE_URL` and passwords private, never in `NEXT_PUBLIC_` variables.
- Maintain MySQL backups and rotate database credentials after any accidental disclosure.
- Protect accounts against automated abuse via Hostinger-side WAF/rate limiting. Application rate controls are basic per-process controls and are not enterprise-grade distributed limits.
- Data retention for account/contact/activity records must be configured as a business procedure. Add email verification and password reset before wider account promotion.
- Review cookie and advertising consent requirements for the countries you target.
- Avoid claiming upload/download files are retained on the server; file processing occurs on-device.
- Confirm browser CPU/RAM performance on budget phones, as processing is client-side.

## 5. Constraints

Large PDFs/PowerPoint presentations can exceed browser memory. The selected tools enforce 15 MB per file and 45 MB total; rasterized PDF operations cap at 30 pages. The conversion quality of Office documents is basic, not equivalent to professional desktop document rendering.
