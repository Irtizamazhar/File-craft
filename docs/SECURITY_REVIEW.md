# Security review ? 13 November 2026
P0/P1 fixes: exact-origin CSRF comparison including scheme and port; cross-site Fetch Metadata fallback rejection; noncached dynamic health/auth/admin routes; database errors no longer masquerade as anonymous success; transactional signup/session/Free plan creation; globally reused mysql2 pool; server-only database module; UTC driver timestamps; confirm-password and terms validation; current-password check and transaction for password changes, revoking all sessions.

Passwords use Node crypto scrypt with random per-user salt and timing-safe comparisons. Session tokens contain 32 random bytes; only SHA-256 token digests are stored. Cookies are HttpOnly, SameSite=Lax, Secure in production. Parameterized queries bind account values and IDs. Account/admin APIs check authenticated identity on the server. Auth test verifies cross-origin and non-admin rejection.

Input processing now checks PDF/image signatures, Office ZIP structure and expansion limits. File-size/count limits are checked inside the engine. Signatures are not malware scanning. ZIP inspection uses JSZip metadata and is a resource guard, not a security guarantee. HTML export sanitization, untrusted Office fixtures and worker cancellation need further review.

Remaining: process-local throttles need trusted-proxy and host WAF validation; request JSON bodies lack streaming byte limits; full CSP is not implemented (existing policy restricts frames/base/object); dependency vulnerability review blocked by npm registry access; password reset/email verification/account deletion are not implemented; consent evidence is not persisted; no independent security audit. No SMTP or payment success is claimed.

## 15 November 2026 advanced upgrade update

Registry access recovered for scoped operations. Compatible npm audit fixes were applied; nine findings remain (one high, eight moderate), including image-size through PptxGenJS. No forced breaking update was applied. Local PDFium/ONNX/model assets and license notices are present and processing is verified in Chromium. See [advanced upgrade report](FILECRAFT_ALL_TOOLS_ADVANCED_UPGRADE.md) for the current review, limits and release blockers; earlier network-blocked audit statements above are historical.
