# Editgoo Internet Speed Test

Route: `https://www.editgoo.com/internet-speed-test`. Changes in this report are local.

## Upload diagnosis and fix

The installed `@m-lab/ndt7` version is 0.1.5. The existing application ignored the SDK upload worker's `Source: client` messages and read throughput from `LastServerMeasurement.AppInfo` alone. The protocol makes `AppInfo` optional, and the SDK summary retains the last server packet even when it has no application counters. Either condition could yield Upload N/A after bytes had been sent. Local TLS fixtures reproduce both conditions. The exact cause of the reported live session remains unverified.

The worker now retains each direction's latest valid app-level sample. Upload prefers the server's bytes received, and uses the SDK's browser-side bytes sent minus queued bytes if server throughput is unavailable. The UI and share text label the browser fallback. SDK `ElapsedTime` is in seconds. Server `AppInfo.ElapsedTime` is in microseconds and converted separately. Both calculations use bytes × 8 ÷ seconds ÷ 1,000,000.

Discovery validates the separate secure endpoints and keeps each embedded access token. A missing endpoint can leave the other direction usable. Each phase requires a start, a completion callback, a zero SDK status, a valid sample and no callback error. Phase watchdogs stop ahead of the SDK watchdogs that can resolve with code zero. Cancellation, timeouts and offline events terminate the session worker. Older worker events cannot overwrite newer results. Development diagnostics log a direction and sanitized outcome code only. The browser cannot distinguish all possible server rejection or network causes from a WebSocket error.

Ping remains the minimum TCP RTT reported by the download server. Jitter remains N/A. No provider credentials or SDK upgrade were needed. [NDT7 JavaScript client](https://github.com/m-lab/ndt7-js) · [NDT7 protocol and units](https://github.com/m-lab/ndt-server/blob/main/spec/ndt7-protocol.md) · [Locate API](https://www.measurementlab.net/develop/locate-v2/)

## Interface and consent

Start Test and Test Again are measurement-specific affirmative actions. Each appears beside the visible data-use, public IP and publication notice with a link to M-Lab's policy. Clicking either button passes `userAcceptedDataPolicy=true` for that run. No checkbox, persistent consent, automatic test, or background retry is involved.

M-Lab documents affirmative acceptance in the SDK. Its public policies do not prescribe a separate checkbox. EDPB guidance describes informed, specific and unambiguous affirmative action. This design applies that guidance to this optional measurement, separate from general site terms. Jurisdiction-specific legal approval was outside this implementation. [M-Lab acceptable use](https://www.measurementlab.net/aup/) · [M-Lab privacy policy](https://www.measurementlab.net/privacy/) · [EDPB consent guidance](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en)

The UI now has one set of result cards. The gauge shows an indeterminate indicator while connecting or waiting for the first sample, then displays measured speed. The needle transitions with reduced-motion support. Failures retain valid partial results. Sharing includes measured values and no IP address.

## Files modified in this pass

- `app/internet-speed-test/InternetSpeedTest.tsx`
- `app/internet-speed-test/page.tsx`
- `app/internet-speed-test/speed-test.css`
- `lib/speed-test/measurement.ts`
- `lib/speed-test/ndt.worker.ts`
- `types/ndt7.d.ts`
- `tests/browser/internet-speed-test.spec.ts`
- `tests/internet-speed-test.test.mjs`
- `docs/INTERNET_SPEED_TEST.md`

Prior typing and SEO changes in the working tree were kept outside this pass.

## Verification

- **PASSED** TypeScript, ESLint, 63 unit tests and the production build.
- **PASSED** 27 distinct Playwright checks across desktop Chromium, mobile Chromium and WebKit against local TLS fixtures. One WebKit poll missed a brief upload state even though the test completed with a browser-measured upload. The fixture now observes actual gauge changes and passed on all three profiles in a focused rerun. Coverage includes a final packet without AppInfo, browser-only upload, upload WebSocket rejection, partial results, timeout, cancellation, worker errors, stale events, retry and both share paths.
- **PASSED** Keyboard activation, the policy notice and link, zero discovery requests before Start Test, automated accessibility, and no horizontal overflow at 320, 375, 390, 430, 768, 1024 and 1440 px.
- **PASSED** Four Chromium regressions covered real Merge PDF and Resize Image outputs, Typing Speed Test directory discovery and signup validation UI.
- **NOT TESTED** Live M-Lab. No explicit live-test consent was provided. Local TLS fixtures exercise the actual SDK workers against test traffic. They cannot confirm that a live M-Lab upload now succeeds.

[Desktop capture](../artifacts/speed-test-polish/idle-1440.png) · [Mobile capture](../artifacts/speed-test-polish/idle-390.png)

## Manual push after review

Run on the existing `main` checkout only when ready to push. Confirm that the index contains only the intended changes, especially if the repository has a deployment trigger.

```powershell
git status --short
git add -- app/internet-speed-test/InternetSpeedTest.tsx app/internet-speed-test/page.tsx app/internet-speed-test/speed-test.css lib/speed-test/measurement.ts lib/speed-test/ndt.worker.ts types/ndt7.d.ts tests/browser/internet-speed-test.spec.ts tests/internet-speed-test.test.mjs docs/INTERNET_SPEED_TEST.md
git diff --cached --check
git diff --cached
git commit -m "Fix Editgoo upload speed reporting and simplify test consent"
git push origin main
```
