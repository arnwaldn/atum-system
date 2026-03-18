---
description: Odoo ERP module development — ORM, views, security, deployment, OCA standards
argument-hint: <topic> (e.g., model design, views, security, testing, deployment)
name: odoo-expert
version: "1.0.0"
metadata:
  domain: erp-backend
  triggers: odoo, ERP, module odoo, ORM odoo, vue XML odoo, QWeb, Owl 2, odoo.sh, OCA, ir.model.access, TransactionCase, manifest odoo
  role: specialist
  scope: implementation
  output-format: code
  related-skills: python-pro, clean-architecture, database-optimizer
---

# Odoo Expert

Specialist in Odoo ERP module development — models, views, security, testing, and production deployment following OCA standards.

## When to Use This Skill

- Creating or extending Odoo modules (17, 18, 19)
- Designing models, computed fields, constraints, and wizards
- Building XML views (form, tree, kanban, search, pivot)
- Configuring security (access rights, record rules, groups)
- Writing QWeb reports (PDF/HTML)
- Implementing web controllers and JSON-RPC endpoints
- Writing tests with TransactionCase
- Deploying on Odoo.sh or bare-metal Ubuntu
- Following OCA (Odoo Community Association) conventions

## Agent

This skill delegates complex Odoo tasks to the **odoo-expert** agent (`agents/odoo-expert.md`).
The agent has access to Context7 MCP for live Odoo documentation.

Invoke the agent for:
- Full module scaffolding from scratch
- Complex ORM patterns (multi-company, multi-currency, inheritance)
- Security architecture design (groups hierarchy, record rules)
- Migration scripts between Odoo versions
- Performance optimization (N+1 detection, index strategy)

## Reference Files

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Module structure, ORM, views, security, testing, deployment | `references/odoo-module-guide.md` | Any Odoo development task |

## Quick Patterns

### Module scaffold command
```bash
python odoo-bin scaffold my_module ./addons/
```

### Start dev server with auto-reload
```bash
python odoo-bin -d mydb -u my_module --dev=all
```

### Run tests for a module
```bash
python odoo-bin -d testdb --test-enable --test-tags my_module -u my_module --stop-after-init
```

## OCA Checklist (Always Verify)

- [ ] Manifest version: `{odoo_version}.1.0.0`
- [ ] `_order` defined on every model
- [ ] `_description` in English
- [ ] `tracking=True` on state/important fields
- [ ] `@api.model_create_multi` on `create()`
- [ ] `ensure_one()` in single-record actions
- [ ] `super()` called in all create/write/unlink overrides
- [ ] Tests tagged with `@tagged("post_install", "-at_install")`
- [ ] No `sudo()` outside controllers
- [ ] No browsing in loops — use relational fields
