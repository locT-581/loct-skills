---
name: commit-chat-changes
description: 'Commit only the files changed during the current chat session. Use when the user says "commit changes", "commit chat changes", or "commit this".'
---

# Commit Chat Changes

## Purpose

Treat a request such as **"commit changes"** as shorthand for:

> Commit only the repository files the agent changed during this conversation. Do not include unrelated working-tree or staged changes.

This skill operates at **file scope**, not whole-repository scope.

## Core Rules

1. **Conversation changes only.**
   Include only files the agent created, modified, deleted, or renamed during the current conversation.

2. **Never infer chat ownership from `git status`.**
   Git status identifies changed files, not who changed them.

3. **Never broaden the scope automatically.**
   Do not use `git add .`, `git add -A`, or equivalent repository-wide staging.

4. **Preserve unrelated changes.**
   Existing modified, untracked, or staged files outside the conversation file set must remain untouched and uncommitted.

5. **Invocation is authorization.**
   Do not ask for another confirmation when the user explicitly requests the commit.

6. **Ask only on material ambiguity or risk.**
   Stop and ask when the conversation file set cannot be determined reliably, a merge/conflict state exists, or committing would require including changes outside the authorized scope.

7. **No history rewriting.**
   Never amend, reset, rebase, force-push, or otherwise rewrite Git history unless separately requested.

## Workflow

### 1. Resolve Repository

Verify the workspace is inside a Git repository:

```bash
git rev-parse --is-inside-work-tree
git rev-parse --show-toplevel
```

Stop with a concise explanation if no repository is available.

### 2. Resolve Conversation File Set

Inspect the current conversation's file-mutation history and collect every repository path the agent:

- created;
- edited;
- deleted;
- renamed or moved.

Deduplicate paths.

Exclude:

- temporary/scratch files outside the repository;
- generated chat artifacts not belonging to the project;
- files only read or inspected;
- files changed by the user or another process but never modified by the agent in this conversation.

Do **not** substitute `git status` or timestamps when conversation ownership cannot be determined reliably.

If the resulting set is empty, report that there is nothing from this conversation to commit and stop.

### 3. Reconcile With Git

Inspect:

```bash
git status --porcelain
git diff --cached --name-only
```

Cross-reference Git state with the conversation file set.

Remove conversation files that no longer differ from `HEAD`.

Preserve every unrelated staged or unstaged change.

If a conversation file has unresolved merge conflicts, stop instead of committing it.

> If reliable session evidence shows that a file already contained unrelated uncommitted edits before the agent modified it, do not silently claim those edits as chat-only work. Surface the overlap before committing the whole file.

### 4. Stage Only Conversation Files

Stage paths explicitly:

```bash
git add -- <path1> <path2> ...
```

Never stage the repository globally.

Handle created, modified, renamed, and deleted conversation files using explicit pathspecs.

### 5. Create Commit Message

Generate one concise Conventional Commit subject:

```text
feat: ...
fix: ...
refactor: ...
docs: ...
test: ...
chore: ...
```

Requirements:

- describe the actual conversation changes;
- prefer one meaningful subject over enumerating filenames;
- keep the subject under 72 characters;
- do not invent issue IDs, scopes, or business context.

If the user supplied a commit message, use it instead.

### 6. Commit Only the Authorized Paths

Commit using an explicit path scope so unrelated pre-staged changes are not accidentally included:

```bash
git commit --only -m "<message>" -- <path1> <path2> ...
```

Use the equivalent safe path-scoped operation when handling newly added files requires it.

Never run an unrestricted `git commit` when unrelated staged changes exist.

### 7. Verify

After committing, verify the resulting commit:

```bash
git show --stat --oneline --summary HEAD
git diff-tree --no-commit-id --name-only -r HEAD
```

Confirm that every committed path belongs to the conversation file set.

If an unexpected path appears, report the discrepancy immediately and do not perform further history-changing operations automatically.

## Output

Keep the final response short:

```text
Committed <hash> — <message>
<N> files committed.
```

Mention remaining unrelated working-tree/staged changes only when useful.

## Stop Conditions

Do not commit automatically when:

- the repository cannot be identified;
- the conversation's modified-file set cannot be determined reliably;
- there are unresolved merge conflicts affecting target files;
- safe path-scoped committing is not possible;
- the requested operation would necessarily include unrelated files.

In those cases, explain the specific blocker and ask only for the minimum information needed to continue.
