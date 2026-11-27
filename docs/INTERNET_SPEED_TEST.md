# Editgoo Internet Speed Test

Target URL after deployment is `https://www.editgoo.com/internet-speed-test`.

The screen follows the supplied desktop and mobile reference with the Editgoo header and footer, a red heading icon, an SVG gauge, a desktop metric legend and a separate four-metric results strip. The strip stacks into two columns on mobile. It starts with dashes and shows an unavailable result as N/A after the test. Native share and clipboard copy use measured values, the timestamp and the tool URL. The clipboard fallback also offers selectable text.

## Measurement and consent

- A visit makes no Measurement Lab request. The user must accept the linked privacy notice and select Start Test or Test Again. Consent and results stay in page memory.
- An on-demand worker makes one HTTPS request to the public M-Lab Locate v2 endpoint and passes the short-lived tokens from discovery to `@m-lab/ndt7@0.1.5`. The official client's sequential `downloadTest` and `uploadTest` calls run over WSS. The client's `userAcceptedDataPolicy` flag is set after user consent. Editgoo's server carries no test payload.
- Download uses the official client's application byte count and elapsed seconds. Upload uses the M-Lab server's application bytes received and converts elapsed microseconds to seconds. Both use `bytes × 8 / seconds / 1,000,000` for Mbps. Invalid counters and elapsed times produce unavailable readings. A successful direction can appear even when its counterpart fails.
- Ping is M-Lab's minimum TCP RTT on the download connection. The app converts microseconds to milliseconds. Jitter is N/A because this integration has no suitable independent RTT sample series.
- Cancellation and interruption terminate the session worker. The UI shows discovery, download and upload phases, and allows manual retry. The interactive integration handles provider rate limiting and makes no automatic retries or scheduled requests.
- The Editgoo Privacy Policy describes the public IP and measurement data M-Lab collects and the publication of test data. Share text contains no IP. No speed-test results are written to the Editgoo database.

Public Locate returns per-test access tokens. No backend credentials, registration token, or Hostinger change is needed for this public integration. Registered priority access has a separate M-Lab setup.

Provider references include the [NDT7 JavaScript client](https://github.com/m-lab/ndt7-js), [integration guide](https://www.measurementlab.net/kb/integrating-mlab-tests/), [Locate API](https://www.measurementlab.net/develop/locate-v2/), [protocol](https://github.com/m-lab/ndt-server/blob/main/spec/ndt7-protocol.md), [rate limits](https://www.measurementlab.net/kb/test-rate-limits/), [acceptable use policy](https://www.measurementlab.net/aup/) and [privacy policy](https://www.measurementlab.net/privacy/).

## Files created

- `app/internet-speed-test/InternetSpeedTest.tsx`
- `app/internet-speed-test/page.tsx`
- `app/internet-speed-test/speed-test.css`
- `lib/speed-test/measurement.ts`
- `lib/speed-test/ndt.worker.ts`
- `types/ndt7.d.ts`
- `tests/internet-speed-test.test.mjs`
- `tests/browser/internet-speed-test.spec.ts`
- `tests/fixtures/internet-speed-test/localhost-test-cert.pem`
- `tests/fixtures/internet-speed-test/localhost-test-key.pem`
- `docs/INTERNET_SPEED_TEST.md`

The certificate and key are public test fixtures for loopback TLS. The browser test uses intercepted discovery and real WebSockets to a local fixture with synthetic traffic. None of the fixture data or keys are part of the shipped app.

## Files modified

- `app/sitemap.ts`
- `components/AllToolsDirectory.tsx`
- `components/Header.tsx`
- `lib/site-pages.ts`
- `lib/utility-tools.ts`
- `package.json`
- `package-lock.json`
- `tests/browser/advanced-directory.spec.ts`
- `tests/browser/typing-test.spec.ts`

The directory's existing Utilities category, search and All Tools navigation expose the new route. Metadata includes the canonical URL, Open Graph, and SoftwareApplication and breadcrumb JSON-LD. The sitemap keeps its existing indexing gate.

## Verification

- **PASSED** TypeScript, ESLint, all 62 Node tests, and the production build.
- **PASSED** All 15 Playwright cases in desktop Chromium, mobile Chromium and WebKit against standalone production output. Local TLS fixtures exercised the actual official NDT7 workers, discovery consent, both transfer phases, measured-result rendering, rate limits, partial results, retry, native share and clipboard. The fixture verified that cancellation and going offline closed active test sockets.
- **PASSED** No horizontal overflow at 320, 375, 390, 430, 768, 1024 or 1440 px. Axe checks, keyboard consent, Utilities and search passed. The standalone response contained the expected title, canonical URL and security header. It remained noindex, and no provider or PDF request was observed on idle visits.
- **PASSED** Six existing Chromium regression checks covered a real Merge PDF output, a real Resize Image output, Typing Speed Test discovery, directory filtering, and auth entry UI. Account-mutating integration tests were outside this run.
- **PASSED** Read-only smoke checks for anonymous session resolution, the Privacy Policy disclosure and the disabled sitemap.
- **NOT TESTED** Live M-Lab measurement. The brief conditions a live test on explicit measurement consent. Browser download and upload verification used local fixture traffic.
- **NOT TESTED** Firefox and physical mobile devices.

Screenshots show the unmeasured idle state. [Desktop 1440 px](../artifacts/internet-speed-test/idle-1440.png) · [Mobile 390 px](../artifacts/internet-speed-test/idle-390.png)

## Reviewed push

Run only after reviewing the implementation and verification results.

```powershell
git switch main
git add -- app/internet-speed-test app/sitemap.ts components/AllToolsDirectory.tsx components/Header.tsx lib/site-pages.ts lib/utility-tools.ts lib/speed-test package.json package-lock.json tests/browser/advanced-directory.spec.ts tests/browser/internet-speed-test.spec.ts tests/browser/typing-test.spec.ts tests/internet-speed-test.test.mjs tests/fixtures/internet-speed-test types/ndt7.d.ts docs/INTERNET_SPEED_TEST.md
git diff --cached --check
git diff --cached
git commit -m "Add Editgoo Internet Speed Test"
git push origin main
```
