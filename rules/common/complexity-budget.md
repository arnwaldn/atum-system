# Complexity Budget — Anti-Sur-Ingenierie

## Regle

Toute complexite technique doit etre justifiee par un besoin **mesure**, pas par une anticipation hypothetique.

## Matrice de decision

| Contexte projet | Architecture autorisee | Interdit sauf justification |
|----------------|----------------------|----------------------------|
| MVP / prototype / POC | Monolithe, SQLite/Supabase, deploy simple (Vercel/Render) | Microservices, Kubernetes, message queues |
| Produit < 100 utilisateurs | Monolithe, PostgreSQL, deploy simple | Multi-service, Redis cache, CDN custom |
| Produit 100-10K utilisateurs | Services separes si necessaire, PostgreSQL, cache si mesure lent | Kubernetes, event sourcing, CQRS |
| Scale-up confirme (>10K) | Architecture adaptee aux contraintes mesurees | Rien d'interdit si justifie par des metriques |

## Obligation de justification

Avant de proposer une architecture complexe, Claude DOIT :
1. **Nommer le besoin** : "Parce que [contrainte mesuree]" — pas "parce que ca scale mieux"
2. **Chiffrer** : nombre d'utilisateurs vises, volume de donnees, requetes/seconde
3. **Comparer** : montrer que la solution simple NE PEUT PAS repondre au besoin

"Parce que c'est la best practice" n'est PAS une justification valide.
"Parce qu'on aura besoin plus tard" n'est PAS une justification valide.

## Quick test

Si le projet n'a pas encore de vrais utilisateurs → solution la plus simple. Toujours.
