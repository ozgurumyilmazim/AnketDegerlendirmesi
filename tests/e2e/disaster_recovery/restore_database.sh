#!/bin/bash
# Disaster Recovery Script: Database Restoration
# This script assumes a backup exists in /mnt/backups/ and the DB is accessible via psql.

set -e

BACKUP_FILE="/mnt/backups/latest_db_dump.sql"
DB_NAME="anket_degerlendirmesi"

echo "Starting database restoration from $BACKUP_FILE..."

# Drop and recreate database (DANGEROUS in production!)
drop_db() {
    echo "Dropping existing database $DB_NAME..."
    psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
}

# Restore the database
restore_db() {
    echo "Restoring database $DB_NAME from backup..."
    createdb -U postgres $DB_NAME && psql -U postgres -d $DB_NAME < "$BACKUP_FILE"
}

# --- Execution ---
if [ -f "$BACKUP_FILE" ]; then
    # Safety check: Only run drop if not in a controlled environment
    # For this example, we assume we are running it in a controlled environment.
    drop_db
    restore_db
    echo "Database restoration complete."
else
    echo "Error: Backup file $BACKUP_FILE not found. Aborting."
fi