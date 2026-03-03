# Regles de Facturation — ATUM SAS

## Cadre legal

### Art. 289 CGI — Mentions obligatoires sur facture
1. Date d'emission
2. Numero de facture (sequentiel, sans trou)
3. Identite vendeur : denomination, forme juridique, capital, siege, RCS, SIRET
4. TVA intracommunautaire vendeur
5. Identite acheteur : denomination, adresse, SIRET (si B2B France)
6. TVA intracommunautaire acheteur (si applicable)
7. Date de livraison ou d'execution de la prestation
8. Description detaillee des prestations
9. Quantite, prix unitaire HT, montant total HT
10. Taux de TVA applicable (20% standard services)
11. Montant TVA
12. Montant TTC
13. Date d'echeance de paiement
14. Conditions d'escompte
15. Taux de penalites de retard
16. Indemnite forfaitaire de recouvrement (40 EUR)

### Sanctions
- Amende de 15 EUR par mention manquante ou inexacte (plafond 1/4 du montant facture)
- Amende de 75 000 EUR si non-emission de facture

---

## Numerotation

### Regles
- **Sequentielle** : chaque numero suit le precedent sans saut
- **Chronologique** : un numero ulterieur ne peut avoir une date anterieure
- **Sans trou** : aucun numero manquant dans la serie
- **Non-modifiable** : un numero emis ne peut etre modifie ou reutilise
- **Annuelle** : reinitialisation possible au 1er janvier

### Format ATUM SAS
| Type | Prefixe | Format | Exemple |
|---|---|---|---|
| Devis | D | D-{annee}-{NNN} | D-2026-001 |
| Facture | F | F-{annee}-{NNN} | F-2026-001 |
| Avoir | AV | AV-{annee}-{NNN} | AV-2026-001 |
| Acompte | AC | AC-{annee}-{NNN} | AC-2026-001 |

### Compteurs
Fichier : `~/.claude/data/agence-atum/facturation/compteurs.json`
- A chaque emission, incrementer `dernier_numero` et sauvegarder AVANT generation
- Si `annee_courante` != annee en cours → reinitialiser `dernier_numero` a 0 et MAJ `annee_courante`
- JAMAIS supprimer ou sauter un numero

---

## TVA

### Taux applicable
| Prestation | Taux |
|---|---|
| Developpement logiciel | 20% |
| Conseil / formation | 20% |
| Hebergement cloud (refacture) | 20% |
| Export UE (avec TVA intracom acheteur) | 0% (autoliquidation) |
| Export hors UE | 0% (exonere) |

### Calculs
```
montant_ht = prix_unitaire * quantite (par ligne)
total_ht = somme(montants_ht_lignes)
montant_tva = total_ht * taux_tva (0.20 standard)
total_ttc = total_ht + montant_tva
```

### Si remise
```
remise_ht = montant_remise
total_ht_apres_remise = total_ht - remise_ht
montant_tva = total_ht_apres_remise * taux_tva
total_ttc = total_ht_apres_remise + montant_tva
```

### Si acompte
```
net_a_payer = total_ttc - montant_acompte_ttc
```
L'acompte doit faire reference a sa propre facture d'acompte (AC-YYYY-NNN).

---

## Delais de paiement (B2B)

### Cadre legal (Art. L441-10 Code de commerce)
| Option | Delai max |
|---|---|
| Date de facture | 60 jours |
| Fin de mois | 45 jours fin de mois |
| Defaut (sans accord) | 30 jours |

### Convention ATUM (par defaut — BP V2, mars 2026)

#### Prestations de services (agence, audit, formation)
- **Devis < 1 000 EUR** : 100% a la commande (paiement integral avant demarrage)
- **Devis 1 000 - 5 000 EUR** : 50% a la commande + 50% a la livraison
- **Devis > 5 000 EUR** : echeancier proportionnel, premiere tranche preponderante (40-50% a la commande, jalons intermediaires, solde a livraison)
- **Regie (TJM)** : facturation mensuelle, 30 jours date de facture

#### SaaS (GigRoute, TradingBrain, Quick Summarize, OWL, etc.)
- **Zero freemium** : pas d'offre gratuite permanente
- **Essai gratuit** : 14 jours (standard) a 30 jours max (sur demande)
- **Paiement** : mensuel ou annuel (remise -15% sur annuel)
- **Renouvellement** : tacite reconduction, resiliation a tout moment

---

## Penalites de retard

### Taux
```
taux_penalite = 3 * taux_interet_legal_semestriel
```
Le taux d'interet legal est publie par la Banque de France (actuellement ~4.22% annuel pour B2B, soit ~12.66% pour 3x).

### Calcul penalites
```
jours_retard = date_actuelle - date_echeance
penalites = montant_ttc * (taux_penalite / 365) * jours_retard
```

### Indemnite forfaitaire de recouvrement
- **40 EUR** par facture impayee (Art. D441-5 Code de commerce)
- Due de plein droit des le 1er jour de retard
- Sans mise en demeure prealable necessaire

---

## Cycle de relance

| Etape | Delai | Action |
|---|---|---|
| 1. Relance amiable | J+7 apres echeance | Email de rappel courtois |
| 2. Relance ferme | J+15 apres echeance | Courrier formel avec rappel penalites |
| 3. Mise en demeure | J+30 apres echeance | LRAR avec decompte penalites + indemnite |
| 4. Recouvrement | J+45 apres echeance | Transfert a conseil juridique ou huissier |

### Templates
- `templates/relance.md` : 3 niveaux (amiable, ferme, mise en demeure)

---

## Devis / Propositions commerciales

### Contenu obligatoire
1. Identite prestataire
2. Identite client
3. Date et duree de validite
4. Description detaillee des prestations
5. Prix unitaires et totaux
6. TVA
7. Conditions de paiement
8. Conditions de revision de prix
9. Reference aux CGV

### Statuts devis
| Statut | Description |
|---|---|
| brouillon | En cours de redaction |
| envoye | Transmis au client |
| accepte | Signe "bon pour accord" |
| refuse | Decline par le client |
| expire | Delai de validite depasse |

### Apres acceptation
1. Generer facture d'acompte si applicable (AC-YYYY-NNN)
2. Creer fiche projet dans pipeline
3. Mettre a jour compteurs

---

## Avoir (note de credit)

### Quand emettre
- Erreur sur facture (montant, designation)
- Retour/annulation partielle de prestation
- Geste commercial

### Regles
- Reference a la facture d'origine obligatoire
- Montants en negatif
- Memes mentions obligatoires qu'une facture
- Numerotation propre (AV-YYYY-NNN)

---

## Facturation en regie (TJM)

### Principe
```
montant_ht = tjm * jours_travailles
```

### Source donnees
- Timetracking mensuel : `~/.claude/data/agence-atum/timetracking/YYYY-MM.json`
- TJM contractuel : dans le contrat client ou devis

### Cycle
1. Fin de mois : consolider heures/jours du timetracking
2. Verifier concordance avec planning prevu
3. Generer facture avec detail jours par profil
4. Envoyer au client

---

## Coordonnees bancaires ATUM

Toujours mentionner sur devis et factures :
- Banque : Qonto
- IBAN/BIC : voir `societe.json`
- Reference : numero de facture

---

## Workflow facturation dans le systeme

### Generer un devis
1. Lire `compteurs.json` → incrementer `devis.dernier_numero`
2. Sauvegarder compteurs
3. Remplir template `devis.md` avec donnees client et prestations
4. Sauvegarder dans `facturation/devis/devis-YYYY-NNN.json`

### Generer une facture
1. Lire `compteurs.json` → incrementer `factures.dernier_numero`
2. Sauvegarder compteurs
3. Remplir template `facture.md` avec donnees (depuis devis si ref)
4. Sauvegarder dans `facturation/factures/facture-YYYY-NNN.json`
5. Mettre a jour la balance client si applicable

### Generer une relance
1. Identifier factures impayees (echeance depassee)
2. Determiner niveau de relance (amiable/ferme/mise en demeure)
3. Calculer penalites si applicable
4. Remplir template `relance.md`
5. Proposer envoi via Gmail MCP
