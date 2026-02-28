---
name: open-source-license-compliance
description: "Detect and audit open-source licenses in project dependencies. Use when reviewing license compatibility, checking for copyleft contamination, generating compliance reports, or evaluating SPDX identifiers. Covers npm, pip, cargo, go modules, and multi-ecosystem license scanning. Warns about GPL/AGPL in proprietary projects."
version: "1.0.0"
---

# Open Source License Compliance Auditor

Systematically audit project dependencies for license compatibility, copyleft risk, and compliance obligations.

## When to Invoke

- User asks about license compliance, open-source licensing, or dependency licenses
- Before releasing a project as open-source or proprietary
- During dependency audits or security reviews
- When adding new dependencies to a project
- When evaluating whether a license is compatible with the project

## When NOT to Use

- For vulnerability scanning (use supply-chain-risk-auditor instead)
- For legal advice (always recommend consulting a lawyer for edge cases)
- For license selection for new projects (can advise but not decide)

## License Classification

### Permissive Licenses (Low Risk)

| License | SPDX ID | Key Obligations |
|---------|---------|-----------------|
| MIT | MIT | Include copyright notice and license text |
| Apache 2.0 | Apache-2.0 | Include notice, state changes, patent grant |
| BSD 2-Clause | BSD-2-Clause | Include copyright notice |
| BSD 3-Clause | BSD-3-Clause | Include copyright notice, no endorsement |
| ISC | ISC | Include copyright notice |
| Unlicense | Unlicense | No obligations (public domain) |
| CC0 1.0 | CC0-1.0 | No obligations (public domain dedication) |
| 0BSD | 0BSD | No obligations |

### Weak Copyleft (Medium Risk)

| License | SPDX ID | Key Risk |
|---------|---------|----------|
| LGPL 2.1 | LGPL-2.1-only | Must allow re-linking; modifications to LGPL code must be shared |
| LGPL 3.0 | LGPL-3.0-only | Same as 2.1 plus anti-tivoization |
| MPL 2.0 | MPL-2.0 | File-level copyleft; modified MPL files must be shared |
| EPL 2.0 | EPL-2.0 | Module-level copyleft |
| CDDL 1.0 | CDDL-1.0 | File-level copyleft, patent retaliation |

### Strong Copyleft (High Risk for Proprietary)

| License | SPDX ID | Key Risk |
|---------|---------|----------|
| GPL 2.0 | GPL-2.0-only | Entire derivative work must be GPL |
| GPL 3.0 | GPL-3.0-only | Same plus anti-tivoization, patent grant |
| AGPL 3.0 | AGPL-3.0-only | Network use triggers copyleft (SaaS risk) |
| SSPL | SSPL-1.0 | Service-level copyleft (extreme) |
| CC-BY-SA 4.0 | CC-BY-SA-4.0 | ShareAlike for creative works |

### Non-Commercial / Restricted

| License | SPDX ID | Key Risk |
|---------|---------|----------|
| CC-BY-NC | CC-BY-NC-4.0 | No commercial use |
| BSL 1.1 | BUSL-1.1 | Time-limited restriction, then permissive |
| Elastic 2.0 | Elastic-2.0 | No competing SaaS offering |
| EUPL 1.2 | EUPL-1.2 | Copyleft, compatible with GPL |

## Compatibility Matrix

### Combining Licenses (Can A include B?)

| Project License | Can include MIT | Apache-2.0 | LGPL | MPL-2.0 | GPL-2.0 | GPL-3.0 | AGPL-3.0 |
|----------------|----------------|------------|------|---------|---------|---------|----------|
| **Proprietary** | Yes | Yes | Careful | Yes (file-level) | NO | NO | NO |
| **MIT** | Yes | Yes | NO | NO | NO | NO | NO |
| **Apache-2.0** | Yes | Yes | NO | Yes | NO | NO | NO |
| **GPL-2.0** | Yes | Disputed | Yes | NO | Yes | NO | NO |
| **GPL-3.0** | Yes | Yes | Yes | Yes | Yes (2.0-or-later) | Yes | NO |
| **AGPL-3.0** | Yes | Yes | Yes | Yes | Yes (or-later) | Yes | Yes |

## Audit Workflow

### Step 1: Detect Package Manager

Scan for manifest files:

| File | Ecosystem | Command to List Licenses |
|------|-----------|------------------------|
| package.json / package-lock.json | npm/Node.js | `npx license-checker --summary` |
| requirements.txt / pyproject.toml | Python/pip | `pip-licenses --format=table` |
| Cargo.toml / Cargo.lock | Rust/cargo | `cargo license` |
| go.mod / go.sum | Go modules | `go-licenses report .` |
| Gemfile / Gemfile.lock | Ruby/bundler | `bundle exec license_finder` |
| pom.xml | Java/Maven | `mvn license:third-party-report` |
| composer.json | PHP/Composer | `composer licenses` |
| pubspec.yaml | Dart/Flutter | `dart pub deps --json` + manual check |

### Step 2: Extract Licenses

For each dependency:
1. Check the package registry metadata (npm registry, PyPI, crates.io)
2. Look for LICENSE/LICENCE/COPYING file in the package
3. Check SPDX identifier in manifest (package.json `license` field, Cargo.toml `license`)
4. Flag any UNLICENSED, UNKNOWN, or missing license declarations

### Step 3: Classify Risk

For each dependency, assign a risk level:
- **GREEN**: Permissive license, fully compatible
- **YELLOW**: Weak copyleft, compatible with care (LGPL dynamic linking, MPL file isolation)
- **RED**: Strong copyleft, incompatible with proprietary distribution
- **BLACK**: No license found (defaults to "all rights reserved" -- cannot use legally)

### Step 4: Generate Report

```markdown
# License Compliance Report

## Project: [name]
## Distribution: [proprietary|open-source|SaaS]
## Date: [date]

### Summary
- Total dependencies: N
- GREEN (permissive): N
- YELLOW (weak copyleft): N
- RED (strong copyleft): N
- BLACK (unknown/none): N

### Issues Requiring Action
| Dependency | Version | License | Risk | Action Required |
|-----------|---------|---------|------|-----------------|
| example-pkg | 1.2.3 | GPL-3.0 | RED | Remove or replace |

### Recommendations
[Specific actions for each issue]
```

## Common Pitfalls

| Pitfall | Why It Matters | Fix |
|---------|---------------|-----|
| Dual-licensed package, wrong license chosen | Some packages offer MIT OR GPL; ensure you pick the permissive option | Explicitly declare which license you are using |
| Transitive GPL dependency | A permissive dep depends on a GPL dep -- the GPL propagates | Audit transitive deps, not just direct |
| AGPL in SaaS backend | AGPL triggers on network use, not just distribution | Replace AGPL deps in server code or open-source your server |
| No LICENSE file = no license | Code without a license defaults to all rights reserved | Contact the author or find an alternative |
| License header in source but not in metadata | npm/pip metadata may say MIT but source files say GPL | Check actual LICENSE file, not just metadata |
| Dev-only dependencies | Dependencies used only for testing/building may not trigger copyleft | Distinguish devDependencies from runtime dependencies |
| Font and asset licenses | CC-BY-NC fonts or images may restrict commercial use | Audit assets separately from code dependencies |

## SPDX Quick Reference

SPDX (Software Package Data Exchange) is the standard for license identifiers.

Format: `SPDX-License-Identifier: MIT`
Compound: `MIT OR Apache-2.0` (choice), `MIT AND CC-BY-4.0` (both apply)
With exception: `GPL-2.0-only WITH Classpath-exception-2.0`

Full list: https://spdx.org/licenses/

## Rationalizations to Reject

- **"It is just a dev dependency"** -- Dev dependencies in Docker images ship to production. Verify the boundary.
- **"Nobody enforces GPL"** -- The Software Freedom Conservancy and FSF actively enforce. Do not assume non-enforcement.
- **"We only use it internally"** -- GPL triggers on distribution, not internal use. But AGPL triggers on network access.
- **"The package is too small to matter"** -- License obligations apply regardless of package size.
- **"We will replace it later"** -- Technical debt compounds. Replace now or document the risk formally.
