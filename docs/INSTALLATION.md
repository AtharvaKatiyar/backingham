# Installation Guide

## 1) Install from npm (global)

```bash
npm install -g backinghum
```

Verify:

```bash
backinghum --version
```

## 2) Local project usage (without global install)

```bash
npm install
node bin/cli.js --help
```

## 3) Runtime prerequisites

This CLI wraps native database tools. Install the tools for the databases you plan to use.

### MongoDB
- mongosh
- mongodump
- mongorestore
- tar

### MySQL
- mysql
- mysqldump
- gzip / gunzip

### PostgreSQL
- psql
- pg_dump
- gzip / gunzip

### PostgreSQL (Docker mode)
- docker
- target container must provide PostgreSQL client binaries

## 4) Registry location

Backup metadata is saved at:

- `$HOME/.db_backup/backupRegistry.json`

Override with:

- `DB_BACKUP_REGISTRY_PATH=/home/<user>/.db_backup/customRegistry.json`

Note: custom registry paths are accepted only if they are inside the current user's home directory.

## 5) Uninstall

```bash
npm uninstall -g backinghum
```
