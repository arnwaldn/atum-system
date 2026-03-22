# Memoire Collective ATUM — Regles

## REGLE DE CONFIDENTIALITE (PRIMORDIALE — AVANT TOUTE ECRITURE)

La memoire collective est un depot **partage entre les 3 cofondateurs** (les 3 cofondateurs).
Chaque fichier ecrit dans `~/.claude/collective-memory/` est **visible par tous**.
Cette regle de tri est **OBLIGATOIRE** et s'applique a **TOUS les cofondateurs** sans exception.

### Test systematique AVANT chaque ecriture

Avant d'ecrire quoi que ce soit dans la memoire collective, se poser cette question :

> "Cette information concerne-t-elle ATUM SAS en tant qu'entreprise,
> ou bien la vie personnelle/individuelle d'un cofondateur ?"

- **ATUM SAS → ecrire** dans la memoire collective
- **Personnel → NE PAS ecrire** (garder en memoire locale uniquement)

### PROFESSIONNEL (memoire collective)

| Categorie | Exemples concrets |
|-----------|-------------------|
| Projets ATUM | GigRoute (statut, stack, decisions), produits en cours |
| Clients & prospects | Echeances, feedback, demandes, livraisons |
| Infrastructure partagee | Google Drive ATUM, MCP servers communs |
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

### Cas ambigus — regle de decision

| Situation | Verdict | Raison |
|-----------|---------|--------|
| Formation payee par ATUM pour un projet ATUM | PROFESSIONNEL | Investissement agence |
| Formation perso meme si les competences servent a ATUM | PERSONNEL | Initiative individuelle |
| Config machine commune (hooks, scripts partages) | PROFESSIONNEL | Infrastructure equipe |
| Config machine specifique (plugins IDE perso) | PERSONNEL | Preference individuelle |
| Apprentissage d'une erreur sur un projet ATUM | PROFESSIONNEL | Beneficie a l'equipe |
| Apprentissage d'une erreur sur un projet perso | PERSONNEL | Ne concerne pas ATUM |

## Quand sauvegarder (triggers obligatoires)

Ecrire IMMEDIATEMENT dans la memoire collective quand :
- **Decision prise** : choix de stack, pivot produit, changement d'architecture sur un projet ATUM
- **Info client** : echeance, feedback, nouvelle demande, livraison
- **Commit important** : deploy en production, merge de feature majeure, fix critique
- **Info business** : nouveau contrat, tarif, partenariat, obligation legale
- **Rappel systeme** : quand le message `[MEMOIRE COLLECTIVE]` apparait, verifier et sauvegarder

Ne PAS attendre la fin de session. Sauvegarder au moment ou l'information est produite.
Le PM2 sync poussera le fichier sur GitHub dans les 30 secondes.

## Quoi sauvegarder (agence uniquement)

Quand tu identifies un de ces elements, ecris-le dans `~/.claude/collective-memory/explicit/{ATUM_USER}/` :
- **Decisions** techniques ou strategiques de l'agence
- **Informations client** (echeances, feedback, demandes, livraisons)
- **Conventions** et patterns etablis pour les projets ATUM
- **Erreurs resolues** sur des projets ATUM (pour ne pas les repeter)
- **Changements d'architecture** ou de stack sur les projets ATUM
- **Informations business** (tarifs, contrats, pipeline, partenariats)

## Format du fichier

- Chemin : `~/.claude/collective-memory/explicit/{ATUM_USER}/{YYYY-MM-DD}-{sujet-en-kebab-case}.md`
- Contenu :
```
[CATEGORIE] YYYY-MM-DD — Par {ATUM_USER}

{Contenu structure de la memoire}

Tags: explicit, {categorie}, {ATUM_USER}
```

Categories : `decision`, `client`, `business`, `strategie`, `technique`, `equipe`, `infra`, `projet`

## Quand NE PAS sauvegarder

- Informations personnelles d'un cofondateur (regle ci-dessus)
- Details de debugging temporaires sans valeur durable
- Connaissances generiques de programmation (documentation publique)
- Information deja dans MEMORY.md ou CLAUDE.md
- Contenu trivial (formatage, typos, refactoring mineur)

## Acces a la memoire

Les fichiers sont dans `~/.claude/collective-memory/`. Lisibles avec Read, Grep, Glob.
