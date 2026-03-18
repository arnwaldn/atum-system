---
description: Code review et fix automatique (user)
---

# /review-fix - Review & Auto-Fix

## USAGE
```
/review-fix "src/components/"
/review-fix "src/api/" --focus=security
/review-fix PR#123
/review-fix --staged
```

## DESCRIPTION
Review de code avec corrections automatiques
pour les issues detectees.

## MODES

### directory
Review un repertoire
```
/review-fix "src/components/"
```

### pr
Review une Pull Request
```
/review-fix PR#123
```

### staged
Review fichiers staged git
```
/review-fix --staged
```

## CATEGORIES REVIEW

### security
```yaml
security_issues:
  - file: src/api/auth.ts
    line: 45
    severity: high
    issue: "SQL injection vulnerability"
    fix: |
      // AVANT
      query(`SELECT * FROM users WHERE id = ${userId}`)
      // APRES
      query(`SELECT * FROM users WHERE id = $1`, [userId])
```

### performance
```yaml
performance_issues:
  - file: src/components/List.tsx
    line: 12
    issue: "Missing key in map"
    fix: "Add unique key prop"

  - file: src/hooks/useData.ts
    line: 8
    issue: "Dependency array missing"
    fix: "Add missing dependencies"
```

### best-practices
```yaml
best_practices:
  - file: src/utils/helpers.ts
    issue: "Using 'any' type"
    fix: "Define proper interface"

  - file: src/components/Form.tsx
    issue: "Inline function in render"
    fix: "Extract to useCallback"
```

### accessibility
```yaml
a11y_issues:
  - file: src/components/Button.tsx
    issue: "Missing aria-label"
    fix: "Add aria-label prop"
```

## WORKFLOW

### 1. Scan
```javascript
// Lire tous les fichiers cibles
files = Glob(targetPath + '/**/*.{ts,tsx}')
```

### 2. Analyse
Pour chaque fichier:
- Security patterns
- Performance anti-patterns
- Best practices violations
- Accessibility issues

### 3. Rapport
```yaml
review_report:
  files_reviewed: 25
  issues_found: 12
  auto_fixable: 8
  manual_required: 4

  by_severity:
    critical: 1
    high: 3
    medium: 5
    low: 3

  issues: [...]
```

### 4. Fix automatique
```javascript
// Appliquer fixes surs
for (issue of autoFixableIssues) {
  Edit({
    file_path: issue.file,
    old_string: issue.before,
    new_string: issue.after
  })
}
```

### 5. Summary
```yaml
fixes_applied:
  - file: src/api/users.ts
    issue: "SQL injection"
    status: FIXED

  - file: src/components/Form.tsx
    issue: "Missing key"
    status: FIXED

manual_review_needed:
  - file: src/lib/auth.ts
    issue: "Complex refactor needed"
    suggestion: "..."
```

## OPTIONS
| Option | Description |
|--------|-------------|
| --focus=X | security, perf, a11y, all |
| --auto-fix | Appliquer fixes auto |
| --dry-run | Preview sans modifier |
| --strict | Standards stricts |

## REGLES REVIEWEES

| Categorie | Exemples |
|-----------|----------|
| Security | XSS, SQL injection, secrets |
| Performance | N+1, memo, keys |
| Types | any, unknown, assertions |
| React | hooks rules, deps |
| A11y | aria, semantic HTML |

## MCP UTILISES
- Read/Edit (analyse et fix)
- Hindsight (patterns connus)
- GitHub (PR review)
