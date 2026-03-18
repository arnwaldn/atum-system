# Odoo Module Development Guide

Practical reference for Odoo 17/18/19 module development following OCA standards.

---

## Module Structure

```
my_module/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── my_model.py
├── views/
│   ├── my_model_views.xml
│   └── menus.xml
├── security/
│   ├── ir.model.access.csv
│   └── security.xml          # groups + record rules
├── data/
│   ├── data.xml               # config data loaded at install
│   └── sequence.xml
├── report/
│   ├── my_report.xml          # report action
│   └── my_report_template.xml
├── wizard/
│   ├── __init__.py
│   ├── my_wizard.py
│   └── my_wizard_views.xml
├── controllers/
│   ├── __init__.py
│   └── main.py
├── static/
│   └── description/icon.png
└── tests/
    ├── __init__.py
    └── test_my_model.py
```

---

## __manifest__.py

```python
{
    "name": "My Module",
    "version": "17.0.1.0.0",     # {odoo_version}.{major}.{minor}.{patch}
    "summary": "Short one-line description",
    "author": "ATUM SAS",
    "website": "https://atum.fr",
    "category": "Tools",
    "license": "LGPL-3",
    "depends": ["base", "mail"],
    "data": [
        "security/ir.model.access.csv",
        "security/security.xml",
        "data/sequence.xml",
        "views/my_model_views.xml",
        "views/menus.xml",
        "report/my_report.xml",
        "report/my_report_template.xml",
    ],
    "demo": ["data/demo.xml"],
    "installable": True,
    "application": False,
    "auto_install": False,
}
```

---

## ORM Patterns

### Complete model

```python
from odoo import api, fields, models
from odoo.exceptions import UserError, ValidationError
import logging

_logger = logging.getLogger(__name__)


class MyModel(models.Model):
    _name = "my.model"
    _description = "My Model"           # English, mandatory OCA
    _order = "date desc, name asc"      # mandatory OCA
    _inherit = ["mail.thread", "mail.activity.mixin"]

    # Basic fields
    name = fields.Char(string="Name", required=True, tracking=True, index=True)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        "res.company", default=lambda self: self.env.company, required=True
    )
    state = fields.Selection(
        [("draft", "Draft"), ("confirmed", "Confirmed"), ("done", "Done")],
        default="draft", tracking=True, copy=False,
    )
    date = fields.Date(default=fields.Date.today, required=True)
    partner_id = fields.Many2one("res.partner", ondelete="restrict", index=True)
    line_ids = fields.One2many("my.model.line", "model_id", string="Lines")

    # Computed field (stored = triggers DB index + SQL filter)
    amount_total = fields.Float(
        compute="_compute_amount_total", store=True, digits="Account"
    )

    @api.depends("line_ids.subtotal")
    def _compute_amount_total(self):
        for record in self:
            record.amount_total = sum(record.line_ids.mapped("subtotal"))

    # Onchange (UI only — not called on write())
    @api.onchange("partner_id")
    def _onchange_partner_id(self):
        if self.partner_id:
            self.currency_id = self.partner_id.property_purchase_currency_id

    # Python constraint
    @api.constrains("date")
    def _check_date(self):
        for r in self:
            if r.date and r.date > fields.Date.today():
                raise ValidationError("Date cannot be in the future.")

    # SQL constraint (DB-level, faster)
    _sql_constraints = [
        ("name_company_uniq", "UNIQUE(name, company_id)", "Name must be unique per company!"),
    ]

    # Create — ALWAYS use model_create_multi (OCA mandatory)
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("reference", "New") == "New":
                vals["reference"] = self.env["ir.sequence"].next_by_code("my.model") or "New"
        return super().create(vals_list)

    def write(self, vals):
        # Add business logic before write
        return super().write(vals)

    def unlink(self):
        if any(r.state not in ("draft",) for r in self):
            raise UserError("Only draft records can be deleted.")
        return super().unlink()

    # Actions — use ensure_one() for single-record methods
    def action_confirm(self):
        self.ensure_one()
        if not self.line_ids:
            raise UserError("Add at least one line before confirming.")
        self.write({"state": "confirmed"})
        self.message_post(body="Confirmed.")
```

### Field types reference

```python
# Scalars
fields.Char(size=255)                          # VARCHAR
fields.Text()                                  # TEXT (multiline)
fields.Html()                                  # sanitized HTML
fields.Integer()
fields.Float(digits=(16, 2))                   # or digits="Account"
fields.Monetary(currency_field="currency_id")
fields.Boolean(default=False)
fields.Date()
fields.Datetime()
fields.Binary(attachment=True)                 # store as ir.attachment

# Relational
fields.Many2one("res.partner", ondelete="restrict")   # restrict|cascade|set null
fields.One2many("my.line", "model_id")
fields.Many2many("res.tag", string="Tags")

# Selection
fields.Selection([("a", "A"), ("b", "B")], default="a")
```

### Domain syntax

```python
# Logical operators: &, |, !  (prefix notation)
domain = [("state", "=", "confirmed"), ("amount_total", ">", 1000)]
domain = ["|", ("partner_id.country_id.code", "=", "FR"), ("global", "=", True)]

# Dynamic domain using context
domain = [("company_id", "=", company_ids)]  # available in record rules
domain = [("user_id", "=", user.id)]         # available in record rules
```

---

## XML Views

### Form view

```xml
<record id="view_my_model_form" model="ir.ui.view">
    <field name="name">my.model.form</field>
    <field name="model">my.model</field>
    <field name="arch" type="xml">
        <form>
            <header>
                <button name="action_confirm" string="Confirm" type="object"
                    class="oe_highlight" invisible="state != 'draft'"/>
                <field name="state" widget="statusbar"
                    statusbar_visible="draft,confirmed,done"/>
            </header>
            <sheet>
                <div class="oe_title">
                    <h1><field name="name"/></h1>
                </div>
                <group>
                    <group>
                        <field name="partner_id"/>
                        <field name="date"/>
                    </group>
                    <group>
                        <field name="company_id" groups="base.group_multi_company"/>
                    </group>
                </group>
                <notebook>
                    <page string="Lines" name="lines">
                        <field name="line_ids">
                            <tree editable="bottom">
                                <field name="sequence" widget="handle"/>
                                <field name="product_id"/>
                                <field name="qty" sum="Total Qty"/>
                                <field name="unit_price"/>
                                <field name="subtotal" sum="Total"/>
                            </tree>
                        </field>
                    </page>
                </notebook>
            </sheet>
            <div class="oe_chatter">
                <field name="message_follower_ids"/>
                <field name="activity_ids"/>
                <field name="message_ids"/>
            </div>
        </form>
    </field>
</record>
```

### Tree / list view

```xml
<record id="view_my_model_tree" model="ir.ui.view">
    <field name="name">my.model.tree</field>
    <field name="model">my.model</field>
    <field name="arch" type="xml">
        <tree decoration-muted="state == 'cancelled'">
            <field name="name"/>
            <field name="partner_id"/>
            <field name="date"/>
            <field name="amount_total" sum="Total"/>
            <field name="state" widget="badge"
                decoration-success="state == 'done'"
                decoration-warning="state == 'confirmed'"/>
        </tree>
    </field>
</record>
```

### Search view

```xml
<record id="view_my_model_search" model="ir.ui.view">
    <field name="name">my.model.search</field>
    <field name="model">my.model</field>
    <field name="arch" type="xml">
        <search>
            <field name="name" string="Name / Ref"
                filter_domain="['|', ('name', 'ilike', self), ('reference', 'ilike', self)]"/>
            <field name="partner_id"/>
            <separator/>
            <filter name="draft" string="Draft" domain="[('state', '=', 'draft')]"/>
            <filter name="mine" string="My Records" domain="[('user_id', '=', uid)]"/>
            <group expand="0" string="Group By">
                <filter name="by_partner" string="Partner"
                    context="{'group_by': 'partner_id'}"/>
                <filter name="by_month" string="Month"
                    context="{'group_by': 'date:month'}"/>
            </group>
        </search>
    </field>
</record>
```

### Window action + menu

```xml
<record id="action_my_model" model="ir.actions.act_window">
    <field name="name">My Models</field>
    <field name="res_model">my.model</field>
    <field name="view_mode">tree,form,kanban</field>
    <field name="context">{'search_default_draft': 1}</field>
</record>

<menuitem id="menu_my_module_root" name="My Module" sequence="50"/>
<menuitem id="menu_my_model" name="Records"
    parent="menu_my_module_root" action="action_my_model"/>
```

---

## Security

### ir.model.access.csv

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_model_user,my.model user,model_my_model,base.group_user,1,1,1,0
access_my_model_manager,my.model manager,model_my_model,my_module.group_manager,1,1,1,1
```

### Groups and record rules (security.xml)

```xml
<odoo>
    <!-- Groups hierarchy: Manager implies User -->
    <record id="group_user" model="res.groups">
        <field name="name">User</field>
        <field name="category_id" ref="base.module_category_hidden"/>
    </record>

    <record id="group_manager" model="res.groups">
        <field name="name">Manager</field>
        <field name="category_id" ref="base.module_category_hidden"/>
        <field name="implied_ids" eval="[(4, ref('group_user'))]"/>
    </record>

    <!-- Multi-company record rule (always add for company_id models) -->
    <record id="rule_my_model_company" model="ir.rule">
        <field name="name">My Model: Company</field>
        <field name="model_id" ref="model_my_model"/>
        <field name="domain_force">[('company_id', 'in', company_ids)]</field>
        <field name="groups" eval="[(4, ref('base.group_user'))]"/>
    </record>

    <!-- Ownership rule: users can only write their own records -->
    <record id="rule_my_model_own" model="ir.rule">
        <field name="name">My Model: Own</field>
        <field name="model_id" ref="model_my_model"/>
        <field name="domain_force">[('user_id', '=', user.id)]</field>
        <field name="groups" eval="[(4, ref('group_user'))]"/>
        <field name="perm_read" eval="False"/>
        <field name="perm_write" eval="True"/>
        <field name="perm_create" eval="False"/>
        <field name="perm_unlink" eval="True"/>
    </record>
</odoo>
```

---

## Testing

```python
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError, ValidationError
from odoo.tests import tagged


@tagged("post_install", "-at_install")
class TestMyModel(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.partner = cls.env["res.partner"].create({"name": "Test Partner"})

    def _make(self, **kwargs):
        """Factory method — keeps tests DRY."""
        defaults = {
            "name": "Test",
            "partner_id": self.partner.id,
            "line_ids": [(0, 0, {"product_id": self._get_product().id, "qty": 1, "unit_price": 100.0})],
        }
        return self.env["my.model"].create({**defaults, **kwargs})

    def _get_product(self):
        return self.env["product.product"].create({"name": "Test Product"})

    def test_sequence_generated_on_create(self):
        record = self._make()
        self.assertNotEqual(record.reference, "New")

    def test_amount_total_computed(self):
        record = self._make()
        self.assertEqual(record.amount_total, 100.0)

    def test_confirm_transitions_state(self):
        record = self._make()
        record.action_confirm()
        self.assertEqual(record.state, "confirmed")

    def test_confirm_without_lines_raises(self):
        record = self.env["my.model"].create({"name": "Empty", "partner_id": self.partner.id})
        with self.assertRaises(UserError):
            record.action_confirm()

    def test_unlink_confirmed_raises(self):
        record = self._make()
        record.action_confirm()
        with self.assertRaises(UserError):
            record.unlink()
```

### Test commands

```bash
# Run all tests for a module
python odoo-bin -d testdb --test-enable --test-tags my_module -u my_module --stop-after-init

# Run a specific test class
python odoo-bin -d testdb --test-enable --test-tags /my_module:TestMyModel --stop-after-init

# Run a specific test method
python odoo-bin -d testdb --test-enable --test-tags /my_module:TestMyModel.test_confirm --stop-after-init
```

---

## Wizard (TransientModel)

```python
class MyWizard(models.TransientModel):
    _name = "my.wizard"
    _description = "My Wizard"

    model_ids = fields.Many2many(
        "my.model",
        default=lambda self: self.env.context.get("active_ids", []),
    )
    reason = fields.Text(required=True)

    def action_execute(self):
        if not self.model_ids:
            raise UserError("Select at least one record.")
        self.model_ids.action_confirm()
        return {"type": "ir.actions.act_window_close"}
```

```xml
<!-- Wizard view -->
<record id="view_my_wizard_form" model="ir.ui.view">
    <field name="name">my.wizard.form</field>
    <field name="model">my.wizard</field>
    <field name="arch" type="xml">
        <form string="Confirm Records">
            <group>
                <field name="model_ids" widget="many2many_tags"/>
                <field name="reason"/>
            </group>
            <footer>
                <button name="action_execute" string="Confirm" type="object"
                    class="oe_highlight"/>
                <button string="Cancel" class="btn-secondary"
                    special="cancel"/>
            </footer>
        </form>
    </field>
</record>
```

---

## QWeb Report

```xml
<!-- report/my_report.xml — Report action -->
<odoo>
    <record id="report_my_model" model="ir.actions.report">
        <field name="name">My Report</field>
        <field name="model">my.model</field>
        <field name="report_type">qweb-pdf</field>
        <field name="report_name">my_module.report_my_model_template</field>
        <field name="binding_model_id" ref="model_my_model"/>
        <field name="binding_type">report</field>
    </record>
</odoo>

<!-- report/my_report_template.xml — QWeb template -->
<odoo>
    <template id="report_my_model_template">
        <t t-call="web.html_container">
            <t t-foreach="docs" t-as="doc">
                <t t-call="web.external_layout">
                    <div class="page">
                        <h2><span t-field="doc.name"/></h2>
                        <table class="table table-sm">
                            <thead>
                                <tr><th>Product</th><th>Qty</th><th>Subtotal</th></tr>
                            </thead>
                            <tbody>
                                <tr t-foreach="doc.line_ids" t-as="line">
                                    <td><span t-field="line.product_id.name"/></td>
                                    <td><span t-field="line.qty"/></td>
                                    <td>
                                        <span t-field="line.subtotal"
                                            t-options='{"widget": "monetary", "display_currency": doc.currency_id}'/>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </t>
            </t>
        </t>
    </template>
</odoo>
```

---

## Web Controller

```python
from odoo import http
from odoo.http import request


class MyController(http.Controller):

    @http.route("/my_module/api/records", type="json", auth="user", methods=["GET"])
    def get_records(self, **kwargs):
        records = request.env["my.model"].search_read(
            domain=[("state", "=", "confirmed")],
            fields=["id", "name", "reference", "amount_total"],
            limit=50,
        )
        return {"records": records, "count": len(records)}
```

---

## Deployment

### Development

```bash
# Install module
python odoo-bin -d mydb -i my_module --stop-after-init

# Update module (after code changes)
python odoo-bin -d mydb -u my_module --stop-after-init

# Dev mode (auto-reload assets, debug menu)
python odoo-bin -d mydb -u my_module --dev=all

# Interactive shell
python odoo-bin shell -d mydb
```

### Odoo.sh

1. Push module to the repository connected to Odoo.sh
2. The platform detects `__manifest__.py` and lists the module
3. Install/upgrade via Settings > Apps
4. Staging branches: test on staging before merging to production

### Ubuntu bare metal

```bash
# Copy module to addons path
cp -r my_module /opt/odoo/custom_addons/

# Restart Odoo service
sudo systemctl restart odoo

# Update module list and install via CLI
sudo -u odoo /opt/odoo/odoo-bin -d mydb -u my_module --stop-after-init
```

---

## OCA Rules (Non-Negotiable)

1. Manifest version: always `{odoo_version}.1.0.0` format
2. `_order` mandatory on every model
3. `_description` in English, class name in PascalCase
4. `tracking=True` on state fields and critical business fields
5. `@api.model_create_multi` on every `create()` override
6. `ensure_one()` before accessing `self` in single-record actions
7. Always call `super()` in create/write/unlink overrides
8. Tests in separate classes per feature, tagged with `@tagged`
9. No `sudo()` outside HTTP controllers
10. No `browse()` or field access in loops — traverse via relational fields
