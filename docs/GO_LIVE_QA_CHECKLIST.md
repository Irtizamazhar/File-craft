# Mandatory launch acceptance test

**Do not publicly advertise the site as fully working until these checks pass on the actual deployed app.**

## Application

- [ ] `npm install` succeeds with the versions in `package.json`.
- [ ] `npm run typecheck` completes without errors.
- [ ] `npm run build` completes without errors.
- [ ] `npm run test` static tests pass.
- [ ] `npm run smoke -- https://YOURDOMAIN` passes public HTTP routes.
- [ ] `/api/health` reports `{mysql:true}` once MySQL is configured.
- [ ] Register/log in/log out with real test user; records appear in Beekeeper.
- [ ] Wrong password is rejected, and another account cannot access protected history.
- [ ] Contact form saves records and does not expose other messages.
- [ ] Admin role assigned via SQL allows `/admin` read access; ordinary users cannot access admin API.

## Real file conversions

For every active tool in `docs/FEATURE_MATRIX.md`:

- [ ] Open the specific tool page on a mobile and desktop browser.
- [ ] Try a representative valid input file.
- [ ] Verify a nonempty downloadable output is produced.
- [ ] Reopen the output in an independent application and compare with the source.
- [ ] Check fidelity limitations described on the page (especially Office formats).
- [ ] Test unsupported format, empty file, oversized file and corrupt file.
- [ ] Observe error messages, responsiveness, CPU/memory and long-file behavior.
- [ ] For multi-file operations, test ordering and duplicate/invalid inputs.

## SEO and AdSense

- [ ] Set actual HTTPS domain and metadata; no localhost references in live canonical tags.
- [ ] Real company/operator contact information and complete legal text are published.
- [ ] Original content is accurate, links work, and the tools are not misleading.
- [ ] `robots.txt` and `sitemap.xml` are correct; staging is kept noindex.
- [ ] Search Console property verified.
- [ ] If approved, AdSense publisher ID/ads.txt configured; comply with relevant consent rules.
- [ ] Ads never mimic the site's tool/download action buttons.

## Performance and security

- [ ] Tests on low-memory mobile devices show reasonable behavior.
- [ ] HTTPS enabled and DNS redirects working.
- [ ] WAF/rate limits protect login/contact endpoints.
- [ ] Database backups and incident contact procedure exist.
- [ ] Privacy/security claims describe how files are actually handled.
