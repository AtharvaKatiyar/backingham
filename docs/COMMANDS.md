# Command Reference

## `backinghum backup:create`

Create a new backup through an interactive wizard.

Options:
- `-c, --compress` : compress output
- `-v, --verbose` : print detailed process logs

Examples:

```bash
backinghum backup:create
backinghum backup:create --compress
backinghum backup:create --compress --verbose
```

---

## `backinghum backup:list`

List all backup entries from the registry.

```bash
backinghum backup:list
```

---

## `backinghum backup:restore <id>`

Restore a backup by ID.

You will be prompted to choose restore mode:
- Merge (keep existing data)
- Replace (drop existing data)

```bash
backinghum backup:restore 1776174984348
```

---

## `backinghum backup:delete <id>`

Delete backup files and remove the registry entry.

```bash
backinghum backup:delete 1776174984348
```

---

## `backinghum --help`

Show all commands and options.
