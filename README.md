# BACKINGHUM (A DB Backup CLI)

A Node.js command-line tool to create, list, restore, and delete database backups for:

- MongoDB
- MySQL
- PostgreSQL (local/remote and Docker mode)

The CLI is interactive and stores backup metadata in a local JSON registry under your home directory.

---

## Features Implemented

- Unified CLI interface for backup lifecycle operations.
- Interactive prompts for database-specific connection details.
- Adapter architecture (`BaseAdapter` + per-database adapters) for extensibility.
- Backup creation for:
  - MongoDB (`mongodump`)
  - MySQL (`mysqldump`)
  - PostgreSQL (`pg_dump`)
  - PostgreSQL in Docker (`docker exec ... pg_dump`)
- Optional backup compression during backup create:
  - MySQL/PostgreSQL: `.sql.gz`
  - MongoDB: `.tar.gz` archive of dump folder
- Backup listing from registry.
- Backup restore by backup ID:
  - MongoDB (`mongorestore`)
  - MySQL (`mysql`)
  - PostgreSQL (`psql`)
- Backup deletion by backup ID (file/folder + registry entry).
- Registry persistence in `$HOME/.db_backup/backupRegistry.json` (or `DB_BACKUP_REGISTRY_PATH` override).
- Connection snapshot saved with each backup entry to support future restore runs.

---

## Project Structure

- `bin/cli.js` – CLI entrypoint and command wiring.
- `src/commands/backup/` – command handlers:
  - `create.js`
  - `list.js`
  - `restore.js`
  - `delete.js`
- `src/adapters/` – DB adapters:
  - `baseAdapter.js`
  - `adaptorFactory.js`
  - `mongoAdapter.js`
  - `mysqlAdaptor.js`
  - `postgresAdapter.js`
- `src/prompts/` – interactive prompt flows per database.
- `src/registry/registry.js` – registry read/write helpers.
- Runtime registry path: `$HOME/.db_backup/backupRegistry.json`.
- `src/utils/` – option normalization + utility helpers.

---

## Prerequisites

Install Node.js (recommended LTS), then install the database client tools used by the adapters.

### Required CLI tools by database

- **MongoDB**
  - `mongosh`
  - `mongodump`
  - `mongorestore`
  - `tar` (for compression)
- **MySQL**
  - `mysql`
  - `mysqldump`
  - `gzip` / `gunzip`
- **PostgreSQL**
  - `psql`
  - `pg_dump`
  - `gzip` / `gunzip`
- **PostgreSQL Docker mode**
  - `docker`
  - Container must have PostgreSQL client tools available

---

## Installation

From the project root:

1. Install dependencies:
   - `npm install`
2. Link the CLI globally for local development:
   - `npm link`

After linking, the executable comes from the package `bin` config (`db_backup`).

---

## CLI Walkthrough

The CLI defines these commands:

- `backup:create`
- `backup:list`
- `backup:restore <id>`
- `backup:delete <id>`

Main options currently wired on `backup:create`:

- `-c, --compress` → enable compression
- `-v, --verbose` → verbose logs

### 1) Create a backup

Run:

- `db_backup backup:create`
- Optional flags:
  - `db_backup backup:create --compress`
  - `db_backup backup:create --verbose`
  - `db_backup backup:create --compress --verbose`

Flow:

1. CLI starts backup flow.
2. Prompts for database type (`mongodb`, `mysql`, `postgres`).
3. Runs database-specific prompt flow.
4. Builds adapter from `adaptorFactory`.
5. Tests database connection.
6. Executes backup.
7. Saves backup metadata in registry JSON.

#### MongoDB prompt flow

- Connection type:
  - Local
  - MongoDB Atlas (URI)

If Atlas:
- URI
- Database name
- Output directory (default `./backups`)

If Local:
- Auth required? (yes/no)
- Host (default `127.0.0.1`)
- Port (default `27017`)
- Optional user/password depending on auth
- Database name
- Output directory (default `./backups`)

Mongo backup output:

- Uncompressed: folder (`<database>-<timestamp>`)
- Compressed: `.tar.gz` archive of that folder

#### MySQL prompt flow

- Connection type: Local or Remote
- Host (default `127.0.0.1`)
- Port (default `3306`)
- User
- Password
- Database name
- Output directory (default `./backups`)

MySQL backup output:

- Uncompressed: `.sql`
- Compressed: `.sql.gz`

#### PostgreSQL prompt flow

- Connection type: Local, Remote, or Docker

If Docker:
- Container name
- User
- Password
- Database name
- Output directory (default `./backups`)
- Uses `docker exec` + `pg_dump`

If Local/Remote:
- Host (default `127.0.0.1`)
- Port (default `5432`)
- User
- Password
- Database name
- Output directory (default `./backups`)

PostgreSQL backup output:

- Uncompressed: `.sql`
- Compressed: `.sql.gz`

---

### 2) List backups

Run:

- `db_backup backup:list`

What it does:

- Reads `$HOME/.db_backup/backupRegistry.json` (or `DB_BACKUP_REGISTRY_PATH` if set)
- Prints backup history with:
  - ID
  - DB type
  - database name
  - file size
  - created time
  - stored path

---

### 3) Restore a backup

Run:

- `db_backup backup:restore <id>`

Flow:

1. Looks up backup by ID from registry.
2. Verifies connection snapshot exists in that entry.
3. Prompts for restore mode:
   - Merge (keep existing data)
   - Replace (drop existing data)
4. For replace mode, asks confirmation.
5. Rebuilds adapter using saved connection data.
6. Runs adapter `restore()`.

Restore behavior by DB:

- MongoDB: `mongorestore` against backup folder path.
- MySQL: pipes SQL into `mysql` (supports `.gz` input).
- PostgreSQL: pipes SQL into `psql` (supports `.gz` input).

---

### 4) Delete a backup

Run:

- `db_backup backup:delete <id>`

What it does:

1. Finds backup in registry.
2. Deletes backup file/folder from disk (if it exists).
3. Removes registry entry.
4. Prints delete confirmation.

---

## Registry Format

Each created backup is saved as an entry containing fields similar to:

- `id`
- `db`
- `database`
- `path`
- `connection` (uri/host/port/user/password/mode/container)
- `size`
- `compressed`
- `createdAt`

This allows restore operations to reuse the original connection details.

---

## Typical End-to-End Example

1. Create backup:
   - `db_backup backup:create --compress --verbose`
2. List backups:
   - `db_backup backup:list`
3. Pick an ID from output.
4. Restore backup:
   - `db_backup backup:restore 1776174984348`
5. Delete old backup if needed:
   - `db_backup backup:delete 1776174984348`

---

## Notes

- The CLI command metadata name is `db-backup`, while the linked executable from `package.json` is `db_backup`.
- The registry file path can be overridden using `DB_BACKUP_REGISTRY_PATH`.
- Backups can contain sensitive credentials in the saved connection snapshot; protect this project directory accordingly.

---

## Security Hardening

- Run security checks before publish:
  - `npm test`
  - `npm run audit`
- `prepublishOnly` enforces tests + audit before publishing.
- Package publish is restricted using the `files` allowlist in `package.json` to reduce accidental file leakage.
- Unused dependencies were removed to reduce supply-chain risk.
- Enable npm provenance during publish for package integrity attestation.

---

## Current Tech Stack

- Node.js (ES modules)
- Commander (CLI parsing)
- Inquirer (interactive prompts)
- Native `child_process` for invoking DB tools
- JSON file registry for persistence

---

## License

ISC
