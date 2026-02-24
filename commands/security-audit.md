# Security Audit

Comprehensive security audit for any project type.

## Arguments

$ARGUMENTS — Scope of audit (e.g., "deps", "secrets", "owasp", "hardening", "host", "all")

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

#### `host` — Machine-Level Security Audit
Audit the development machine itself (Windows-focused, adapt for Linux/macOS):

**Config & Secrets Exposure**:
- Scan `~/.claude/`, `~/.ssh/`, `~/.aws/`, `~/.npmrc`, `~/.gitconfig` for overly permissive file permissions
- Check for plaintext secrets in config files (`~/.env`, `~/.netrc`, `~/.docker/config.json`)
- Verify SSH keys are passphrase-protected: `ssh-keygen -y -P "" -f ~/.ssh/id_*` (should fail)
- Check git credential storage: `git config credential.helper` (avoid `store` which saves plaintext)

**Network Exposure**:
- List listening ports: `netstat -ano | findstr LISTENING` (Windows) or `ss -tlnp` (Linux)
- Flag unexpected services on 0.0.0.0 (bound to all interfaces)
- Check Windows Firewall status: `netsh advfirewall show allprofiles state`
- Verify no Docker containers expose sensitive ports to 0.0.0.0

**System Hardening**:
- BitLocker status: `manage-bde -status C:` (requires admin — report if unavailable)
- Windows Update status: `powershell -c "Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 5"`
- Antivirus status: check Windows Security Center or installed AV
- UAC enabled: `reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v EnableLUA`

**PATH Safety**:
- Check for writable directories in PATH that come before system dirs
- Flag any PATH entry in user-writable locations (potential DLL/binary hijacking)
- Verify `~/bin/` permissions if it exists in PATH
- Check for `.` (current directory) in PATH (classic attack vector)

**Claude Code Specific**:
- Audit MCP server configs in `~/.claude/settings.json` for overly broad `allowedTools`
- Check hook scripts for shell injection risks (unquoted variables, eval usage)
- Verify `dangerouslySkipPermissions` is not enabled
- Scan `~/.claude.json` for exposed API keys or tokens
- Check that `settings.local.json` deny list is appropriate

**Report**: Same severity format as other scopes (CRITICAL/HIGH/MEDIUM/LOW).

#### `all` — Full Security Audit
Run all above scopes (deps, secrets, owasp, hardening, host) and produce prioritized report.

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
