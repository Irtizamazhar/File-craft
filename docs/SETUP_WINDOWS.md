# Windows setup
Use the existing project. Install Node.js 22 LTS and a running MySQL server. Beekeeper Studio administers that server.

Keep .env.local private. Do not overwrite it with .env.example if already configured. Set DATABASE_URL to the existing filecraft database; percent-encode URL password characters. Set NEXT_PUBLIC_SITE_URL to http://localhost:3000 for local UI use so browser POST origins match. Restart Next.js after environment changes.

Run npm.cmd install, npm.cmd run db:init, npm.cmd run db:verify, then npm.cmd run dev. Open http://localhost:3000. npm.cmd bypasses the Windows npm.ps1 execution-policy restriction without changing system policy.

For production: npm.cmd run build followed by npm.cmd start. Stop the dev server before building in the same directory. For API tests start a separate server with node node_modules/next/dist/bin/next dev -p 3100, then npm.cmd run test:auth.

Production builds use .next-production; development uses .next. This prevents a running dev server from overwriting production route manifests. Deploy source and build on the host; preserve the configured output directory if packaging an existing build.
