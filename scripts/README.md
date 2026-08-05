# Database (Drizzle migrate + seed)

Schema and seed are based on the production `backup.sql` dump (public schema only; `neon_auth` is skipped).

## Setup

1. Set `DATABASE_URL` in `.env.local` (or `.env`).
2. Generate seed SQL from a pg_dump backup (once):

```bash
pnpm db:prepare-seed -- /path/to/backup.sql
```

This writes `drizzle/data/seed.sql` (~6MB, gitignored).

3. Run migrate + seed:

```bash
pnpm db:migrate
pnpm db:seed
# or
pnpm db:setup
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate SQL migration from `db/schema.ts` |
| `pnpm db:migrate` | Apply migrations in `drizzle/` |
| `pnpm db:prepare-seed` | Extract/reorder INSERTs from a backup dump |
| `pnpm db:seed` | Truncate public tables and load `drizzle/data/seed.sql` |
| `pnpm db:setup` | `migrate` then `seed` |

Optional env:

- `SEED_SQL_PATH` — custom seed file path (default `./drizzle/data/seed.sql`)
- `BACKUP_SQL_PATH` — default input for `db:prepare-seed`

## Notes

- App runtime still uses `lib/db.ts` (`sql` tagged template). Drizzle is used for migrate/seed only.
- Prefer the Drizzle schema/migration over `scripts/001_init_schema.sql` (that file is outdated vs production).
