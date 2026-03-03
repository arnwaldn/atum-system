# Google Drive — ATUM SAS Backup

## Regle utilisateur (2026-03-03)

**OBLIGATOIRE** : A chaque modification de documents administratifs ATUM (`~/Documents/ATUM-Agency/`), synchroniser les changements sur Google Drive dans le dossier `ATUM SAS/`.

Cela inclut :
- Creation/modification de documents (devis, factures, contrats, PV, rapports)
- Ajout de fichiers (logos, PDFs, templates)
- Modification de structure (nouveaux dossiers, renommages)

## Methode de synchronisation

- **Upload fichier local** : `mcp__google-workspace__create_drive_file` avec `fileUrl: file:///C:/Users/arnau/Documents/ATUM-Agency/...`
- **Deplacer fichier Drive** : `mcp__google-workspace__update_drive_file` avec `add_parents` / `remove_parents`
- **Creer dossier** : `mcp__google-workspace__create_drive_folder`
- **Supprimer** : `mcp__google-workspace__update_drive_file` avec `trashed: true`
- **IMPORTANT** : serialiser les appels Google Workspace MCP (pas de parallele, sinon SSL timeout)

## Structure Drive (miroir de ~/Documents/ATUM-Agency/)

```
Mon Drive/
├── ATUM SAS/                          → 1bkDQHB6do1zqwJ7G1swdd6M1vwB4jyMk
│   ├── 01-fondateurs/                 → 1AxEutrUObRZyup_VIbJoTX0BS9FT774B
│   │   └── strategie/                 → 1MiztQWkTixYGz__qRTgc00thCR44_gc2
│   ├── 02-identite-visuelle/          → 1_PNB-Am5ppld-wjTiNzFc2UAJqJiA6c6
│   ├── 03-gouvernance/                → 1QCmy8VTivLzAkeoFX88UPQi6ZrU084EK
│   │   ├── pv/                        → 1VQKmGZx6wFNB1NfETr7EpjH7G379yvpT
│   │   ├── convocations/              → 1lZrEuNryCA5vLKWO7YzWPt7ZaEiOPysw
│   │   └── conventions-reglementees/  → 19eN4OHeWfaQTjLzGngyXUKrKr5VXJI0n
│   ├── 04-finances/                   → 13m6DESss-3-v8Jey82wWaO7CBSjj1jcT
│   │   ├── rapports-trimestriels/     → 1iKjrZdrPIwE2WzcOQLAtKVssWKL5YAEx
│   │   └── bilans/                    → 1BHjknWAKrtVKS20VR6WQGTaHTkuVRjhn
│   ├── 05-facturation/                → 12AQtERPy1l5jaOjqqdtCJZa5V0M39o_7
│   │   ├── devis/                     → 1sl0xO0qeT_h-V9Dvo_46j7sh_QHS9qGM
│   │   ├── factures/                  → 1QdZ894ydmurZlR6l20UEIWyP_KmybT1L
│   │   └── relances/                  → 1ERoe3Pg4-yaVzGf0NRmbdmt3lp6OSO-4
│   ├── 06-contrats/                   → 10UJeweLXdIzSi0d5OGWLzdnuJXOGBvuH
│   │   ├── prestations/               → 1Fq_79gpOqNes0H_AogpHTo5HRlNtJ0-6
│   │   ├── nda/                       → 1iPhI8BTUChQHTp2HlUKjNspZi8Mn5D9w
│   │   ├── freelances/                → 1g0D3A8RQYm5OQ0qxhdScKexvgzm_PDZ8
│   │   └── cgv/                       → 134hZvT9VuNuV2uCPdLnikCrqL4lRzJZW
│   ├── 07-clients/                    → 1Y_tauulTiDx9VrWX_jm2-6BPxotqM4aT
│   ├── 08-prospects/                  → 1axfSqWspQEhzwNHnSLuJQJGH9xsfEWCE
│   ├── 09-equipe/                     → 1AwwvzTpl1SHlWLXP611L_SfpbAW6hQ2n
│   │   ├── registre/                  → 1VF53_jm86JDc2JsfreduNkFWBV8waguX
│   │   ├── timetracking/              → 1FMZjR6OP3nio5gGHz0UX6zmr8bl4qMg4
│   │   └── frais/                     → 17Yn-c_s5v9k-H-fJCDvDC8wfuk5y-D_o
│   ├── 10-conformite/                 → 1cWlSYXgVidIV2WsmC4bzHFjN2NWz_VEB
│   │   ├── rgpd/                      → 10taMasDshsSB6vA3qdazYkDA7g2kCpS-
│   │   └── assurances/                → 1q1xnGt77mjaL3D-6zWV7aEJzDqvIxHCP
│   ├── 11-produits/                   → 1rd05OihuRGOOVkmjImuHyxs-qkOZMGP0
│   │   └── strategie/                 → 1_XHjB3TIMq3Lxinv-8Zfp8aCqWz6Mmuj
│   ├── 12-veille/                     → 1rYSX7EoDtM2bXA_cmn2eQcdi6pLJYufM
│   └── templates/                     → 1Mh2hRd5qn3kaZeMBv_9vBrIiP23pUyMm
├── Trading/                           → 1wF9FCdQOvfbbVrDx4Tk7RJnX6dCVAevS
│   ├── Journaux/                      → 1lq67Jcwio2zD3WlCzw6yXL6GRNwupEwa
│   └── Demos/                         → 1oOPt1iGVU5gY7GP1jgqlGw-LMDq596ZU
├── Developpement/                     → 1jh35-O1Cx8i9l7fjvkKJyBNLYGBaO7h3
├── Medias/                            → 1aej5xmWaxV-aYevc1WQqlbSFNfLCiXOa
│   ├── Screenshots/                   → 1Xwru63sCynxrJEUqwbvRse8UnX_4jx8q
│   ├── Images Gemini/                 → 12aPS3aV1xuQznGP0uir_4qwCAuLrNHw1
│   └── Videos/                        → 1MDnvGL2bXw5sHcg4vvpoLSAINYp52KxW
├── Personnel/                         → 1DixINM0tJ997bsI6_VmL5B7NtNtvxQCU
│   ├── Assurance/                     → 1iXjZnIrfCTx3pVHNu3ewwWe3jwp--gMX
│   └── Documents/                     → 1BbzKAXaubqduvP2FSOpD2FPg54KeeF3L
└── _Archive/                          → 1Iya5dkixwUJki7odrqm5QXYLbH7hy-fW
```

## Mapping local → Drive (ATUM SAS uniquement)

| Dossier local | Folder ID Drive |
|---|---|
| `~/Documents/ATUM-Agency/` | `1bkDQHB6do1zqwJ7G1swdd6M1vwB4jyMk` (ATUM SAS) |
| `01-fondateurs/` | `1AxEutrUObRZyup_VIbJoTX0BS9FT774B` |
| `01-fondateurs/strategie/` | `1MiztQWkTixYGz__qRTgc00thCR44_gc2` |
| `02-identite-visuelle/` | `1_PNB-Am5ppld-wjTiNzFc2UAJqJiA6c6` |
| `03-gouvernance/` | `1QCmy8VTivLzAkeoFX88UPQi6ZrU084EK` |
| `03-gouvernance/pv/` | `1VQKmGZx6wFNB1NfETr7EpjH7G379yvpT` |
| `03-gouvernance/convocations/` | `1lZrEuNryCA5vLKWO7YzWPt7ZaEiOPysw` |
| `03-gouvernance/conventions-reglementees/` | `19eN4OHeWfaQTjLzGngyXUKrKr5VXJI0n` |
| `04-finances/` | `13m6DESss-3-v8Jey82wWaO7CBSjj1jcT` |
| `04-finances/rapports-trimestriels/` | `1iKjrZdrPIwE2WzcOQLAtKVssWKL5YAEx` |
| `04-finances/bilans/` | `1BHjknWAKrtVKS20VR6WQGTaHTkuVRjhn` |
| `05-facturation/` | `12AQtERPy1l5jaOjqqdtCJZa5V0M39o_7` |
| `05-facturation/devis/` | `1sl0xO0qeT_h-V9Dvo_46j7sh_QHS9qGM` |
| `05-facturation/factures/` | `1QdZ894ydmurZlR6l20UEIWyP_KmybT1L` |
| `05-facturation/relances/` | `1ERoe3Pg4-yaVzGf0NRmbdmt3lp6OSO-4` |
| `06-contrats/` | `10UJeweLXdIzSi0d5OGWLzdnuJXOGBvuH` |
| `06-contrats/prestations/` | `1Fq_79gpOqNes0H_AogpHTo5HRlNtJ0-6` |
| `06-contrats/nda/` | `1iPhI8BTUChQHTp2HlUKjNspZi8Mn5D9w` |
| `06-contrats/freelances/` | `1g0D3A8RQYm5OQ0qxhdScKexvgzm_PDZ8` |
| `06-contrats/cgv/` | `134hZvT9VuNuV2uCPdLnikCrqL4lRzJZW` |
| `07-clients/` | `1Y_tauulTiDx9VrWX_jm2-6BPxotqM4aT` |
| `08-prospects/` | `1axfSqWspQEhzwNHnSLuJQJGH9xsfEWCE` |
| `09-equipe/` | `1AwwvzTpl1SHlWLXP611L_SfpbAW6hQ2n` |
| `09-equipe/registre/` | `1VF53_jm86JDc2JsfreduNkFWBV8waguX` |
| `09-equipe/timetracking/` | `1FMZjR6OP3nio5gGHz0UX6zmr8bl4qMg4` |
| `09-equipe/frais/` | `17Yn-c_s5v9k-H-fJCDvDC8wfuk5y-D_o` |
| `10-conformite/` | `1cWlSYXgVidIV2WsmC4bzHFjN2NWz_VEB` |
| `10-conformite/rgpd/` | `10taMasDshsSB6vA3qdazYkDA7g2kCpS-` |
| `10-conformite/assurances/` | `1q1xnGt77mjaL3D-6zWV7aEJzDqvIxHCP` |
| `11-produits/` | `1rd05OihuRGOOVkmjImuHyxs-qkOZMGP0` |
| `11-produits/strategie/` | `1_XHjB3TIMq3Lxinv-8Zfp8aCqWz6Mmuj` |
| `12-veille/` | `1rYSX7EoDtM2bXA_cmn2eQcdi6pLJYufM` |
| `templates/` | `1Mh2hRd5qn3kaZeMBv_9vBrIiP23pUyMm` |

## Date de creation : 2026-03-03
