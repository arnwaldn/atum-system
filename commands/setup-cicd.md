---
description: Setup CI/CD pipeline (GitHub Actions, GitLab CI, Azure Pipelines)
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
argument-hint: [--github-actions | --gitlab-ci | --azure] [--with-docker] [--with-deploy]
---

# Setup CI/CD Pipeline: $ARGUMENTS

Setup a production-ready CI/CD pipeline for the current project.

## Phase 1: Detection

1. Detect project type: `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`
2. Detect existing CI: `.github/workflows/`, `.gitlab-ci.yml`, `azure-pipelines.yml`
3. Detect test framework: jest, vitest, pytest, go test, cargo test
4. Detect deployment target: Vercel, Railway, Cloudflare, Docker

If `$ARGUMENTS` does not specify a platform, auto-detect from git remote or ask.

## Phase 2: Pipeline Structure (GitHub Actions default)

Create `.github/workflows/ci.yml` with:

### CI Job (every push/PR)
- Checkout, setup runtime, install deps
- Lint: eslint / ruff / golangci-lint / clippy
- Type check: tsc --noEmit / mypy / go vet
- Test: with coverage report, fail if < 80%
- Build: verify build succeeds
- Security: dependency audit

### Deploy Staging (on develop merge)
- Build production artifacts
- Deploy to staging environment
- Run smoke tests

### Deploy Production (on main merge, manual approval)
- Build production artifacts
- Deploy to production
- Run smoke tests
- Notify on success/failure

## Phase 3: Supporting Files

Create:
- `.github/CODEOWNERS` — code ownership
- `.github/pull_request_template.md` — PR template with checklist
- `.github/ISSUE_TEMPLATE/bug_report.md` — bug report template
- `.github/ISSUE_TEMPLATE/feature_request.md` — feature request template

## Phase 4: Options

If `--with-docker`: Add Dockerfile + docker-compose.yml for local dev
If `--with-deploy`: Configure deployment to detected platform
If `--gitlab-ci`: Use `.gitlab-ci.yml` instead of GitHub Actions
If `--azure`: Use `azure-pipelines.yml`

## Phase 5: Verification

After creating all files:
1. Validate YAML syntax with a dry parse
2. Show summary of all created files
3. Explain how to customize the pipeline
