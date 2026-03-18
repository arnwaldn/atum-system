---

name: memoire
description: Stocker ou rechercher une information dans la memoire collective ATUM. Utiliser quand un cofondateur veut sauvegarder ou retrouver une decision, info client, ou convention.
---

# /memoire — Memoire partagee ATUM

Stocker une information dans la memoire collective de l'equipe ATUM. Tous les collaborateurs (Arnaud, Pablo, Wahid) y ont acces via le depot partage.

## Declencheurs

- `/memoire <texte>` ou `/remember <texte>`
- "souviens-toi que...", "retiens que...", "note pour l'equipe..."
- "remember that...", "save this for the team..."
- Quand le message `[MEMOIRE COLLECTIVE]` apparait

## REGLE DE CONFIDENTIALITE (PRIMORDIALE — AVANT TOUTE ECRITURE)

La memoire collective est un depot **partage entre les 3 cofondateurs** (Arnaud, Pablo, Wahid).
Chaque fichier ecrit dans `~/.claude/collective-memory/` est **visible par tous**.

### Test systematique AVANT chaque ecriture

> "Cette information concerne-t-elle ATUM SAS en tant qu'entreprise,
> ou bien la vie personnelle/individuelle d'un cofondateur ?"

- **ATUM SAS -> ecrire** dans la memoire collective
- **Personnel -> NE PAS ecrire** (garder en memoire locale uniquement)

### PROFESSIONNEL (memoire collective)

| Categorie | Exemples concrets |
|-----------|-------------------|
| Projets ATUM | GigRoute (statut, stack, decisions), produits en cours |
| Clients & prospects | Echeances, feedback, demandes, livraisons |
| Infrastructure partagee | Google Drive ATUM, WhatsApp Cloclo, MCP servers communs |
| Business | Tarifs, devis, factures, contrats, pipeline commercial |
| Gouvernance | PV d'AG, decisions actionnariat, obligations legales |
| Conventions techniques | Patterns de code communs, choix de stack pour les projets ATUM |

### PERSONNEL (memoire locale UNIQUEMENT — JAMAIS dans la collective)

| Categorie | Exemples concrets |
|-----------|-------------------|
| Formations individuelles | Maestro, cours en ligne, certifications perso |
| Projets personnels | Side projects hors ATUM, trading, hobbies |
| Vie privee | Adresse, sante, famille, finances personnelles |
| Preferences individuelles | Config IDE, habitudes de travail, style de code perso |
| Donnees sensibles | Mots de passe perso, comptes bancaires, donnees medicales |

## Instructions

Quand l'utilisateur invoque cette skill avec un texte a memoriser :

### 1. Analyser et categoriser

Detecte la categorie parmi :
- `decision` — choix technique ou strategique
- `client` — info client (echeance, feedback, demande)
- `business` — tarifs, facturation, pipeline, contrats
- `strategie` — orientation long terme, positionnement
- `technique` — solution technique, pattern, convention, bug connu
- `equipe` — organisation, roles, disponibilites, process
- `infra` — infrastructure partagee, outils, MCP
- `projet` — statut projet, livraison, deploy

### 2. Ecrire le fichier

Utilise le Write tool pour creer un fichier markdown dans `~/.claude/collective-memory/explicit/{ATUM_USER}/` :

- Nom : `{YYYY-MM-DD}-{sujet-en-kebab-case}.md`
- Contenu :

```
[CATEGORIE] YYYY-MM-DD — Par {ATUM_USER}

{TEXTE_MEMORISE — nettoye et structure}

Tags: explicit, {CATEGORIE}, {ATUM_USER}
```

Variables :
- `ATUM_USER` : variable d'environnement (`arnaud`, `pablo`, ou `wahid`)
- `CATEGORIE` : categorie detectee a l'etape 1
- `YYYY-MM-DD` : date du jour

### 3. Confirmer

Reponds avec ce format :

```
Memorise pour l'equipe ATUM :
- Categorie : [categorie en francais]
- Contenu : [resume en 1 ligne]
- Auteur : [ATUM_USER]
- Fichier : [chemin du fichier cree]
- Sync : sera pousse vers GitHub au prochain sync (~30s) ou en fin de session
```

### 4. Rechercher (optionnel)

Si l'utilisateur dit `/memoire recherche <terme>` ou `/memoire search <terme>` :

Utilise Grep pour chercher dans `~/.claude/collective-memory/` :
```
Grep pattern="<terme>" path="~/.claude/collective-memory/" glob="*.md"
```

Affiche les resultats pertinents en format lisible.

## Quand sauvegarder automatiquement

Ecrire IMMEDIATEMENT dans la memoire collective quand :
- **Decision prise** : choix de stack, pivot produit, changement d'architecture
- **Info client** : echeance, feedback, nouvelle demande, livraison
- **Commit important** : deploy en production, merge de feature majeure, fix critique
- **Info business** : nouveau contrat, tarif, partenariat, obligation legale

## Quand NE PAS sauvegarder

- Informations personnelles d'un cofondateur
- Details de debugging temporaires sans valeur durable
- Connaissances generiques de programmation (documentation publique)
- Information deja dans MEMORY.md ou CLAUDE.md
- Contenu trivial (formatage, typos, refactoring mineur)
