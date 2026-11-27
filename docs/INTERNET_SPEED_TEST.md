# Editgoo Internet Speed Test reliability

## Findings

- Download previously selected only the first Locate result. A rejected upgrade left no alternate even when Locate returned another usable endpoint. The installed NDT7 0.1.5 download worker counts text frames in its client byte total, emits samples only when a message arrives after the sampling interval, and does not capture final counters or distinguish close codes. Local TLS fixtures reproduced opening rejection, a transfer that ends before the first sample, control-only traffic and an abnormal close after a valid sample.
- Upload previously required AppInfo in the last server message. The SDK can report a later message without AppInfo even after valid server measurements or client transfers. The worker retains the most recent valid server and browser samples and prefers server-received throughput. The fallback uses SDK payload bytes queued minus bytes still buffered and is labeled browser-measured. The close adapter corrects a separate problem in the installed SDK, which reports a generic completion message on an abnormal close.
- The two live observations establish that each direction had reported a result on a separate run. The legacy opening error does not identify whether a server, access token, TLS handshake or network caused that session to fail. No live request diagnostics were available.

## Changes

The browser worker consumes direction-specific Locate URLs and preserves their access tokens. It can try one alternate download endpoint after a failed opening handshake. Once a download opens, it measures binary payload bytes only, publishes real samples and calculates a final result on clean close. Download proceeds to upload even if discovery supplied no usable download endpoint or the download timed out. The existing SDK still handles upload pacing and consent. Server AppInfo elapsed time is in microseconds, SDK upload client elapsed time is in seconds, and native download timestamps are converted from milliseconds. All displayed throughput is in Mbps.

A run completes only with two validated measurements. Interrupted directions show N/A with phase-specific feedback, while successful measurements remain available for sharing. The gauge identifies the measured direction and uses indeterminate progress until data arrives. Ping is sourced from the download server's minimum TCP RTT and jitter remains N/A. Development diagnostics report sanitized stage, sample, outcome, timeout and SDK status fields.

A short consent notice appears next to Start Test and Test Again. Its link opens the Privacy Policy section covering NDT7, browser initiation, bandwidth, public IP collection, publication and retention. No provider request is made before the user starts a test. [NDT7 protocol](https://github.com/m-lab/ndt-server/blob/main/spec/ndt7-protocol.md) · [M-Lab JavaScript client](https://github.com/m-lab/ndt7-js) · [Locate v2](https://www.measurementlab.net/develop/locate-v2/) · [M-Lab Privacy Policy](https://www.measurementlab.net/privacy/)

## Verification

- **PASSED** TypeScript, ESLint, 64 unit tests and production build.
- **PASSED** 57 distinct Playwright cases across desktop Chromium, mobile Chromium and WebKit over multiple runs. Tests use the production standalone build with local TLS WebSockets and intercepted Locate responses. Chromium passed the full-duration test with the unmodified SDK and server-side backpressure. The fixture verified positive browser-to-server binary bytes. WebKit passed with a shorter SDK send loop and smaller chunks, which the fault scenarios also use to bound loopback traffic.
- **FAILED** The separate full-duration WebKit loopback attempt exhausted the automation worker's heap. A rerun with server backpressure reached the upload watchdog. WebKit's bounded fixture passed. Full-duration WebKit reliability remains unverified.
- **PASSED** Keyboard consent, no automatic provider request, privacy anchor, direction labels, indeterminate progress, partial sharing, automated accessibility and no horizontal overflow at 320, 375, 390, 430, 768, 1024 and 1440 px. Desktop and mobile captures were visually reviewed.
- **PASSED** Four Chromium regression checks cover actual Merge PDF and Resize Image outputs, Typing Speed Test discovery and signup validation.
- **LIVE NDT7 TEST — NOT TESTED.** Explicit consent for a live bandwidth test was unavailable. A single authorized test must still confirm two positive results and the completed state against the real service.

[Desktop capture](../artifacts/speed-test-reliability/idle-1440.png) · [Mobile capture](../artifacts/speed-test-reliability/idle-390.png)

## Files and manual Git commands

The paths in the staging command list the complete change set. Run these commands manually from the repository root on the intended main checkout when ready to publish.

```powershell
git status --short --branch
git add -- ':(literal)app/[section]/page.tsx' app/internet-speed-test/InternetSpeedTest.tsx app/internet-speed-test/speed-test.css docs/INTERNET_SPEED_TEST.md lib/site-pages.ts lib/speed-test/measurement.ts lib/speed-test/ndt.worker.ts lib/speed-test/upload-socket.worker.js tests/browser/internet-speed-test.spec.ts tests/internet-speed-test.test.mjs types/ndt7.d.ts
git diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "Fix incomplete Editgoo internet speed measurements"
git push origin main
```
