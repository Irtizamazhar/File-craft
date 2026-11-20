# Release checklist
- [x] Existing repository/routes retained; no force push or secret commit.
- [x] Actual database connection and six-table schema verified locally.
- [x] Signup/login/logout/session and Free-plan writes tested with disposable data.
- [x] Profile/password changes and session revocation tested.
- [x] 19 automated tests pass, including 11 real PDF operations.
- [ ] Install/run ESLint; registry blocked in this session.
- [ ] Install Playwright and browsers; run npm.cmd run test:browser.
- [ ] Verify every advertised conversion in browser and all required viewport widths.
- [ ] Configure real domain and operator details.
- [ ] Verify MySQL 8 and HTTPS cookie behavior on Hostinger.
- [ ] Implement reset/email verification, deletion, consent record retention and fuller admin modules.
- [ ] Complete certified CMP, Google accounts and optional payment merchant configuration.
- [ ] Run deployed-site and independent security checks before production.

Paid plans and checkout remain disabled. Full original acceptance criteria have not been met; do not describe this as production-ready.
