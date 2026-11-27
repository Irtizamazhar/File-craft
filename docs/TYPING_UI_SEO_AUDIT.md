# Typing Speed Test and SEO verification

Local branch `main`, on 27 November 2026. The initial working tree was clean. This run used the local standalone production build with local static assets.

## Typing Speed Test

- Time, Words, Quote, Practice and Custom text retain their original preparation, scoring and session logic. Time defaults to 60 seconds, with all five duration choices.
- The toolbar shows the mode and its target controls. Difficulty, punctuation, numbers, text size, sound and focus mode are grouped inside Options as applicable.
- The typing surface shows WPM, accuracy and time. Raw speed and keystroke counters are available under Live details. The in-progress prompt, caret, color feedback, keyboard behavior and timer use the existing code.
- Results show net WPM once, with accuracy, uncorrected errors and duration as cards. Raw WPM stays available as a secondary value. The foreground actions are Try Again and New Test. Copy Results and Change Mode are secondary.
- Detailed Stats reveals the original graph and data table, and the existing scoring breakdown. Progress appears when history or a best score exists. History is collapsed and uses stacked cards on mobile. Existing local storage keys, confirmation actions and save rules are intact.
- The explanatory guide and FAQs remain below the tool. The scoring explanation has its own disclosure.

## SEO audit

| Area | Evidence and result |
| --- | --- |
| Coverage | 77 public routes on the local build, including homepage, directory, categories, 48 file tools, both utilities, advanced tools, guides, pricing and public information pages. |
| Titles and descriptions | Public pages had present and distinct titles and descriptions in the production HTML. |
| Headings | One server-rendered H1 per route. A shared H2 now introduces the cards on PDF, image, document and conversion catalog pages. |
| Canonical and social metadata | Public canonicals and Open Graph URLs point to the corresponding HTTPS www URLs. Social preview URLs resolve locally. Directory filter URLs point to `/tools`. |
| Links and duplicates | Audited SSR link destinations and social assets. Removed the generic catalog entry that shadowed the dedicated `/edit-pdf` route. The dedicated page and its sitemap entry remain. |
| Images | Scanned server-rendered image attributes for missing alt attributes. Asset sizes and local timing evidence are described below. |
| Structured data and breadcrumbs | Parsed the emitted JSON-LD and checked present breadcrumb entries against their canonical targets. The inspected pages emit no rating, review or FAQPage schema. |
| Staging and private entry points | Public pages retain noindex. Robots disallows crawling and the sitemap is empty. Auth entry points have noindex. The dashboard redirects anonymous requests and the admin shell exposes no account data. |
| Errors and redirects | Unknown page, tool and guide URLs returned 404. Apex Host-header test returned 308 with the path and query preserved. |
| Useful visible content | Each public route served real HTML headings and page-specific metadata. Tool descriptions and guide copy were reviewed in the repository. The crawl checks technical signals and does not certify editorial quality or every generated interaction. |

The audit reported zero findings after the fixes, with 87 distinct internal destinations responding without a 4xx or 5xx. The existing shared and typing social images are both 1200 × 630 px and weigh 135,235 and 142,898 bytes respectively. An unthrottled 390 px local Chromium sample across Home, All Tools, Typing, Internet Speed Test, and Merge PDF observed 88–232 ms LCP, about 0.0012 CLS, and no page overflow. This is a local readout. INP and real-user Core Web Vitals were outside the run.

Confirmed SEO fixes are the catalog heading hierarchy, removal of the shadowed catalog entry, and the Typing Speed Test sitemap modification date for this UI update. The SEO audit does not change the canonical hostname, redirects, indexing gates or environment values. The staged sitemap inventory was compared against the public build routes. Enabled sitemap output was outside this run.

Remaining launch checks include deployment-side HTTPS and asset verification, field Core Web Vitals, production user journeys, and Search Console verification and sitemap submission. The admin route returns a noindex shell locally. Its protected data endpoints reject anonymous requests. The three advanced tools retain visible breadcrumbs and could gain their own BreadcrumbList JSON-LD in a future markup release.

[Route-by-route JSON audit](../artifacts/typing-seo/seo-audit.json) · [Local performance observations](../artifacts/typing-seo/local-performance.json) · [Separate Google launch checklist](./GOOGLE_SEO_LAUNCH_CHECKLIST.md)

## Files changed

| File | Change |
| --- | --- |
| `app/typing-test/page.tsx` | Short introduction and collapsible scoring guide |
| `app/typing-test/typing-focus.css` | Guide disclosure and mobile introduction |
| `components/typing/TypingTest.tsx` | Options, live display, results, progress and history presentation |
| `components/typing/typing.module.css` | Compact layout, disclosures and responsive cards |
| `components/ToolCatalog.tsx` | Missing catalog H2 |
| `lib/site-pages.ts` | Removed the shadowed catalog section |
| `app/sitemap.ts` | Updated the typing page modification date |
| `tests/browser/typing-test.spec.ts` | Disclosure-aware regression tests and eight-width responsive check |
| `scripts/audit-seo.mjs` | Repeatable public route audit |
| `docs/GOOGLE_SEO_LAUNCH_CHECKLIST.md` | Separate launch prerequisites |
| `docs/TYPING_UI_SEO_AUDIT.md` | This report |

## Verification

- **PASSED** TypeScript, ESLint, all 62 Node tests, and production build.
- **PASSED** 50 distinct Typing Speed Test cases across desktop and mobile Chromium, with two profile-specific skips. Two Quote assertions targeting the retired result caption were updated to verify the selected length and the mode in Detailed Stats, then passed on both profiles. The suite verifies all modes and durations, keystrokes, IME, Backspace, timer, restart, storage, clipboard, disclosure, graph output, keyboard focus and access scans.
- **PASSED** Idle, expanded Options and completed views fit 320, 360, 375, 390, 430, 768, 1024 and 1440 px. Expanded mobile history fit without horizontal scrolling. The attached brief folder supplied no typing screenshots, so the written requirements and five newly captured screenshots were used for the visual review.
- **PASSED** Two additional WebKit checks covered the eight-width layout and automated accessibility scans on initial and completed views.
- **PASSED** All ten mocked Internet Speed Test cases in desktop and mobile Chromium on a dedicated rerun. Two phase assertions timed out in the initial concurrent run, and passed when the suite ran independently.
- **PASSED** Seven regression cases covered real Merge PDF, Compress PDF, JPG to PNG and Resize Image results, directory filtering and auth entry UI. Anonymous session and admin authorization smoke checks passed. Tests that write account records were excluded.
- **NOT TESTED** Live M-Lab bandwidth, production database writes, physical phone keyboards, field Core Web Vitals, and production Google Search Console.

## Screenshots

- Idle state [desktop 1440 px](../artifacts/typing-seo/typing-idle-1440.png) · [mobile 390 px](../artifacts/typing-seo/typing-idle-390.png)
- Completed test [desktop 1440 px](../artifacts/typing-seo/typing-result-1440.png) · [mobile 390 px](../artifacts/typing-seo/typing-result-390.png)
- [Mobile history cards](../artifacts/typing-seo/typing-history-390.png)

## Reviewed deployment commands

Run from the existing `main` checkout only after review. Before pushing, confirm whether the GitHub push will trigger Hostinger and obtain approval for that deployment.

```powershell
git status --short
git add -- app/typing-test/page.tsx app/typing-test/typing-focus.css components/typing/TypingTest.tsx components/typing/typing.module.css components/ToolCatalog.tsx lib/site-pages.ts app/sitemap.ts tests/browser/typing-test.spec.ts scripts/audit-seo.mjs docs/GOOGLE_SEO_LAUNCH_CHECKLIST.md docs/TYPING_UI_SEO_AUDIT.md
git diff --cached --check
git diff --cached
git commit -m "Polish Editgoo typing test and audit staging SEO"
git push origin main
```
