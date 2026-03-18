# RAPPORT D'INFORMATION TRIMESTRIELLE

**ATUM SAS** — {{trimestre}} {{annee}}
Conformement a l'article 24.2 des Statuts et au Pacte d'Associes

---

## 1. Comptes de gestion

### Compte de resultat simplifie ({{trimestre}})

| Poste | Reel {{trimestre}} | Budget {{trimestre}} | Variance | Variance % |
|---|---|---|---|---|
| **Revenus** | | | | |
| TourFlow | {{rev_tourflow}} | {{bud_tourflow}} | {{var_tourflow}} | {{var_pct_tourflow}} |
| TradingBrain | {{rev_tradingbrain}} | {{bud_tradingbrain}} | {{var_tradingbrain}} | {{var_pct_tradingbrain}} |
| Quick Summarize | {{rev_qs}} | {{bud_qs}} | {{var_qs}} | {{var_pct_qs}} |
| API Horodatage | {{rev_api}} | {{bud_api}} | {{var_api}} | {{var_pct_api}} |
| Agence Dev | {{rev_agence}} | {{bud_agence}} | {{var_agence}} | {{var_pct_agence}} |
| **CA Total** | **{{ca_total}}** | **{{bud_ca_total}}** | **{{var_ca}}** | **{{var_pct_ca}}** |
| | | | | |
| **Charges** | {{charges_total}} | {{bud_charges_total}} | {{var_charges}} | {{var_pct_charges}} |
| **EBITDA** | **{{ebitda}}** | **{{bud_ebitda}}** | **{{var_ebitda}}** | **{{var_pct_ebitda}}** |
| **Marge EBITDA** | {{marge_ebitda}}% | {{bud_marge_ebitda}}% | | |

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
| MRR | {{mrr}} | {{mrr_cible}} | {{mrr_progression}}% |
| ARR (annualise) | {{arr}} | {{arr_cible}} | {{arr_progression}}% |
| Clients TourFlow | {{clients_tf}} | {{cible_tf}} | {{progression_tf}}% |
| Clients TradingBrain | {{clients_tb}} | {{cible_tb}} | {{progression_tb}}% |
| Clients Quick Summarize | {{clients_qs}} | {{cible_qs}} | {{progression_qs}}% |
| Churn moyen | {{churn}}% | <5% | {{churn_status}} |
| CAC moyen | {{cac}} EUR | {{cac_cible}} EUR | {{cac_status}} |
| LTV/CAC | {{ltv_cac}} | >10 | {{ltv_cac_status}} |
| Equipe | {{equipe}} pers. | 2-3 | |

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
