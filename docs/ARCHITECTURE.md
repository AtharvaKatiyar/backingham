# Architecture

## Overview

The CLI uses a layered adapter design:

1. CLI command handlers collect input and orchestrate flow.
2. Adapter factory selects the database adapter.
3. Database adapters run native backup/restore binaries.
4. Registry layer stores backup metadata.

## Main Layers

### CLI entrypoint
- `bin/cli.js`

Registers commands and maps them to command handlers.

### Command handlers
- `src/commands/backup/create.js`
- `src/commands/backup/list.js`
- `src/commands/backup/restore.js`
- `src/commands/backup/delete.js`

`create.js` merges normalized CLI options with prompt answers, supports URI/manual remote flows (MySQL/PostgreSQL), and normalizes registry entries by deriving a `database` value from URI path when needed.

### Adapters
- `src/adapters/baseAdapter.js`
- `src/adapters/adaptorFactory.js`
- `src/adapters/mongoAdapter.js`
- `src/adapters/mysqlAdaptor.js`
- `src/adapters/postgresAdapter.js`

### Prompts
- `src/prompts/mongo.js`
- `src/prompts/mysql.js`
- `src/prompts/postgres.js`

### Registry and utilities
- `src/registry/registry.js`
- `src/utils/errors.js`
- `src/utils/normalize.js`
- `src/utils/validate.js`

## Error handling

Typed errors are used for clearer failures:
- ValidationError
- ConnectionError
- BackupError
- RestoreError
- RegistryError

## Test coverage

The `tests/` folder validates:
- adapter selection
- command argument builders
- prompt flows for local/remote/URI/docker paths
- option normalization/validation
