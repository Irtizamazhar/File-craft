# Editgoo production-readiness report

Date: 25 November 2026 · Branch: `main` (uncommitted working tree) · Next.js 15.5.29

Status labels: **PASSED** = verified on this machine during this pass · **FAILED** = verified not working · **NOT TESTED** = not verified here.

## 1. Executive summary

- **NoFallbackError fixed.** `app/[section]`, `app/tools/[slug]` and `app/guides/[slug]` used `dynamicParams=false`. Any unknown path (`/wp-admin`, `/.env`, typos) went down Next's "no fallback" branch and logged `Internal: NoFallbackError` during ISR revalidation. All three now use `dynamicParams=true`, validate the parameter, and call `notFound()` in both `generateMetadata` and the page. `generateStaticParams` always returns a fixed, non-empty list. A new `middleware.ts` answers common scanner paths with a plain 404 before they reach any page. In the production build, unknown paths return 404, no server error is logged and no ISR cache files are written.
- **Rebranded to Editgoo** across all public text, metadata, Open Graph/Twitter cards, JSON-LD, the footer, account pages, download filenames, the API health response and log prefixes. The old FileCraft favicon was removed. New assets were generated from the supplied logo.
- **Public pages:** About, Help/How it works (new), FAQ (expanded), Privacy Policy, Terms and Conditions, Cookie Policy, Security and Features were rewritten in plain English to match the real architecture. This includes the optional server engine for background removal, which the old privacy text did not mention.
- **Security hardening:** JSON request bodies are capped at 16 KB (activity: 2 KB), and malformed JSON now returns 400 instead of 503. Sign-in has a per-email rate limit that IP rotation cannot get around. HSTS is sent in production. Activity records store only a validated tool slug.
- **SEO prepared, not enabled:** every public page has a canonical URL on `https://www.editgoo.com`, complete Open Graph data with a 1200×630 preview image, and accurate structured data. `robots.txt` blocks everything and the sitemap stays empty while `NEXT_PUBLIC_INDEXABLE=false`.
- **AdSense prepared, not activated:** no ad or analytics script loads anywhere, `ads.txt` declares no sellers, and the ad loader is restricted to editorial pages.
- **Verification:** typecheck, lint and 32 unit tests passed. The auth integration test passed, as did 240 of 246 browser tests (2 failed and 4 were skipped by design; details in sections 3 and 7). 38/38 production metadata checks passed. Production build and standalone output passed.

## 2. Modified and added files

**Modified**
- Routing and SEO: `app/[section]/page.tsx`, `app/tools/[slug]/page.tsx`, `app/guides/[slug]/page.tsx`, `app/tools/page.tsx`, `app/edit-pdf/page.tsx`, `app/file-compressor/page.tsx`, `app/remove-background/page.tsx`, `app/layout.tsx`, `app/sitemap.ts`, `next.config.mjs` (HSTS only)
- Branding and copy: `app/page.tsx`, `app/admin/page.tsx`, `app/dashboard/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/forgot-password/page.tsx`, `components/Brand.tsx`, `components/Footer.tsx`, `components/Faq.tsx`, `components/AuthForm.tsx`, `components/BackgroundRemover.tsx`, `components/ContactForm.tsx`, `components/ContentAds.tsx`, `components/FileCompressor.tsx`, `components/PdfEditor.tsx`, `components/Pricing.tsx`, `components/ToolProcessor.tsx`, `lib/guides.ts`, `app/design-system.css`, `README.md`
- API and security: `app/api/health/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `app/api/contact/route.ts`, `app/api/account/route.ts`, `app/api/activity/route.ts`, `lib/http.ts`
- Tests: `tests/browser/auth-ui.spec.ts` (expects "Contact Editgoo")

**Added:** `middleware.ts`, `lib/site-pages.ts`, `lib/seo.ts`, `scripts/brand-assets.mjs`, `docs/brand/editgoo-logo-source.png` (original image, unchanged), `public/brand/editgoo-icon.png`, `public/brand/editgoo-wordmark.png`, `public/brand/editgoo-logo-horizontal.png`, `public/brand/editgoo-logo-square.png`, `public/og-image.png`, `public/favicon-32.png`, `public/icon-192.png`, `public/apple-touch-icon.png`, this report.

**Removed:** `public/favicon.svg` (old FileCraft icon).

No packages were added, removed or upgraded. No database schema, SQL or migration changes were made.

## 3. Tool-by-tool test results

Browser suites ran against a production build with system Chrome: desktop Chromium plus the mobile Pixel 7 profile. Each catalog test uploads a real file, processes it, downloads the output and validates it (PDF page count, ZIP/OOXML structure, image decode, text content).

| Tools | Checks | Result |
|---|---|---|
| PDF: merge, split, compress, rotate, extract pages, delete pages, page numbers, watermark, crop, grayscale, repair, flatten, metadata, remove blank pages, add blank pages, compare, fill form | Real upload → process → download → output validated; forged-signature rejection | **PASSED** (desktop + mobile) |
| Convert: PDF↔text, PDF→JPG/PNG, JPG/PNG→PDF, PDF→Word/Excel/PowerPoint | Same as above | **PASSED** |
| Word/Excel/PowerPoint: DOCX→PDF/TXT/HTML, TXT/HTML→DOCX, merge DOCX, XLSX→PDF/CSV/HTML, CSV→XLSX, PPTX→TXT, images→PPTX | Same as above, plus a test that `javascript:` links are stripped from HTML export | **PASSED** |
| Image: JPG↔PNG, WebP conversions, resize, rotate, compress, strip metadata, image→PDF | Same as above | **PASSED** |
| All 48 catalog tools | Forged input rejected with an understandable alert and no result | **PASSED** |
| File Compressor (PDF, DOCX, PPTX, XLSX, ZIP, JPG, PNG, WebP) | Real compression, byte comparison, batch ZIP, honest "no savings" result | **PASSED** |
| Edit PDF | Object edit/export, page operations, error handling | **PASSED** |
| Remove Background: refinement workflow (selection, brushes, zoom, edges, reset, already-transparent input) | Real model, real PNG export | **PASSED** |
| Remove Background: 10-image object survey | 8 fixtures passed; `electronics.jpg` (laptop close-up) returned "No clear foreground was found" | **FAILED** on 1 fixture (desktop + mobile), see section 8 |
| Remove Background: server engine (`BG_REMOVAL_SERVICE_URL`) | Not configured locally; the in-browser fallback was used and reported correctly | **NOT TESTED** |
| Directory, search, filters, homepage handoff | `advanced-directory`, `premium-ui` | **PASSED** |
| Large-file and memory limits | 15 MB/file, 45 MB/task and 12-file limits enforced in UI and engine (code review); object URLs revoked on reset/unmount (code review) | Code reviewed; no separate large-file stress run, so **NOT TESTED** |

Totals: 240 passed, 2 failed (the same fixture on two profiles), 4 skipped (desktop-only or touch-only navigation tests that skip on the other profile by design). Firefox and WebKit projects were **NOT TESTED** because those browsers are not installed on this machine.

## 4. Login, account and database results

All of this was tested against the **local** MySQL at 127.0.0.1, never the Hostinger production database.

| Check | Result |
|---|---|
| `scripts/test-auth.mjs`: health, signup, password hashing, Free plan row, session, CSRF/origin rejection, admin denial, wrong password, profile update, activity, password change with session revocation, login, logout | **PASSED** |
| Browser journey: signup → login → dashboard settings → logout | **PASSED** |
| Signup validation, show/hide password, consent links, forgot-password help page | **PASSED** |
| Contact form submission stored in MySQL | **PASSED** |
| Per-email sign-in limit: 10 wrong attempts from 12 rotating IPs → 401 ×10, then 429 | **PASSED** |
| Oversized JSON → 413, malformed JSON → 400, cross-origin POST → 403, admin API without admin → 403 | **PASSED** |
| `/api/plans`: plans listed, `purchasesEnabled:false` | **PASSED** |
| `/api/health` → `{"app":"Editgoo","status":"healthy","mysql":true,"processing":"browser"}` and nothing else | **PASSED** |
| Password reset by email | Not implemented (the page says so) |
| Paid subscriptions and payments | Not implemented; the UI states that no payment is taken |
| Production Hostinger database | **NOT TESTED** (deliberately not touched) |

The test scripts keep their QA accounts (`@example.invalid`) in the local database by design.

## 5. Branding consistency

- Rendered HTML for `/`, `/tools`, `/tools/merge-pdf`, `/privacy`, `/help`, `/about`, `/contact`, `/faq`, `/pricing`, `/remove-background`, a guide, `/login` and `/dashboard` contains no "FileCraft": **PASSED**.
- Titles use "… | Editgoo"; Open Graph `site_name` is Editgoo; JSON-LD WebSite, SoftwareApplication ("Editgoo Merge PDF") and Article publisher are Editgoo: **PASSED**.
- Download names: `editgoo-cutout.*`, `editgoo-edited.pdf`, `editgoo-compressed.zip`.
- Logo (updated 25 Nov, later the same day): the header, footer and auth pages show the supplied ribbon/document icon next to the full-colour wordmark ("edit" in navy, "goo" in red). The white background was removed. The favicon, 192 px icon and Apple touch icon use the main icon shape without the small sparkles, so it stays legible at small sizes. The social preview uses the horizontal logo. Everything is generated from `docs/brand/editgoo-logo-source.png` by `node scripts/brand-assets.mjs`. No SVG logo exists; every asset is PNG.
- Kept on purpose for compatibility: the npm package name, the `filecraft` database name, the `fc_session` cookie (renaming it signs everyone out), the `filecraft-saved-tools` localStorage key (saved shortcuts), the `filecraft-segmentation-v1` model cache (renaming forces a 192 MB re-download) and the DB pool variable.
- The earlier "four-tile" logo description was superseded by the ribbon logo the owner supplied afterwards. The previous document-tile logo has been fully replaced.

## 6. Security audit findings

| Finding | Severity | Action |
|---|---|---|
| Unknown dynamic paths raised NoFallbackError; scanner traffic reached page rendering | Medium (log noise, wasted work) | Fixed: `dynamicParams=true` + `notFound()` + probe-blocking middleware |
| API routes buffered request bodies of any size; malformed JSON returned 503 | Medium | Fixed: `readJson` with a 16 KB cap; 413/400 responses |
| Login limit keyed on the first `X-Forwarded-For` value, which a client can spoof | Medium | Mitigated: added a per-email limit (10 per 15 minutes). The IP limit stays as a first layer. |
| Activity endpoint stored the client-supplied tool value | Low | Now stores the slug from the server-side tool list |
| No HSTS | Low | Added in production builds: `max-age=31536000`, without `includeSubDomains` or `preload` |
| CSP only restricts framing, base and object | Info | A full script CSP was not added because it needs care with WASM, workers and future AdSense; recommended before scaling |
| Rate limits are in-memory, per process | Info | Fine for a single Hostinger process; use a shared store if you scale out |
| Expired session rows are never purged | Info | Harmless; a periodic `DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP()` can be added later |
| Secrets | None found | `.env.local` is git-ignored. Health and errors expose no configuration; `unexpected()` logs only the error message. |
| `npm audit` (production): `image-size` (high) via `pptxgenjs` | Not exploitable here | The browser build of `pptxgenjs` does not call `image-size` (verified in `dist/pptxgen.es.js`), and uploads are limited to JPG/PNG/WebP. npm's only "fix" downgrades to an older line. Not changed. |
| `npm audit`: `uuid` (moderate) via `exceljs` | Not applicable | Affects uuid v3/v5/v6 with a buffer argument. npm's fix downgrades `exceljs` to 3.4.0 (breaking). Not changed. |
| `npm audit`: 6 moderate in ESLint tooling (`minimatch`, `@typescript-eslint/*`) | Dev only | Not shipped. Not changed. |

`npm audit fix --force` was not run.

## 7. Production build result

- Built with `NEXT_PUBLIC_SITE_URL=https://www.editgoo.com`, `NEXT_PUBLIC_INDEXABLE=false`, `NEXT_PUBLIC_ADSENSE_APPROVED=false`, `NEXT_PUBLIC_CMP_READY=false`: **PASSED**. Compiled with no warnings; 90 static pages; middleware 34.3 kB; shared JS 103 kB (unchanged).
- `.next-production/standalone/server.js` was generated, booted and served `/`, `/help` and `/api/health` (MySQL connected), with 404 for `/wp-login.php` and unknown paths: **PASSED**.
- `next start` (what `npm start` runs): 38/38 metadata, indexing and 404 checks passed; apex→www redirect checked with curl: `editgoo.com/pdf-tools?utm=x` → 308 `https://www.editgoo.com/pdf-tools?utm=x`. **PASSED**
- Asset copy scripts (PDF.js worker, PDFium, ONNX runtime, model checksums) ran unchanged during the build: **PASSED**.

## 8. Remaining issues and limitations

1. **Background removal, close-up electronics:** the in-browser BiRefNet Lite model returns no clear foreground for `tests/fixtures/objects/electronics.jpg`. The tool shows an honest error and changes nothing. This is a model limitation, not a regression: this pass changed only text in that component. Options are the server engine (full BiRefNet) or accepting it as a documented limitation.
2. **Operator details are not configured:** `NEXT_PUBLIC_BUSINESS_NAME` and `NEXT_PUBLIC_CONTACT_EMAIL` are empty, so the policies point to the contact form and name no legal entity. Both are needed before indexing, and `sitePublic` stays false without them.
3. **Owner confirmation needed in the policies:** governing law and jurisdiction (not stated), the minimum age (13 used), retention periods, and the commitment to delete accounts on request through the contact form (no self-service deletion exists).
4. **Server background-removal engine:** if production sets `BG_REMOVAL_SERVICE_URL`, images go to your server; the privacy policy and the tool's notice cover both modes. Confirm which mode production uses.
5. **Not implemented** (and not claimed): password-reset email, account self-deletion, paid plans and checkout, OCR, video, QR, barcode and AI-writing tools. The About and FAQ pages list the planned categories explicitly as not yet available.
6. Windows-only quirk seen locally: NTFS is case-insensitive, so `/Help` can serve `help.html`. Linux (Hostinger) returns 404.

## 9. SEO readiness checklist

- [x] Canonical host `https://www.editgoo.com`; the apex→www 308 redirect keeps path and query
- [x] Trailing-slash URLs redirect to the slash-less form
- [x] Canonical URL, title, description and Open Graph (with image) on every public page; Twitter `summary_large_image`
- [x] JSON-LD: WebSite, SoftwareApplication (free offer) on tool pages, BreadcrumbList, Article on guides
- [x] Unknown URLs return a real 404; login, register, dashboard, admin and forgot-password are `noindex`
- [x] `robots.txt` = `Disallow: /`, sitemap empty, every page `noindex` while `NEXT_PUBLIC_INDEXABLE=false`
- [x] Sitemap ready for launch: static pages including `/help`, 48 tools and guides, with lastModified dates
- [ ] **Owner:** set `NEXT_PUBLIC_BUSINESS_NAME` and `NEXT_PUBLIC_CONTACT_EMAIL`, then set `NEXT_PUBLIC_INDEXABLE=true` only when you authorise indexing (all three are required)
- [ ] **Owner:** verify the domain in Search Console (`GOOGLE_SITE_VERIFICATION`) and submit `https://www.editgoo.com/sitemap.xml` after indexing is enabled

## 10. AdSense readiness checklist

- [x] No AdSense or analytics script loads anywhere (verified in rendered HTML); `ads.txt` declares no sellers
- [x] The loader needs all of: site public, a valid `ca-pub-` ID, `NEXT_PUBLIC_ADSENSE_APPROVED=true` and `NEXT_PUBLIC_CMP_READY=true`
- [x] The loader is limited to editorial pages: `/about`, `/blog`, `/faq`, `/features`, `/help`, `/guides/*`. Never tools, uploads, downloads, accounts or policies.
- [x] Privacy and Cookie policies disclose future Google advertising cookies and consent
- [x] Original content: guides, tool explanations, Help, FAQ; no fake reviews or statistics
- [ ] **Owner:** use manual ad units in fixed editorial slots, or add page exclusions for `/tools/*`, `/edit-pdf`, `/remove-background`, `/file-compressor`, `/dashboard`, `/login` and `/register` in the AdSense console. Once the script has loaded, Auto ads can still inject into pages reached by client-side navigation.
- [ ] **Owner:** deploy a Google-certified CMP for EEA/UK/Swiss visitors before setting `NEXT_PUBLIC_CMP_READY=true`
- [ ] **Owner:** after approval, set `NEXT_PUBLIC_ADSENSE_CLIENT`; `ads.txt` then publishes the seller line automatically
- [ ] **Owner:** complete operator details (section 8, item 2) before applying

## 11. Git commands for a reviewed deployment

```powershell
cd D:\File-craft
git status
git diff                      # review every change
git add -A
git status                    # confirm .env.local and build folders are NOT staged
git -c user.name="Irtizamazhar" -c user.email="<your-email>" commit -m "Editgoo rebrand, NoFallbackError fix, policies, SEO/AdSense prep and API hardening"
git push origin main
```

Then on Hostinger: redeploy from `main` (or `git pull`), and keep `NEXT_PUBLIC_SITE_URL=https://www.editgoo.com`, `NEXT_PUBLIC_INDEXABLE=false`, `NEXT_PUBLIC_ADSENSE_APPROVED=false` and `NEXT_PUBLIC_CMP_READY=false`. Run `npm install` (runs the model setup) and `npm run build`, restart the Node app, then run `npm run smoke -- https://www.editgoo.com`.
