---
name: design-doc-mermaid
description: Create Mermaid diagrams (activity, deployment, sequence, architecture) from text descriptions or source code. Use when asked to "create a diagram", "generate mermaid", "document architecture", "code to diagram", "create design doc", or "convert code to diagram". Supports hierarchical on-demand guide loading, Unicode semantic symbols, and high-contrast styling.
version: "2.0"
---

# Mermaid Architect - Hierarchical Diagram and Documentation Skill

Mermaid diagram and documentation system with specialized guides and code-to-diagram capabilities.

## Decision Tree

1. **User makes a request** -> Skill analyzes intent
2. **Skill determines diagram/document type** -> Loads appropriate guide(s)
3. **AI reads specialized guide** -> Generates diagram/document using templates
4. **Result delivered** -> With validation and export options

## Diagram Type Selection

| User Intent | Diagram Type | Guide |
|------------|-------------|-------|
| workflow, process, business logic | Activity Diagram | `references/guides/diagrams/activity-diagrams.md` |
| infrastructure, deployment, cloud | Deployment Diagram | `references/guides/diagrams/deployment-diagrams.md` |
| system architecture, components | Architecture Diagram | `references/guides/diagrams/architecture-diagrams.md` |
| API flow, interactions | Sequence Diagram | `references/guides/diagrams/sequence-diagrams.md` |
| code to diagram | Code-to-Diagram | `references/guides/code-to-diagram/` + `examples/` |
| design document, full docs | Design Document | `assets/*-design-template.md` |
| unicode symbols, icons | Unicode Symbols | `references/guides/unicode-symbols/guide.md` |

## Design Document Templates

| Template | Use For |
|----------|---------|
| Architecture Design | `assets/architecture-design-template.md` - System-wide architecture |
| API Design | `assets/api-design-template.md` - API specifications |
| Feature Design | `assets/feature-design-template.md` - Feature planning |
| Database Design | `assets/database-design-template.md` - Database schema |
| System Design | `assets/system-design-template.md` - Complete system |

## Unicode Semantic Symbols

Always use Unicode symbols to enhance diagram clarity:

- Infrastructure: cloud, globe, plug, antenna, server
- Compute: gear, lightning, cycle, rocket
- Data: disk, package, chart, cube
- Messaging: envelope, mailbox, inbox, outbox
- Security: lock, key, shield, door, person, ticket
- Monitoring: memo, chart, alert, warning, check, cross

## High-Contrast Styling (MANDATORY)

ALL diagrams MUST use high-contrast colors with explicit text color:

```mermaid
classDef primary fill:#90EE90,stroke:#333,stroke-width:2px,color:darkgreen
classDef secondary fill:#87CEEB,stroke:#333,stroke-width:2px,color:darkblue
classDef database fill:#E6E6FA,stroke:#333,stroke-width:2px,color:darkblue
classDef error fill:#FFB6C1,stroke:#DC143C,stroke-width:2px,color:black
classDef decision fill:#FFD700,stroke:#333,stroke-width:2px,color:black
```

Rules:
- Light background -> Dark text color
- Dark background -> Light text color
- Always specify `color:` in every `classDef`

## Resilient Workflow

**CRITICAL:** Never add a diagram to markdown until it passes validation.

1. Identify diagram type from user request
2. Load appropriate reference guide
3. Generate Mermaid code using templates + Unicode symbols
4. Save to `./diagrams/<markdown_file>_<num>_<type>_<title>.mmd`
5. Validate: `mmdc -i file.mmd -o file.png -b transparent`
6. On error: check troubleshooting guide, fix syntax, retry
7. On success: add image reference to markdown

### File Naming Convention

```
./diagrams/<markdown_file>_<num>_<type>_<title>.mmd
./diagrams/<markdown_file>_<num>_<type>_<title>.png
```

Example: `./diagrams/api_design_01_sequence_auth_flow.png`

## Code-to-Diagram Patterns

Supported framework examples:
- **Spring Boot**: Controller -> Service -> Repository architecture
- **FastAPI**: Python async patterns, Pydantic models, dependency injection
- **React**: Component hierarchy, state management, data flow
- **Python ETL**: Data pipeline, transformation steps, scheduling
- **Node/Express**: Middleware chain, route handlers, deployment
- **Java Web App**: Traditional MVC, servlet containers

## Best Practices

1. **Single Responsibility**: One diagram = One concept
2. **Unicode Enhancement**: Always use semantic symbols for clarity
3. **High Contrast**: Never skip the `color:` property in styles
4. **Validate Early**: Catch syntax errors before adding to docs
5. **Template Reuse**: Leverage existing templates and examples
6. **Load On-Demand**: Only read guides needed for the specific request
7. **Token Efficiency**: Use hierarchical loading instead of reading everything
