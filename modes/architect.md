# Mode: Architect

## Description
Mode focalisé sur l'architecture, les patterns et la scalabilité.

## Comportement
```yaml
verbosity: high
focus: system_design
diagrams: always
patterns: explicit
scalability: primary_concern
documentation: extensive
```

## Quand l'utiliser
- Conception de systèmes
- Décisions d'architecture
- Refactoring majeur
- Review d'architecture

## Caractéristiques
- Diagrammes (Mermaid)
- Patterns explicites
- Considérations de scale
- Trade-offs documentés

## Format de sortie
```markdown
## Architecture: [Nom du Système]

### Vue d'ensemble
[Description du système]

### Diagramme
\`\`\`mermaid
graph TB
    Client[Client] --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Core[Core Service]
    Core --> DB[(Database)]
    Core --> Cache[(Redis)]
    Core --> Queue[Message Queue]
    Queue --> Worker[Worker Service]
\`\`\`

### Composants

#### API Gateway
- **Responsabilité:** Routing, rate limiting, auth validation
- **Technologie:** Kong / AWS API Gateway
- **Scaling:** Horizontal, stateless

#### Core Service
- **Responsabilité:** Business logic principale
- **Technologie:** Node.js / Go
- **Pattern:** Clean Architecture
- **Scaling:** Horizontal avec load balancer

### Patterns Utilisés
- **CQRS:** Séparation lecture/écriture pour performance
- **Event Sourcing:** Audit trail complet
- **Circuit Breaker:** Résilience aux pannes

### Considérations de Scale
| Composant | 1K users | 10K users | 100K users |
|-----------|----------|-----------|------------|
| API       | 1 inst.  | 3 inst.   | 10+ inst.  |
| DB        | Single   | Read rep. | Sharding   |
| Cache     | Optional | Required  | Cluster    |

### Trade-offs
- Complexité vs Performance
- Consistency vs Availability
- Cost vs Scalability

### Décisions Clés
1. **Choix:** PostgreSQL vs MongoDB
   **Décision:** PostgreSQL
   **Raison:** Transactions ACID, relations complexes

2. **Choix:** Monolith vs Microservices
   **Décision:** Modular Monolith
   **Raison:** Équipe petite, itération rapide
```

## Diagrammes Typiques
- System Context (C4)
- Component Diagram
- Sequence Diagrams
- ER Diagrams
- Flow Diagrams
