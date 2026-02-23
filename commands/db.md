# Database Management

Unified database management command supporting migrations, schema operations, and type generation.

## Arguments

$ARGUMENTS — The database operation to perform (e.g., "migrate", "schema", "types", "backup", "seed")

## Instructions

### Detect Database Stack

1. Check the project for database technology:
   - `prisma/schema.prisma` → Prisma
   - `drizzle.config.ts` → Drizzle
   - `supabase/` directory → Supabase
   - `alembic/` or `alembic.ini` → SQLAlchemy/Alembic
   - `db/migrate/` → Rails ActiveRecord
   - `src/main/resources/db/migration/` → Flyway
   - `migrations/` + Django → Django migrations

2. Based on detection, route to appropriate commands:

### Operations

#### `migrate` — Create and run migrations
- Generate migration from schema changes
- Run pending migrations
- Show migration status
- Rollback last migration if requested

#### `schema` — Schema operations
- Visualize current schema (tables, relationships)
- Compare schema vs code models
- Generate ERD diagram (Mermaid format)
- Detect schema drift

#### `types` — Type generation
- Generate TypeScript types from database schema
- Generate Zod validators from schema
- Supabase: `supabase gen types typescript`
- Prisma: `prisma generate`
- Drizzle: built-in type inference

#### `backup` — Backup operations
- Create SQL dump of database
- Export specific tables
- List existing backups

#### `seed` — Seed data
- Run seed scripts
- Generate realistic fake data
- Reset database with fresh seeds

### Output
Always show:
- Command executed and output
- Current migration status after operation
- Any warnings or errors from the operation
