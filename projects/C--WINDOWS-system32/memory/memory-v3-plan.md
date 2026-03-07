# Plan Memoire Collective v3 — Bio-inspiree (2026-03-07)

## Inspiration: Hindsight (vectorize-io)
3 operations bio-inspirees: Retain, Recall, Reflect
3 types de memoire: World Facts, Experiences, Mental Models
Adaptation: garder GitHub gratuit, utiliser Haiku du forfait Max

## Etat actuel v2 (notes sur 10)
- Retain: 3/10 (captures mecaniques, contenu pauvre)
- Recall: 7/10 (scoring contextuel, access tracking, transactive memory)
- Reflect: 2/10 (existe en config, jamais produit de resultat)
- Oubli: 7/10 (scoring par valeur + acces, bien calibre)
- Stockage: 9/10 (GitHub fiable, self-healing)

## Phase 1: Retain ameliore (FAIT - 2026-03-07)
- Hook modifie: collective-memory-retain.js
- Appel Haiku via `claude -p --model haiku` en fin de session
- Extraction structuree: Faits appris, Decisions, Erreurs resolues, Resume
- Anti-boucle: env var COLLECTIVE_MEMORY_RETAIN=1 + seuil 8 appels
- Fallback: si Haiku echoue, ancien format conserve
- Tag "enriched" dans les fichiers enrichis

## Phase 2: Fiches thematiques (FAIT - 2026-03-07)
- Dossier structured/facts/ — une fiche partagee par projet/sujet
- TOPIC_MAP: 6 sujets (GigRoute, WhatsApp Bridge, Claude Code Infra, Memoire collective, ATUM Audit, Scheduler)
- parseEnrichedSections() decoupe le contenu Haiku en faits/decisions/erreurs
- updateThematicFile() append avec attribution [date, user] — cree le fichier si inexistant
- Fallback: si Haiku echoue, utilise detectDecisions() pour les decisions basiques
- Deduplication reportee au Reflect hebdomadaire (Phase 4)
- 23 tests passes (parsing, creation, append, sections vides, separateur)

## Phase 3: INDEX.md auto-genere (FAIT - 2026-03-07)
- Fichier INDEX.md a la racine de collective-memory/, regenere a chaque session
- 5 sections: fiches thematiques (avec compteur entrees), memoires explicites, sessions recentes (10 dernieres), distillees, transactive memory
- Helpers: extractFirstHeading (#{1,3}), countEntries, extractLastUpdate, listMdFiles
- Gere les fichiers non-standard (migrated) gracieusement
- 20 tests passes

## Phase 4: Patterns / Mental Models (FAIT - 2026-03-07)
- Dossier patterns/ — un fichier par pattern avec confiance 1-5/5
- Matching par mots-cles: extractKeywords() + keywordOverlap() (seuil 0.4)
- Stop words FR+EN filtres, slug auto-genere a partir du texte
- findMatchingPattern() scanne les patterns existants
- Match → updatePatternConfidence() incremente confiance (max 5), ajoute confirmation
- Pas de match → createPattern() cree un nouveau pattern (confiance 1)
- Max 5 candidats par session (faits + erreurs)
- Section Patterns ajoutee a INDEX.md avec confiance
- 23 tests passes

## Phase 5: Recall contextuel ameliore (FAIT - 2026-03-07)
- Hook modifie: collective-memory-start.js
- TOPIC_SLUGS: mapping nom projet → slug fiche thematique (10 entrees, 6 sujets)
- detectTopicSlug(): match direct + partiel (includes bidirectionnel)
- loadThematicContext(): charge fiche projet, extrait max 8 entrees sans prefixe date
- loadHighConfidencePatterns(): scanne patterns/, filtre par confiance min, retourne top 5 tries
- Injection dans main(): etape 2 (contexte thematique) + etape 3 (patterns confiance >= 3)
- countThematicFiles() + countPatterns() pour le resume de sync
- 16 tests passes (slug direct/partiel/absent, contexte avec/sans fichier, seuils confiance)

## Bilan total: 5 phases, 98 tests passes
- Phase 1 (Retain): 7 tests — enrichissement Haiku
- Phase 2 (Fiches thematiques): 23 tests — parsing, creation, append
- Phase 3 (INDEX.md): 20 tests — generation, sections, edge cases
- Phase 4 (Patterns): 23 tests — keywords, matching, confiance
- Phase 5 (Recall): 16 tests — slug detection, chargement, filtrage
- Prochaines sessions: observer que le systeme fonctionne de bout en bout

## Priorites post-v3
1. Observer les resultats en conditions reelles (prochaines sessions)
2. Installer hooks chez Pablo et Wahid (install.sh)
3. Laisser tourner le Reflect hebdomadaire (dimanche 22h)
4. Ajuster seuils et TOPIC_SLUGS selon l'usage reel

## Contraintes non-negociables
- Memoire COLLECTIVE entre les 3 fondateurs ATUM
- Hebergement 100% gratuit sur GitHub
- 100% automatique, zero intervention humaine
- Forfait Claude Max, pas d'API payante
