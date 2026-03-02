---
name: claude-a11y-skill
description: "Real-time accessibility guidance during coding. Provides inline a11y best practices, ARIA patterns, and fix suggestions as you write UI code. Scope: proactive a11y guidance while coding ONLY. For full WCAG compliance auditing with axe-core scans, use the accessibility-auditor agent instead."
version: "1.0.0"
metadata:
  author: https://github.com/airowe
  triggers: accessibility guidance, a11y help, aria patterns, accessible component, keyboard navigation, screen reader, focus management
---

# Accessibility Guidance Skill

Real-time accessibility guidance during UI development. Provides inline best practices, ARIA patterns, and fix suggestions as you write code.

## Scope Boundaries

**IN SCOPE:** Proactive accessibility guidance while writing UI code. Inline suggestions for ARIA attributes, keyboard navigation, focus management, semantic HTML, color contrast awareness, and accessible component patterns.

**OUT OF SCOPE:** Full WCAG compliance auditing with axe-core runtime scans, eslint-plugin-jsx-a11y static analysis, or multi-page audit reports. For those, use the **accessibility-auditor** agent instead.

## When to Use This Skill

- Writing new UI components and wanting to get a11y right from the start
- Adding form controls, modals, dropdowns, or interactive widgets
- Implementing keyboard navigation or focus management
- Choosing between ARIA patterns for a specific UI pattern
- Ensuring semantic HTML structure in templates

## Core Principles

### 1. Semantic HTML First
Always prefer native HTML elements over ARIA:
- `<button>` over `<div role="button">`
- `<nav>` over `<div role="navigation">`
- `<input type="checkbox">` over custom checkbox with ARIA

### 2. Keyboard Navigation
Every interactive element must be:
- Focusable (via native element or `tabindex="0"`)
- Operable with keyboard (Enter, Space, Arrow keys as appropriate)
- Visually focused (never `outline: none` without replacement)

### 3. ARIA Usage Rules
- **First rule of ARIA**: Don't use ARIA if native HTML works
- **Second rule**: Don't change native semantics unless necessary
- **Third rule**: All interactive ARIA controls must be keyboard accessible
- **Fourth rule**: Don't use `role="presentation"` or `aria-hidden="true"` on focusable elements
- **Fifth rule**: All interactive elements must have an accessible name

## Common Component Patterns

### Modal Dialog
```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog Title</h2>
  <!-- Focus trap: Tab cycles within dialog -->
  <!-- Escape key closes dialog -->
  <!-- Return focus to trigger element on close -->
</div>
```

### Dropdown Menu
```html
<button aria-haspopup="true" aria-expanded="false" aria-controls="menu-id">
  Menu
</button>
<ul id="menu-id" role="menu">
  <li role="menuitem" tabindex="-1">Option 1</li>
  <!-- Arrow keys navigate, Enter selects, Escape closes -->
</ul>
```

### Form Controls
```html
<!-- Always associate labels -->
<label for="email">Email</label>
<input id="email" type="email" aria-describedby="email-help" required>
<span id="email-help">We will never share your email</span>

<!-- Error states -->
<input aria-invalid="true" aria-errormessage="email-error">
<span id="email-error" role="alert">Please enter a valid email</span>
```

### Live Regions
```html
<!-- For dynamic content updates -->
<div aria-live="polite" aria-atomic="true">
  <!-- Content changes announced to screen readers -->
</div>

<!-- For urgent alerts -->
<div role="alert">Error: Something went wrong</div>
```

### Tabs
```html
<div role="tablist" aria-label="Settings">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">General</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabindex="-1">Advanced</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>...</div>
```

## Quick Reference: Common Fixes

| Issue | Fix |
|-------|-----|
| Image without alt | Add `alt="description"` or `alt=""` for decorative |
| Button without text | Add text content, `aria-label`, or `aria-labelledby` |
| Link without text | Add text content or `aria-label` |
| Form input without label | Add `<label>` with `for` attribute or `aria-label` |
| Color-only information | Add text/icon alongside color indicator |
| Auto-playing media | Add pause/stop controls |
| Missing skip link | Add "Skip to main content" link before navigation |
| Missing page language | Add `lang` attribute to `<html>` |
| Missing heading structure | Use h1-h6 in logical order, one h1 per page |
| Custom widget no keyboard | Add `tabindex`, `onKeyDown` handlers |

## Color Contrast Minimums

| Element | Ratio | WCAG Level |
|---------|-------|------------|
| Normal text | 4.5:1 | AA |
| Large text (18px+ or 14px+ bold) | 3:1 | AA |
| UI components and graphics | 3:1 | AA |
| Normal text | 7:1 | AAA |
| Large text | 4.5:1 | AAA |

## Focus Management Patterns

- **Page navigation**: Move focus to main content or h1
- **Modal open**: Move focus to first focusable element or dialog itself
- **Modal close**: Return focus to trigger element
- **Item delete**: Move focus to next item or parent container
- **Accordion expand**: Keep focus on trigger, don't move
- **Toast/notification**: Use `aria-live`, don't move focus

## Constraints

### MUST DO
- Suggest semantic HTML before ARIA attributes
- Include keyboard interaction patterns for custom widgets
- Mention focus management for dynamic content changes
- Note color contrast requirements for color choices
- Provide accessible name for every interactive element

### MUST NOT DO
- Suggest `tabindex` values > 0 (disrupts natural tab order)
- Recommend `aria-hidden="true"` on focusable elements
- Skip keyboard support for custom interactive components
- Ignore focus management in SPAs
- Run full WCAG audits (that is accessibility-auditor agent territory)
