# RAPPORT D'INFORMATION TRIMESTRIELLE

**ATUM SAS** — {{trimestre}} {{annee}}
Conformement a l'article 24.2 des Statuts et au Pacte d'Associes

---

## 1. Comptes de gestion

### Compte de resultat simplifie ({{trimestre}}) — Modele 3 Moteurs

| Poste | Reel {{trimestre}} | Budget {{trimestre}} | Variance | Variance % |
|---|---|---|---|---|
| **MOTEUR SERVICES** | | | | |
| Agence Dev | {{rev_agence}} | {{bud_agence}} | {{var_agence}} | {{var_pct_agence}} |
| Integrations Odoo | {{rev_odoo}} | {{bud_odoo}} | {{var_odoo}} | {{var_pct_odoo}} |
| Formations & Conseil | {{rev_formations}} | {{bud_formations}} | {{var_formations}} | {{var_pct_formations}} |
| **Sous-total Services** | **{{st_services}}** | **{{bud_st_services}}** | **{{var_st_services}}** | **{{var_pct_st_services}}** |
| | | | | |
| **MOTEUR SaaS** | | | | |
| GigRoute | {{rev_gigroute}} | {{bud_gigroute}} | {{var_gigroute}} | {{var_pct_gigroute}} |
| TradingBrain | {{rev_tradingbrain}} | {{bud_tradingbrain}} | {{var_tradingbrain}} | {{var_pct_tradingbrain}} |
| Quick Summarize | {{rev_quicksummarize}} | {{bud_quicksummarize}} | {{var_quicksummarize}} | {{var_pct_quicksummarize}} |
| OWL (EU AI Act) | {{rev_owl}} | {{bud_owl}} | {{var_owl}} | {{var_pct_owl}} |
| **Sous-total SaaS** | **{{st_saas}}** | **{{bud_st_saas}}** | **{{var_st_saas}}** | **{{var_pct_st_saas}}** |
| | | | | |
| **MOTEUR SATELLITES** | | | | |
| Sites niche (AdSense + Affiliation) | {{rev_satellites}} | {{bud_satellites}} | {{var_satellites}} | {{var_pct_satellites}} |
| **Sous-total Satellites** | **{{st_satellites}}** | **{{bud_st_satellites}}** | **{{var_st_satellites}}** | **{{var_pct_st_satellites}}** |
| | | | | |
| **WORK FOR EQUITY** | | | | |
| API Horodatage (30% ATUM) | {{rev_equity}} | {{bud_equity}} | {{var_equity}} | {{var_pct_equity}} |
| **Sous-total Equity** | **{{st_equity}}** | **{{bud_st_equity}}** | **{{var_st_equity}}** | **{{var_pct_st_equity}}** |
| | | | | |
| **CA TOTAL** | **{{ca_total}}** | **{{bud_ca_total}}** | **{{var_ca}}** | **{{var_pct_ca}}** |
| **Charges** | {{charges_total}} | {{bud_charges_total}} | {{var_charges}} | {{var_pct_charges}} |
| **EBITDA** | **{{ebitda}}** | **{{bud_ebitda}}** | **{{var_ebitda}}** | **{{var_pct_ebitda}}** |
| **Marge EBITDA** | {{marge_ebitda}}% | {{bud_marge_ebitda}}% | | |

> Seuils d'alerte : variance > +/- 10% = justification requise | > +/- 25% = plan d'action

### Bilan simplifie

| Poste | Montant |
|---|---|
| Tresorerie | {{tresorerie}} |
| Creances clients | {{creances}} |
| Total Actif | {{total_actif}} |
| Capital social | {{capital}} |
| Reserves | {{reserves}} |
| Dettes | {{dettes}} |

## 2. Tresorerie et previsions

| Mois | Tresorerie debut | Encaissements | Decaissements | Tresorerie fin |
|---|---|---|---|---|
{{#mois}}
| {{nom}} | {{treso_debut}} | {{encaissements}} | {{decaissements}} | {{treso_fin}} |
{{/mois}}

**Previsions 6 mois** : {{prevision_6_mois}}

## 3. Indicateurs cles (KPIs)

| KPI | Valeur | Cible An1 | Progression |
|---|---|---|---|
| MRR | {{mrr}} | 149 000 EUR | {{mrr_progression}}% |
| ARR (annualise) | {{arr}} | 1 792 000 EUR | {{arr_progression}}% |
| Clients GigRoute | {{clients_gigroute}} | 200 | {{progression_gigroute}}% |
| Clients TradingBrain | {{clients_tradingbrain}} | 300 | {{progression_tradingbrain}}% |
| Clients Quick Summarize | {{clients_quicksummarize}} | 1 000 | {{progression_quicksummarize}}% |
| Clients OWL | {{clients_owl}} | 100 | {{progression_owl}}% |
| Sites satellites actifs | {{sites_satellites}} | 10 | {{progression_satellites}}% |
| Projets agence | {{projets_agence}} | 10-20 | |
| TJM moyen agence | {{tjm_moyen}} EUR | 800-1 200 EUR | |
| Churn moyen | {{churn}}% | < 5% | {{churn_status}} |
| CAC moyen | {{cac}} EUR | < 50 EUR | {{cac_status}} |
| LTV/CAC | {{ltv_cac}} | > 10 | {{ltv_cac_status}} |
| Equipe | {{equipe}} pers. | 3 associes | |
| Breakeven | {{breakeven_status}} | Q2 2026 | |

## 4. Avancement roadmap produit

| Produit | Objectif {{trimestre}} | Statut | Commentaire |
|---|---|---|---|
{{#roadmap}}
| {{produit}} | {{objectif}} | {{statut}} | {{commentaire}} |
{{/roadmap}}

## 5. Risques et opportunites

### Risques identifies

{{#risques}}
- **{{nom}}** ({{probabilite}} / {{impact}}) : {{description}} — Mitigation : {{mitigation}}
{{/risques}}

### Opportunites

{{#opportunites}}
- **{{nom}}** : {{description}}
{{/opportunites}}

---

**Etabli le** : {{date_rapport}}
**Par** : {{auteur}}, {{fonction}}
**Diffusion** : Associes ATUM SAS (confidentiel)
**Archivage** : `~/Documents/ATUM-Agency/agence/rapports/`
