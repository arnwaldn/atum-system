# Security Audit

Comprehensive security audit for any project type.

## Arguments

$ARGUMENTS — Scope of audit (e.g., "deps", "secrets", "owasp", "all", "hardening")

## Instructions

### 1. Detect Project Stack
Identify languages, frameworks, and package managers in use.

### 2. Run Audit Based on Scope

#### `deps` — Dependency Audit
- Run appropriate audit command:
  - npm: `npm audit`
  - pip: `pip-audit` or `safety check`
  - cargo: `cargo audit`
  - go: `govulncheck ./...`
  - composer: `composer audit`
  - bundler: `bundle audit`
  - maven: `mvn dependency-check:check`
- Report: severity, affected package, fix available (yes/no)
- Auto-fix where possible (`npm audit fix`)

#### `secrets` — Secret Scanning
- Scan codebase for hardcoded secrets:
  - API keys, tokens, passwords
  - Private keys (RSA, ED25519)
  - Connection strings with credentials
  - `.env` files committed to git
- Check `.gitignore` includes sensitive files
- Verify secrets are loaded from env vars or secret manager

#### `owasp` — OWASP Top 10 Review
For each applicable category:
- A01: Check access control (auth, authz on all endpoints)
- A02: Check crypto (hashing algorithms, TLS config)
- A03: Check injection points (SQL, NoSQL, OS, XSS)
- A05: Check security headers (CSP, HSTS, X-Frame-Options)
- A07: Check authentication (rate limiting, session management)
- A09: Check logging (sensitive data not logged)

#### `hardening` — Production Hardening
- Debug mode disabled
- Error messages don't leak internals
- HTTPS enforced
- Security headers configured
- Rate limiting on public endpoints
- CORS properly configured
- Database: least privilege, no default passwords

#### `all` — Full Security Audit
Run all above scopes and produce prioritized report.

### 3. Report Format
```
## Security Audit Report — [project name]

### CRITICAL (immediate action)
🔴 [Finding + remediation steps]

### HIGH (fix before deploy)
🟠 [Finding + remediation steps]

### MEDIUM (fix in next sprint)
🟡 [Finding + remediation steps]

### LOW (backlog)
🔵 [Finding + improvement suggestion]

### Summary
| Category | Issues Found | Critical | High | Medium | Low |
|----------|-------------|----------|------|--------|-----|
```
