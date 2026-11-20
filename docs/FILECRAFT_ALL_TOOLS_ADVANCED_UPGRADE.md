# FileCraft All Tools advanced upgrade

> Subsequent background-remover update, 18 November 2026: the default model is now general-object BiRefNet Lite; MODNet is optional. This report describes the earlier 15 November state. See [current background-remover QA](FILECRAFT_BACKGROUND_REMOVER_QA.md) for real object results and known failures.

Verified locally on 15 November 2026. This continues the existing Next.js project and retains earlier uncommitted design, account, SEO and document-tool work. No Git reset, checkout, pull, push, Docker, deployment, database recreation or destructive SQL was used.

## Recovered state and completed work

The directory redesign, search, combined filters, desktop sidebar, mobile sheet, format-specific compressor controls and background-refinement controls were already present when the interruption was recovered. The incomplete point was the PDFium object inspection/removal/export integration and missing local runtime/model/license assets. Existing files were extended, not replaced with a new project.

Completed PDFium inspection and genuine object deletion; corrected the file-writer API, invalidated stale previews immediately after edits, and connected independent PDF.js preview/text review. Finished local ONNX portrait inference, local runtime copying and model integrity checks. Finished all compressor output paths and honest no-savings behavior. Added real file tests, retained the 48 original engine routes, and corrected a loaded-image mobile layout defect discovered during regression testing.

## Status

| Area | Status | Scope |
| --- | --- | --- |
| All Tools directory | WORKING | 51 entries: 48 existing tools plus three advanced routes; overlapping category counts are intentional. |
| PDF editor | PARTIALLY WORKING | Verified real editing for supported top-level text/image objects; exact original typography, nested objects and OCR remain unsupported. |
| Background remover | PARTIALLY WORKING | Verified local portrait segmentation, refinement and PNG export; universal object/product segmentation is not established. |
| File compressor | WORKING | PDF, JPG/JPEG, PNG, WebP, DOCX, PPTX, XLSX and ZIP within disclosed limits. Not every file gets smaller. |
| Audio/video compression | BLOCKED | No reviewed media/codec engine or verified hosting resources are available. Unsupported media is rejected. |
| OCR / universal product segmentation | NOT IMPLEMENTED | No fake OCR or universal-quality claim. |
| Public production release | BLOCKED | Unresolved dependency findings, cross-browser verification and hosting/security validation remain. |

## PDF editor verification

Upload and actual page rendering use the original PDF bytes. PDFium enumerates supported top-level text and image objects. Native objects, newly added objects and pages without supported selectable text have different controls/messages. Image-only pages are identified without pretending their scanned text is editable.

Selecting an original object and deleting it calls FPDFPage_RemoveObject, destroys that selected object, regenerates the page content and saves through a PDFium file writer. Replacement first removes the original object and then inserts new content. A white rectangle is not used for original text removal.

The independent test downloads the edited file, parses it with pdf-lib and separately extracts its text with PDF.js. REMOVE ME and KEEP TEXT are absent; REPLACED TEXT and ADDED TEXT are present. A PDF.js raster check detects the added red text. The second page retains UNTOUCHED PAGE and the file remains two pages. Additional integration checks exercise original image deletion/undo/replacement, object width/height/rotation, shapes, undo/redo and real page deletion/export.

Implemented controls include text content, font size/color, Helvetica regular/bold/italic styles, inserted or replaced PNG/JPEG images, numeric geometry and drag movement, rectangles, ellipses, transparent highlights, page selection/order/deletion/rotation, history, current searchable text review and actual PDF download. Original content is replaced before its new position/style can be changed. Replacements do not reproduce arbitrary embedded fonts.

Limits: 15 MB input, 40 pages, 10,000 objects per page, bounded history. Only top-level text/image objects are directly selected. Nested Form XObjects, vector outlines, scanned lettering, arbitrary Unicode font embedding, exact original-font matching and OCR are not implemented. New/replacement text is Latin/ASCII using Helvetica variants. Signed PDFs are rejected; encrypted/damaged PDFs are not supported. Copying pages is not a guarantee of preserving every document-level interactive form, signature, accessibility tag, bookmark or attachment. Object removal is not certified forensic redaction: metadata, annotations or other copies of sensitive information may remain. Always inspect an exported document before sharing it.

## Background-remover verification

The locally hosted MODNet portrait model runs through onnxruntime-web in a worker with one WASM thread. Input normalization is CHW float32 in [-1,1]; inference uses 512 x 512 input, then restores the matte to the source dimensions. The original RGB pixels and alpha mask are retained separately. Images are not submitted to an external AI service.

The real NASA astronaut portrait produces a 512 x 512 PNG with genuine alpha. Measured mask/export: 159,355 pixels with alpha below 30, 96,679 above 220, face sample alpha 255, corner alpha 0. Both Chromium profiles produce the same measurements. These are fixture results, not a general accuracy benchmark.

Actual exports verify erase alpha 0, undo restores the subject, redo re-erases, restore alpha 255, original comparison is visible without being baked into the export, crop/resize/rotate changes 400 x 350 to 100 x 80 and then 80 x 100, solid-background export is opaque, and a custom green background gives corner RGBA [0,128,0,255]. Zoom and pan are exercised; loaded mobile canvases remain inside their scroll containers. Undo/redo stores up to six image states. Cancel terminates the worker. PNG output decodes successfully.

Limits: JPG/PNG/WebP, 15 MB and 4 megapixels. This model targets people/portraits. Product cutouts, animals, transparent objects, difficult hair/lighting and arbitrary scenes are not certified. Brush refinement is manual; results need review. Memory and first-run load remain substantial for low-end devices: about 6.6 MB model plus about 14.9 MB WASM, loaded only when needed.

## Compressor verification

PDF lossless mode rewrites structure/object streams; balanced/maximum render smaller image-based pages and may remove selectable text. JPG and WebP use explicitly lossy quality settings; PNG re-encoding preserves rendered pixels but may discard metadata. DOCX/PPTX/XLSX/ZIP are lossless package recompression using DEFLATE, not document reconstruction or lossy media conversion. Office fixtures are real packages created with docx, PptxGenJS and ExcelJS; all uncompressed entry bytes are compared with the originals after output. PDF output reparses, image outputs decode at 240 x 160, and ZIP outputs contain readable original entries.

Representative measured fixtures (bytes; results are not universal savings promises):

| Format | Input bytes | Output bytes | Reduction |
| --- | ---: | ---: | ---: |
| PDF | 1,757 | 1,112 | 36.71% |
| JPG | 112,979 | 28,167 | 75.07% |
| PNG | 180,559 | 132,529 | 26.60% |
| WEBP | 115,766 | 29,786 | 74.27% |
| DOCX | 36,853 | 7,801 | 78.83% |
| PPTX | 58,870 | 14,566 | 75.26% |
| XLSX | 31,145 | 6,594 | 78.83% |
| ZIP | 14,132 | 213 | 98.49% |

Office/ZIP fixtures deliberately start with stored entries to exercise real recompression; the PNG fixture contains removable metadata. The large percentages do not describe typical already-compressed production files. PDF package timestamps can slightly vary sizes between runs. Exact measurements are retained in ../artifacts/advanced-tests/.

Verified batch ZIP download contains two valid smaller ZIP outputs. An already-optimized archive gives an explicit no-smaller-result error and no fabricated output link. Unsupported MP4 is rejected. Signed packages/PDFs are rejected rather than silently invalidating signatures. Resource guards: 15 MB per file, 12 files/45 MB batch, ZIP expansion 64 MB/3,000 entries, image 16 megapixels and PDF structural mode 250 pages. Guards are not malware scanning or protection against every decompression/resource attack.

## Directory, design and routes

/tools retains the coral/navy/blush/lavender visual system, document artwork, real search (Ctrl/Cmd+K), combined search and category filters, desktop sidebar, featured links and mobile category dialog with native focus management. Counts derive from the registry: 51 total, PDF 31, Convert 26, Images 12, Office 16, Security 2. Security currently means metadata utilities; no password/protection workflow is falsely advertised. All original /tools/[slug] routes remain.

The advanced routes have unique titles, descriptions, canonicals, breadcrumbs, FAQs, honest limitations and related links. Their completion events can be stored as client-reported activity only after bytes are produced; no filename/content is stored. Dashboard history links remain available. Mobile navigation links Home/Tools/Recent/Account. The staging index/ad guards remain in place.

Responsive checks cover 360, 375, 390, 430, 768, 1024, 1440 and 1920 pixels across all four new/directory pages. Axe WCAG 2/2.1/2.2 A/AA scans pass in the tested initial states. Loaded-image mobile overflow and editor controls have additional interaction tests; this is not a claim of complete manual accessibility certification.

Screenshots from the final production build:

- [Directory desktop](../artifacts/advanced-upgrade/tools-1440.png), [mobile](../artifacts/advanced-upgrade/tools-390.png), [category sheet](../artifacts/advanced-upgrade/categories-390.png).
- [PDF workspace desktop](../artifacts/advanced-upgrade/pdf-editor-1440.png), [mobile](../artifacts/advanced-upgrade/pdf-editor-390.png).
- [Portrait workspace desktop](../artifacts/advanced-upgrade/portrait-1440.png), [mobile](../artifacts/advanced-upgrade/portrait-390.png).
- [Compressor desktop](../artifacts/advanced-upgrade/compressor-1440.png), [mobile](../artifacts/advanced-upgrade/compressor-390.png).

Artifacts are local ignored evidence; preserve/copy them separately if sharing the report.

## Checks actually run

| Check | Result |
| --- | --- |
| npm.cmd run typecheck | PASSED |
| npm.cmd run lint | PASSED |
| npm.cmd test | 19 passed, zero failed/skipped |
| npm.cmd run build | PASSED; 87 prerendered pages, dynamic APIs retained; local asset checksum verified |
| npm.cmd run check:source | PASSED; 48 original engine-routed tools inventoried |
| npm.cmd run test:browser:chromium | 222 passed, zero failed/skipped/flaky; desktop and Pixel 7 Chromium |
| Existing 48-tool real-file regression | 96 passed (48 tools x two profiles), included above |
| Final production advanced tests | 16 passed on localhost:3101, separate from development tests |
| npm.cmd run db:verify | PASSED actual SELECT 1, selected database, six table/index inventories |
| Production scripts/test-auth.mjs | PASSED real signup, hashing, Free subscription, sessions, CSRF, admin denial, wrong-password rejection, profile/activity, password change/revocation, login/logout |
| Firefox / WebKit | BLOCKED by missing Windows runtime DLL dependencies during browser launch; no passing claim |

The earlier 218-case run had one mobile portrait-interaction timeout caused by loaded canvas overflow. Fixed the layout, added loaded-state assertions, passed the isolated workflow and then the complete 222-case run. Test selectors and the PDF writer/stale-preview bugs were also corrected during development; superseded failed attempts are not described as passing runs. Machine-readable final results: ../test-results/browser-results.json and ../artifacts/advanced-tests/final-browser-summary.json. PDF extraction uses a renderer independent of the PDFium editor.

## Database and account preservation

DATABASE_URL was inspected without printing credentials: local host and database filecraft confirmed. Safe read confirms three configured plans. Required existing tables: users, sessions, activity, contact_messages, subscription_plans, subscriptions. Index-column counts respectively: 2, 3, 3, 2, 1, 3. No missing tables/indexes or incompatible schema changes were needed in this continuation. No DROP, TRUNCATE, RESET or data deletion was run. Test-generated example.invalid accounts, client-reported activity and contact verification messages remain under the no-deletion instruction; auth tests revoke/update their own test sessions through intended flows.

Database access uses a shared mysql2/promise connection pool in a server-only module; parameterized SQL and server-side identity checks remain. Health performs a real SELECT 1 and returns HTTP 200/healthy only on success, otherwise HTTP 503/degraded with no raw database errors or secrets. Server reports version 26.7.0; this is not labeled as verified MySQL 8. Password hashing is Node scrypt with random salts; session tokens are random and only digests are stored. Paid activation is not simulated.

## Assets, licensing and network recovery

Required downloads completed successfully during recovery with scoped network operations. No remaining network-dependent blocker exists for the implemented tools; final build and processing use local assets. No arbitrary remote install script or forced dependency upgrade was used.

- @embedpdf/pdfium 2.15.1: MIT wrapper; bundled PDFium third-party notices retained in public/licenses/PDFium-LICENSE.txt. API reference: https://v2.embedpdf.com/docs/pdfium/getting-started .
- onnxruntime-web 1.31.1: MIT; Microsoft license retained in public/licenses/ONNX-Runtime-MIT.txt. Runtime source/docs: https://onnxruntime.ai/docs/tutorials/web/build-web-app.html .
- MODNet portrait quantized ONNX: 6,632,188 bytes, SHA-256 92e49898c3e05a6d7a944fc67a8cb87c4aad754ffb6ebd949528c7d1105fee3a . Apache 2.0 notice retained. Pinned source: https://huggingface.co/Xenova/modnet/resolve/7e0f55f28727b43369531f75e0539ecc4912af82/onnx/model_quantized.onnx . Model card: https://huggingface.co/Xenova/modnet ; upstream license: https://github.com/ZHKKKe/MODNet/blob/master/LICENSE .
- NASA astronaut test portrait from scikit-image v0.22.0, 791,555 bytes: https://raw.githubusercontent.com/scikit-image/scikit-image/v0.22.0/skimage/data/astronaut.png . Attribution in tests/fixtures/README.md.

Build/postinstall copy only the required regular ORT WASM/module and PDFium WASM from installed dependencies; generated engines are ignored. Model/license assets are source deliverables. scripts/setup-advanced-assets.mjs is a reviewed repair/setup utility with pinned model integrity verification; it is not an automatic network step during build. Legal notices were reviewed/preserved; this is not a legal opinion or a full dependency-license audit.

## Security findings and production readiness

A compatible npm audit fix --ignore-scripts completed but left nine findings: eight moderate and one high. The high finding is image-size 1.2.1 through PptxGenJS 3.12.0 (malformed JXL/HEIF/ICNS can cause an infinite loop). Official npm metadata for current PptxGenJS 4.0.1 still depends on image-size ^1.2.1, so a major upgrade does not remove that issue. The browser build aliases image-size away and application-generated presentation images are PNG, reducing the specific path's exposure, but that is not a clean-audit or security guarantee. Moderate findings include the TypeScript-ESLint/minimatch chain and uuid under ExcelJS. No forced breaking upgrade/downgrade was applied.

Next.js/MySQL2/Mammoth/PostCSS fixes from the earlier pass remain. Remaining release work includes reviewing/remediating dependency findings, Firefox/WebKit runtime setup and tests, real target-host memory/WASM/static-asset behavior, trusted proxy/distributed throttling, bounded request bodies, stronger CSP and independent security review. No actual Hostinger deployment, public-domain/HTTPS check, SMTP verification, payment activation or production load test was performed. Universal product matting, OCR, arbitrary PDF fonts/nested object editing and media compression remain outside verified support. Existing legacy conversions keep their documented fidelity limits; passing fixtures do not establish arbitrary-file fidelity.

Local production build and the supported Chromium workflows are verified. Full public production readiness is not claimed.

## Startup and reproduction

Start the existing website: npm.cmd run dev (http://localhost:3000). Keep .env.local private; NEXT_PUBLIC_SITE_URL must match that origin. No project recreation or database initialization is needed.

For isolated QA, tests default to localhost:3100. Start a dev process with NEXT_PUBLIC_SITE_URL=http://localhost:3100 and next dev -p 3100, then run npm.cmd run test:browser:chromium. Production verification used next start -p 3101 and TEST_BASE_URL=http://localhost:3101; its auth script kept the build's configured origin. npm.cmd run build then npm.cmd start runs production on port 3000. Stop only QA processes you own. Test credentials are generated in memory and never printed.

## Exact file inventory

Advanced work directly changes .gitignore, package.json/package-lock.json, app/tools/page.tsx, app/[section]/page.tsx, app/layout.tsx, app/sitemap.ts, app/api/activity/route.ts, app/dashboard/page.tsx, components/Header.tsx and README.md; adds the advanced route/component/engine/style/worker/assets/setup/capture/test/report files listed below; and updates the directory selectors in tests/browser/journeys.spec.ts. The following complete local modified/untracked inventory also includes earlier preserved implementation work. It is not a claim that every file was newly authored in this continuation. No secrets or generated engine artifacts are listed.

```text
.env.example
.eslintrc.json
.gitignore
README.md
app/[section]/page.tsx
app/advanced.css
app/api/account/route.ts
app/api/activity/route.ts
app/api/admin/activity/route.ts
app/api/admin/stats/route.ts
app/api/auth/me/route.ts
app/api/auth/register/route.ts
app/api/health/route.ts
app/api/plans/route.ts
app/dashboard/loading.tsx
app/dashboard/page.tsx
app/design-system.css
app/edit-pdf/page.tsx
app/error.tsx
app/file-compressor/page.tsx
app/globals.css
app/guides/[slug]/page.tsx
app/layout.tsx
app/not-found.tsx
app/page.tsx
app/remove-background/page.tsx
app/sitemap.ts
app/tools/[slug]/page.tsx
app/tools/page.tsx
catalog/tools.json
components/AccountSettings.tsx
components/AdvancedToolShell.tsx
components/AllToolsDirectory.tsx
components/AuthForm.tsx
components/BackgroundRemover.tsx
components/ContactForm.tsx
components/ContentAds.tsx
components/Faq.tsx
components/FileCompressor.tsx
components/Footer.tsx
components/Header.tsx
components/HeroArtwork.tsx
components/HeroUpload.tsx
components/MobileToolsNav.tsx
components/PageSkeleton.tsx
components/PdfEditor.tsx
components/Pricing.tsx
components/SavedTools.tsx
components/ToolCard.tsx
components/ToolCatalog.tsx
components/ToolProcessor.tsx
docs/ADSENSE_READINESS.md
docs/FEATURE_VERIFICATION.md
docs/FILECRAFT_ADSENSE_READINESS.md
docs/FILECRAFT_ALL_TOOLS_ADVANCED_UPGRADE.md
docs/FILECRAFT_FINAL_QA_REPORT.md
docs/FILECRAFT_HOSTINGER_DEPLOYMENT.md
docs/FILECRAFT_INITIAL_AUDIT.md
docs/FILECRAFT_SEO_AUDIT.md
docs/FILECRAFT_TOOL_VERIFICATION.md
docs/FILECRAFT_UI_DESIGN_SYSTEM.md
docs/HOSTINGER_DEPLOYMENT.md
docs/MYSQL_BEEKEEPER_SETUP.md
docs/RELEASE_CHECKLIST.md
docs/SECURITY_REVIEW.md
docs/SEO_AUDIT.md
docs/SETUP_WINDOWS.md
docs/TEST_RESULTS.md
docs/VALIDATION_STATUS.md
lib/advanced/activity.ts
lib/advanced/compression.ts
lib/advanced/image-editor.ts
lib/advanced/pdf-engine.ts
lib/auth.ts
lib/browser-engine.ts
lib/db.ts
lib/directory.ts
lib/file-handoff.ts
lib/site.ts
lib/tool-details.ts
lib/tools.ts
next-env.d.ts
next.config.mjs
package-lock.json
package.json
playwright.config.ts
public/licenses/EmbedPDF-MIT.txt
public/licenses/MODNet-APACHE-2.0.txt
public/licenses/ONNX-Runtime-MIT.txt
public/licenses/PDFium-LICENSE.txt
public/models/modnet-portrait.onnx
scripts/capture-advanced.mjs
scripts/capture-design.mjs
scripts/copy-advanced-engines.mjs
scripts/init-db.mjs
scripts/measure-browser.mjs
scripts/setup-advanced-assets.mjs
scripts/test-auth.mjs
scripts/verify-db.mjs
sql/schema.sql
tests/browser/accessibility.spec.ts
tests/browser/advanced-directory.spec.ts
tests/browser/advanced-errors.spec.ts
tests/browser/advanced-extra.spec.ts
tests/browser/advanced-interactions.spec.ts
tests/browser/advanced.spec.ts
tests/browser/contact.spec.ts
tests/browser/journeys.spec.ts
tests/browser/security.spec.ts
tests/browser/site.spec.ts
tests/browser/tools.spec.ts
tests/fixtures/README.md
tests/fixtures/astronaut.png
tests/processing.test.mjs
tsconfig.json
workers/background.worker.ts
```
