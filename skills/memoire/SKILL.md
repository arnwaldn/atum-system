# /memoire — Memoire partagee ATUM

Stocker une information dans la memoire collective de l'equipe ATUM. Tous les collaborateurs (Arnaud, Pablo, Wahid) y ont acces via le depot partage.

## Declencheurs

- `/memoire <texte>` ou `/remember <texte>`
- "souviens-toi que...", "retiens que...", "note pour l'equipe..."
- "remember that...", "save this for the team..."

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

### 2. Ecrire le fichier

Utilise le Write tool pour creer un fichier markdown dans `~/.claude/collective-memory/explicit/{ATUM_USER}/` :

- Nom : `{YYYY-MM-DD}-{sujet-en-kebab-case}.md`
- Contenu :

```
[CATEGORIE] YYYY-MM-DD — Par {ATUM_USER}

{TEXTE_MEMORISE — nettoyé et structuré}

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
