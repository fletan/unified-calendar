---
name: "speckit-implement-phase"
description: "Implement a single phase from tasks.md on a stacked branch and open a stacked PR targeting the previous phase branch"
argument-hint: "<phase-number> (e.g. '1', '2', '3')"
compatibility: "Requires spec-kit project structure with .specify/ directory, gh CLI, and git"
metadata:
  author: "local"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

The argument is the phase number to implement (e.g. `1`, `2`, `3`).
If not provided, ask the user which phase they want to implement before proceeding.

---

## Overview

This skill implements **one phase** from `tasks.md` in isolation:

1. Resolves context (feature dir, current branch, tasks)
2. Creates a stacked branch: `<feature-prefix>/phase-<N>` branching off `<feature-prefix>/phase-<N-1>` (or the feature branch for phase 1)
3. Implements all tasks in the requested phase following the same rules as `speckit-implement`
4. Commits the work
5. Pushes the branch and opens a PR targeting the parent branch (stacked PR)

The result is a small, focused PR that can be reviewed independently while the next phase is being developed on top of it.

---

## Step 1 — Resolve prerequisites and context

Run the prerequisite check and parse output:

```bash
bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Parse `FEATURE_DIR` and `AVAILABLE_DOCS` from the JSON output. All subsequent paths must be absolute.

From `FEATURE_DIR`, derive:
- `FEATURE_BRANCH`: the git branch that corresponds to the overall feature (e.g. `002-unified-calendar-view`). Determine this by running `git rev-parse --abbrev-ref HEAD` **before** creating any new branch, or by reading it from `.specify/extensions/git/` config if available. This is the branch to fall back to for phase 1's parent.
- `FEATURE_PREFIX`: the portion of `FEATURE_BRANCH` before any `/phase-N` suffix. Example: if `FEATURE_BRANCH` is `002-unified-calendar-view`, then `FEATURE_PREFIX` is `002-unified-calendar-view`.

---

## Step 2 — Parse the requested phase from tasks.md

Read `FEATURE_DIR/tasks.md`.

Parse all phase sections. Each phase section starts with a line matching:

```
## Phase <N>: <title>
```

Extract for every phase:
- Phase number `N` (integer)
- Phase title (the text after `Phase N:`)
- All task lines within that phase section (lines matching `- [ ] T...` or `- [X] T...`)
- Status of each task: pending (`- [ ]`) or completed (`- [X]` / `- [x]`)

**Determine the target phase**: use the phase number from the user argument.

If the user provided no argument, list all phases with their completion status and ask which one to implement:

```
Available phases:
  Phase 1: Setup (Shared Infrastructure)       — 5/5 tasks complete ✓
  Phase 2: Foundational (Blocking Prerequisites) — 6/6 tasks complete ✓
  Phase 3: User Story 1 — Connect Multiple...  — 0/13 tasks pending
  ...

Which phase would you like to implement? (enter number)
```

**Validate the target phase**:
- If the phase number does not exist in tasks.md → error and stop
- If **all tasks in the phase are already complete** → inform the user and stop (nothing to do)
- If the phase has **upstream dependencies** (phases that must complete first) and any of those phases contain incomplete tasks → warn the user and ask for confirmation before proceeding

Upstream dependency rules (derived from the `## Dependencies & Execution Order` section of tasks.md, or inferred from phase numbering):
- Phase N depends on Phase N-1 (sequential by default)
- The skill reads the `### Phase Dependencies` section if present and uses it verbatim

---

## Step 3 — Determine branch names

```
PHASE_BRANCH  = <FEATURE_PREFIX>/phase-<N>       (e.g. 002-unified-calendar-view/phase-3)
PARENT_BRANCH = <FEATURE_PREFIX>/phase-<N-1>     (e.g. 002-unified-calendar-view/phase-2)
               OR <FEATURE_BRANCH>               (for phase 1, parent = feature branch)
```

Check if `PHASE_BRANCH` already exists locally or remotely:

```bash
git branch --list "<PHASE_BRANCH>"
git ls-remote --heads origin "<PHASE_BRANCH>"
```

- **Branch does not exist**: create it branching off `PARENT_BRANCH`
- **Branch already exists**: switch to it (the phase was previously started; continue where it left off)

If `PARENT_BRANCH` does not exist locally:
- Try to fetch it: `git fetch origin <PARENT_BRANCH>`
- If it doesn't exist remotely either → error: "Parent branch `<PARENT_BRANCH>` does not exist. Complete phase <N-1> first."

Create/switch to the phase branch:

```bash
# If branch does not exist:
git checkout -b <PHASE_BRANCH> <PARENT_BRANCH>

# If branch already exists:
git checkout <PHASE_BRANCH>
```

Print confirmation:

```
Branch: <PHASE_BRANCH>  (stacked on: <PARENT_BRANCH>)
```

---

## Step 4 — Load implementation context

Load the same documents as `speckit-implement`:

- **REQUIRED**: `FEATURE_DIR/tasks.md` — full task list
- **REQUIRED**: `FEATURE_DIR/plan.md` — tech stack and file structure
- **IF EXISTS**: `FEATURE_DIR/data-model.md`
- **IF EXISTS**: `FEATURE_DIR/contracts/`
- **IF EXISTS**: `FEATURE_DIR/research.md`
- **IF EXISTS**: `FEATURE_DIR/quickstart.md`

---

## Step 5 — Implement the phase tasks

Execute only the tasks that belong to the target phase and are **not yet complete** (`- [ ]`).

Follow all the same rules as `speckit-implement`:

- **Respect task order and [P] markers**: tasks marked `[P]` in the same phase can run in parallel (different files, no shared state)
- **Tests before code** where the phase includes both test and implementation tasks for the same unit
- **Mark each task `[X]`** in `FEATURE_DIR/tasks.md` immediately after it completes
- **Halt on failure**: if a non-parallel task fails, stop and report the error with context
- **Report progress** after each completed task

After all tasks in the phase are complete, run any validation specific to that phase's checkpoint (described in the `**Checkpoint**:` line at the end of the phase section in tasks.md). Report whether the checkpoint passes.

---

## Step 6 — Commit the work

Stage all changed files and commit:

```bash
git add -A
git commit -m "<phase-title> (Phase <N>)

Implements all tasks for Phase <N> of <FEATURE_PREFIX>.

Tasks completed: <comma-separated T-IDs>

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Where:
- `<phase-title>` is the phase title parsed from tasks.md (e.g. `Setup (Shared Infrastructure)`)
- `<comma-separated T-IDs>` is the list of task IDs that were completed in this run (e.g. `T001, T002, T003`)

If there is nothing to commit (all files were already committed mid-phase), skip this step.

---

## Step 7 — Push and open a stacked PR

Push the phase branch:

```bash
git push -u origin <PHASE_BRANCH>
```

Open a PR using `gh pr create`, targeting `PARENT_BRANCH` (not `main` — this is the stacked PR target):

```bash
gh pr create \
  --title "Phase <N>: <phase-title> [<FEATURE_PREFIX>]" \
  --base <PARENT_BRANCH> \
  --body "..."
```

**PR body template**:

```markdown
## Phase <N>: <phase-title>

Part of the `<FEATURE_PREFIX>` feature implementation.

**Stack position**: Phase <N> of <total-phases> — stacked on `<PARENT_BRANCH>`

## Tasks completed

<bullet list of T-IDs and their descriptions, e.g.:>
- T001 — Install runtime deps
- T002 — Install dev deps
- ...

## Checkpoint

<copy the checkpoint text from tasks.md for this phase>

## How to review

This PR is stacked. To review in isolation:
\```bash
git fetch origin && git checkout <PHASE_BRANCH>
\```

The parent branch (`<PARENT_BRANCH>`) contains the work this phase builds on.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code) via `speckit-implement-phase`
```

After `gh pr create` succeeds, print the PR URL.

---

## Step 8 — Print stack summary

After the PR is created, print the current stack state so the user can see the full picture:

```
Stack for <FEATURE_PREFIX>:
  <FEATURE_BRANCH>           ← merge target (main PR)
    └── phase-1              ← PR #X  ✓ (N tasks)
          └── phase-2        ← PR #Y  ✓ (N tasks)
                └── phase-3  ← PR #Z  ← just created
```

Determine which phase branches and PRs already exist by running:

```bash
git branch -r | grep "<FEATURE_PREFIX>/phase-"
gh pr list --base <FEATURE_PREFIX>/phase-<prev> --json number,title,url 2>/dev/null
```

Build the tree from that data. Mark each phase as ✓ (all tasks complete) or ⏳ (in progress) or ○ (not started) based on tasks.md completion status.

---

## Error handling

| Situation | Action |
|---|---|
| Phase number not found in tasks.md | Print available phases and stop |
| All phase tasks already complete | Inform user, show PR URL if one exists, stop |
| Parent branch missing locally and remotely | Error: "Complete phase N-1 first" |
| `gh` CLI not available | Skip PR creation, print git push instructions instead |
| `git push` fails (e.g. already up to date) | Continue to PR creation step |
| PR already exists for this branch | Print the existing PR URL and stop |
