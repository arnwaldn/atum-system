# Guide RGPD — ATUM SAS

## Principes fondamentaux (Art. 5 RGPD)

| Principe | Application ATUM |
|---|---|
| **Licite, loyal, transparent** | Base legale definie pour chaque traitement. Information claire des personnes |
| **Limitation des finalites** | Donnees utilisees uniquement pour la finalite declaree |
| **Minimisation** | Ne collecter que les donnees strictement necessaires |
| **Exactitude** | Mise a jour reguliere, droit de rectification |
| **Limitation de conservation** | Durees definies par traitement (voir registre) |
| **Integrite et confidentialite** | Chiffrement, controle d'acces, sauvegardes |
| **Responsabilite** | Documentation des mesures, registre des traitements |

---

## Bases legales (Art. 6 RGPD)

| Base legale | Usage ATUM |
|---|---|
| **Consentement (6.1.a)** | Newsletter, cookies non essentiels, Quick Summarize (contenu) |
| **Execution contractuelle (6.1.b)** | SaaS (TourFlow, TradingBrain), prestations client, RH |
| **Obligation legale (6.1.c)** | Comptabilite, declarations sociales, registre du personnel |
| **Interet legitime (6.1.f)** | Prospection B2B, securite des systemes, analytics |

---

## Roles ATUM selon le contexte

### Responsable de traitement
ATUM decide des finalites et moyens du traitement :
- Gestion prospects/clients
- RH (salaries, freelances)
- TradingBrain, Quick Summarize (propres produits B2C)
- Site web, newsletter

### Sous-traitant (Art. 28)
ATUM traite des donnees pour le compte d'un client :
- TourFlow (SaaS pour clients)
- Projets client agence (dev d'applications)

→ **DPA obligatoire** avec chaque client pour lequel ATUM est sous-traitant

---

## Durees de conservation

| Categorie | Duree | Base |
|---|---|---|
| Prospects | 3 ans apres dernier contact | CNIL |
| Clients (contrat) | Duree contrat + 5 ans | Prescription civile |
| Factures | 10 ans | Code de commerce |
| Bulletins de paie | Illimite | Code du travail |
| Contrats de travail | 5 ans apres fin contrat | Prescription |
| Donnees SaaS | Duree abonnement + 1 an | Contractuelle |
| Cookies | 13 mois maximum | CNIL/ePrivacy |
| Logs serveur | 12 mois | CNIL |
| CV non retenus | 2 ans maximum | CNIL |

---

## Obligations documentaires

### Registre des traitements (Art. 30)
- Fichier : `~/.claude/data/agence-atum/rgpd/registre-traitements.json`
- A mettre a jour a chaque nouveau traitement

### Analyse d'impact (AIPD / DPIA — Art. 35)
Obligatoire si traitement a risque eleve :
- Profilage systematique
- Traitement a grande echelle de donnees sensibles
- Surveillance systematique a grande echelle

→ Pour ATUM : probablement requis pour TradingBrain (profilage investisseurs) si le service evolue

### DPA — Data Processing Agreement (Art. 28)
Template minimal :
- Objet et duree du traitement
- Nature et finalite
- Types de donnees et categories de personnes
- Obligations du sous-traitant (confidentialite, securite, assistance)
- Sort des donnees en fin de contrat
- Droit d'audit du responsable

---

## Droits des personnes

### Procedure de reponse
1. Reception de la demande (email/courrier)
2. Verification de l'identite du demandeur
3. Analyse du droit exerce
4. Reponse sous **1 mois** (prolongeable 2 mois si complexe)
5. Gratuit (sauf demandes repetitives)

### Droits et exceptions

| Droit | Conditions |
|---|---|
| Acces (Art. 15) | Copie des donnees + informations sur le traitement |
| Rectification (Art. 16) | Correction des donnees inexactes |
| Effacement (Art. 17) | Si consentement retire, finalite atteinte, opposition. Exception : obligations legales |
| Limitation (Art. 18) | Suspension du traitement pendant verification |
| Portabilite (Art. 20) | Format structure (JSON/CSV). Uniquement base consentement ou contrat |
| Opposition (Art. 21) | Prospection : droit absolu. Interet legitime : balance des interets |

---

## Securite (Art. 32)

### Mesures techniques
- [ ] Chiffrement des donnees au repos (AES-256)
- [ ] Chiffrement en transit (TLS 1.2+)
- [ ] Authentification forte (MFA pour admin)
- [ ] Controle d'acces par role (RBAC)
- [ ] Journalisation des acces
- [ ] Sauvegardes chiffrees regulieres
- [ ] Tests de securite (pentest annuel)

### Mesures organisationnelles
- [ ] Politique de securite documentee
- [ ] Formation des collaborateurs
- [ ] Accords de confidentialite
- [ ] Procedure de gestion des incidents
- [ ] Revue periodique des acces

---

## Violation de donnees (Art. 33-34)

### Procedure
1. **Detection** : identifier la violation
2. **Evaluation** : gravite, nombre de personnes, type de donnees
3. **Notification CNIL** : sous **72 heures** si risque pour les personnes
4. **Notification personnes** : sans delai si risque eleve
5. **Documentation** : tout incident dans le registre des violations

### Contenu notification CNIL
- Nature de la violation
- Categories et nombre de personnes
- Categories et volume de donnees
- Consequences probables
- Mesures prises ou envisagees

---

## Transferts hors UE (Art. 44-49)

### Mecanismes autorises
1. Decision d'adequation (UK, Suisse, Canada, Japon, USA via DPF)
2. Clauses contractuelles types (CCT) de la Commission europeenne
3. Binding Corporate Rules (BCR)
4. Consentement explicite (cas exceptionnels)

### Application ATUM
- Quick Summarize → API LLM potentiellement US → CCT requises ou DPF si provider certifie
- Hebergement cloud → Privilegier fournisseurs EU (OVH, Scaleway) ou US avec DPF (AWS, GCP, Azure)

---

## Checklist conformite ATUM

- [ ] Registre des traitements a jour
- [ ] DPA signe avec chaque client SaaS
- [ ] Politique de confidentialite sur site web
- [ ] Bandeau cookies conforme (consentement avant depots)
- [ ] CGU SaaS incluant clauses RGPD
- [ ] Procedure exercice des droits documentee
- [ ] Procedure violation de donnees documentee
- [ ] Formation equipe RGPD
- [ ] Securite : chiffrement, acces, logs
- [ ] Revue annuelle du registre
