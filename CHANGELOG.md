# Changelog

All notable changes to this project are documented in this file.

## [1.0.5] - 2026-04-22

### Security
- Removed the unused shell-string command helper behavior in `src/utils/exec.js`.
- Reduced shell-invocation risk by keeping command execution argument-based in adapters.

### Documentation
- Updated `SECURITY.md` with explicit command execution safety notes:
  - shell-string helper removed
  - no `shell: true` mode used
  - adapters use argument-based process spawning

## [1.0.4] - 2026-04-22

### Features
- Improved backup registry entry creation for URI-based connections.
- Added database name inference from URI path when `database` is missing.
- Prevents registry validation failures for URI-only backup flows.

### Prompt Flow Updates
- MySQL remote flow now supports two methods:
  - Connection URI
  - Manual details
- PostgreSQL remote flow now supports two methods:
  - Connection URI
  - Manual details

### Tests
- Added create-command tests for URI database inference and fallback behavior:
  - `tests/commands/backup/create.test.js`
- Updated prompt tests to match current remote flow behavior:
  - `tests/prompts/mysqlPrompt.test.js`
  - `tests/prompts/postgresPrompt.test.js`
- Updated option-validation expectation to match current validator behavior:
  - `tests/utils/options.test.js`

### Documentation
- Updated README and docs to reflect new remote connection flows and URI behavior.
- Fixed npm README documentation links by switching to absolute URLs via `unpkg`:
  - `docs/INSTALLATION.md`
  - `docs/COMMANDS.md`
  - `docs/ARCHITECTURE.md`

## [1.0.3] - 2026-04-21

### Security
- Removed shell-string compression command in Mongo backup flow.
- Replaced it with argument-based process execution for tar compression.
- Added filename/path component sanitization for backup artifact names.
- Reduced command-injection and path-traversal risk from untrusted input.

### Tests
- Added sanitizer test coverage in `tests/utils/sanitize.test.js`.

## [1.0.2] - 2026-04-21

### Documentation
- Updated README for published npm package usage (`backinghum`).
- Added dedicated documentation pages:
  - `docs/INSTALLATION.md`
  - `docs/COMMANDS.md`
  - `docs/ARCHITECTURE.md`
- Improved installation and quick-start guidance.
- Clarified security publishing guidance (2FA/OTP flow).

### Packaging
- Included `docs/` in npm publish allowlist.

## [1.0.1] - 2026-04-21

### Security and Publish Readiness
- Hardened error handling across commands/adapters/registry.
- Added comprehensive automated tests.
- Reduced runtime dependency surface.
- Added `SECURITY.md` and packaging hardening.
- Prepared and published package as `backinghum`.
