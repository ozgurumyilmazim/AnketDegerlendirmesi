# PostgreSQL Migration Guide

## Prerequisites

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-client

# Start PostgreSQL
sudo systemctl start postgresql
```

## Step 1: Create Database

```bash
sudo -u postgres psql -c "CREATE DATABASE mmpi_db;"
sudo -u postgres psql -c "CREATE USER mmpi_user WITH PASSWORD 'mmpi_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mmpi_db TO mmpi_user;"
```

## Step 2: Run Schema + Data Migration

```bash
# Create tables, indexes, triggers
psql -U mmpi_user -d mmpi_db -f 01_schema.sql

# Import all reference data
psql -U mmpi_user -d mmpi_db -f 02_data.sql

# Generate bcrypt hashes and update admin password
psql -U mmpi_user -d mmpi_db -f 03_setup_admin.sql
```

## Step 3: Verify Installation

```bash
psql -U mmpi_user -d mmpi_db -c "\dt"
psql -U mmpi_user -d mmpi_db -c "SELECT COUNT(*) FROM questions;"
psql -U mmpi_user -d mmpi_db -c "SELECT COUNT(*) FROM scoring_keys;"
```

## Migration Order

| File | Description |
|------|-------------|
| `01_schema.sql` | Creates all tables, indexes, triggers, constraints |
| `02_data.sql` | Imports questions, scoring keys, T-score norms, interpretations, etc. |
| `03_setup_admin.sql` | Generates proper password hashes |

## Environment Variables (for backend)

```
DATABASE_URL=postgresql://mmpi_user:mmpi_password@localhost:5432/mmpi_db
JWT_SECRET=your-secret-key-change-in-production
```
