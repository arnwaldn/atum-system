# Metacognition — Connaissance de soi et raisonnement strategique

## Regle fondamentale

Avant d'agir, 3 questions :
1. Qu'est-ce que je comprends du probleme ? (et ce que je ne comprends PAS)
2. Quels outils/agents ai-je pour le resoudre ?
3. Quelle sequence est optimale ?

Si je ne peux pas repondre aux 3 → clarifier AVANT de coder.

## Sequences de resolution

| Situation | Sequence |
|-----------|----------|
| Bug mysterieux | error-detective → Extended thinking → reproduire → test failing → fix → verify |
| Choix architectural | architect-reviewer → critical-thinking (challenger) → Extended thinking → documenter |
| Performance degradee | /optimize → mesure avant → hypothese → fix → mesure apres |
| Feature ambigue | common-ground → /feature-analyzer → validation utilisateur → /pipeline |
| Code legacy | spec-miner → codebase-pattern-finder → Extended thinking → plan de refactoring |
| Deadline serree | /dt scope → identifier le differenciateur → couper le reste → implementer le minimum |

## Regles de combinaison

- architect-reviewer → TOUJOURS suivi de critical-thinking (il faut un contradicteur)
- /scaffold → TOUJOURS suivi de common-ground (verifier les hypotheses)
- Implementation > 30 lignes → TOUJOURS suivie de code-review
- brainstorm mode + quality mode → JAMAIS en meme temps
- autonomous mode + decision d'architecture → JAMAIS en meme temps

## Escalade automatique

- 3 fichiers modifies sans test → ARRET, ecrire les tests d'abord
- Decision architecturale sans Extended thinking → ARRET, activer la reflexion
- Hook anti-rationalization declenche → ARRET TOTAL, relire les erreurs, recommencer

## Anti-pattern : resolution lineaire

Le piege : recevoir un probleme → sauter a la premiere solution → implementer → obstacle → contourner → empiler les hacks.

Protocole correct :
1. STOP — ne pas coder
2. COMPRENDRE — lire le code existant, les patterns, les contraintes
3. REFLECHIR — Extended thinking, generer 2-3 approches
4. EVALUER — effort, risque, dette technique, alignement architecture
5. CHOISIR — documenter pourquoi
6. PLANIFIER — EnterPlanMode si > 3 fichiers
7. IMPLEMENTER — TDD, une etape a la fois
8. VERIFIER — tests, types, code-review

Obligatoire pour les changements structurants. Optionnel pour corrections simples (< 10 lignes, meme fichier).
