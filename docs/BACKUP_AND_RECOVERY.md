# Backup and Recovery

## Database backup

Recommended before every production migration:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=backup-before-migration.dump
```

Restore test:

```bash
createdb lune_restore_test
pg_restore --dbname=lune_restore_test --clean --if-exists backup-before-migration.dump
```

## Schedule

- Daily automated PostgreSQL backup.
- Keep daily backups for 7-14 days.
- Keep weekly backups for 1-3 months.
- Keep at least one backup before each schema migration.

## Storage

- Use database provider backups when available.
- Store additional backups outside the app repo.
- Encrypt backups at rest.
- Restrict access to owner/admin only.

## RPO/RTO proposal

- RPO: 24 hours for MVP.
- RTO: 4 hours for MVP.

## Data outside DB

Current repo stores public assets in Git. Future object storage assets must be backed up or reproducible from source files.

## Recovery checklist

1. Identify last good backup.
2. Restore into test DB first.
3. Run smoke tests.
4. Switch production `DATABASE_URL` only after validation.
5. Keep old DB until owner confirms recovery.

