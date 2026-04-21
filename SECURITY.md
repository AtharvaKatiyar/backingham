# Security Policy

## Reporting a Vulnerability

If you discover a security issue, do not open a public issue. Report it privately to the maintainer.

Include:
- affected command/flow
- impact and reproduction steps
- suggested fix (if available)

## Supported Versions

Only the latest published version is supported for security fixes.

## Supply-Chain Hardening Used

- Dependency surface minimized (only required runtime packages kept)
- `npm audit` enforced in `prepublishOnly`
- Publish artifact restricted via `files` allowlist
- npm provenance enabled in `publishConfig`

## Command Execution Safety

- Direct shell-string execution helper was removed from the codebase.
- Database operations use argument-based process spawning in adapters.
- No `shell: true` execution mode is used.

## Operational Recommendations

- Pin Node.js to a supported LTS release
- Use lockfile installs (`npm ci`) in CI
- Run `npm run audit` regularly
- Rotate registry tokens and use 2FA for npm publish
