---
name: project-patterns
description: Common project patterns including skeleton projects, B12 website generation, template index, repository pattern, and API response format.
user-invocable: false
---

# Common Patterns

## Skeleton Projects

When implementing new functionality:
1. **Quick business website?** -> Use **B12 MCP** (`generate_website` tool) or `/website` command
2. Search `~/Projects/tools/project-templates/INDEX.md` for matching templates (166 scaffolds + 9 reference files)
3. If the project uses rust/java/dart/cpp/php/ruby, check `~/Projects/tools/project-templates/rules/<lang>/` for language-specific rules
4. Use parallel agents to evaluate options
5. Clone best match as foundation
6. Iterate within proven structure

## Design Patterns

### Repository Pattern

Encapsulate data access behind a consistent interface:
- Define standard operations: findAll, findById, create, update, delete
- Concrete implementations handle storage details
- Business logic depends on the abstract interface
- Enables easy swapping of data sources and simplifies testing

### API Response Format

Use a consistent envelope for all API responses:
- Include a success/status indicator
- Include the data payload (nullable on error)
- Include an error message field (nullable on success)
- Include metadata for paginated responses (total, page, limit)
