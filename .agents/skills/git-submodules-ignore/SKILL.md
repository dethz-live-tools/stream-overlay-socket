---
name: git-submodules-ignore
author: kizuna-inc
description: Enforces read-only access to Git submodules in this repository. Use this skill whenever a task involves editing, creating, deleting, or otherwise writing to files inside a Git submodule directory (as defined in .gitmodules), or whenever it's unclear if a target path belongs to the root repo or a submodule. Always consult this skill before any write/edit/delete operation (replace_file_content, multi_replace_file_content, write_to_file, shell commands like rm/mv/sed -i, etc.) touches a path that could be inside a submodule.
license: MIT
version: "1.0.0"
tags:
  - git
  - read-only
---

# Ignore Submodules

## Directive

**Do NOT edit, modify, create, or delete any files inside Git submodules.** This applies to all current and future submodules in this repository, as defined in `.gitmodules`.

## Before any write operation

1. **Check `.gitmodules`** at the repo root to get the current list of submodule paths.
2. **Check whether the target path falls under one of those submodule paths.** If it does, treat it as read-only.
3. If uncertain whether a path is inside a submodule (e.g. nested or ambiguous paths), run `git submodule status` to confirm before writing.

## Rules

- **Read/inspect freely**: viewing, searching, or reading files inside a submodule for reference or context is always fine.
- **Never write inside a submodule**: no edits, creations, deletions, renames, or shell commands that modify files under a submodule path — this includes tools like `replace_file_content`, `multi_replace_file_content`, `write_to_file`, and shell commands such as `rm`, `mv`, `sed -i`, `git apply`, etc.
- **Scope all modifications to the root repository** (`orbit`) only.
- **If a task requires a change inside a submodule**: stop, do not make the edit, and tell the user which submodule and file(s) need the change so they can make it directly in that submodule's own codebase (its own repo/remote).

## Example

> User: "Update the config in `libs/vendor-sdk/config.yaml`" (where `libs/vendor-sdk` is a submodule)

Correct behavior: don't edit the file. Respond that `libs/vendor-sdk` is a submodule, point out the exact file, and explain the change needs to be made in that submodule's own repository (and then the submodule pointer updated in `orbit` afterward, if relevant).