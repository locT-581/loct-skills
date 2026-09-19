# 🚀 Agent Skills Repository & Universal CLI - Operations Guide

This document provides a detailed guide on how to operate, manage, and use the **Agent Skills Repository** system — a lightweight, tool-agnostic (Agent-agnostic) platform for storing, managing, and distributing standards, workflows, and best practices for AI Agents across multiple projects.

---

## 🧭 1. Mental Model

The system operates on an **Upstream Registry ➔ Downstream Projects** model using the **Projection Pattern**:

```text
┌─────────────────────────────────────────────────────────────┐
│              UPSTREAM SKILLS REGISTRY (Monorepo)            │
│                                                             │
│   skills/                                                   │
│   ├── nextjs-clean-architecture/                            │
│   │   ├── SKILL.md        (Canonical Contract: rules + SOP) │
│   │   ├── templates/      (Sample boilerplate code)         │
│   │   └── scripts/        (Automated verification scripts)  │
│   └── typescript-strict-rules/                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                Command: skills add <skill-name>
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 YOUR PROJECT (Downstream Project)           │
│                                                             │
│   my-project/                                               │
│   ├── .skills.json        (Lockfile: version, SHA-256 hash) │
│   ├── .skills/            (Canonical package - COMMIT TO GIT│
│   │   └── nextjs-clean-architecture/                        │
│   │                                                         │
│   └── THIN PROJECTIONS    (Ultra-lightweight agent rules)   │
│       ├── .cursor/rules/*.mdc    ➔ For Cursor               │
│       ├── .claude/skills/...     ➔ For Claude Code          │
│       ├── .windsurfrules         ➔ For Windsurf             │
│       └── AGENTS.md              ➔ For Terminal Bots        │
└─────────────────────────────────────────────────────────────┘
```

> **Why use Thin Projections?**
> Instead of stuffing thousands of lines of boilerplate code into rule files — causing context window overflow (Context Rot) and wasting AI tokens — rule files serve only as "directives". Agents read only the core rules; whenever new code needs to be generated, the agent accesses `.skills/<name>/templates/` on demand.

---

## 🛠️ 2. Environment Preparation & CLI Setup

### Step 1: Install and Build
In the root directory of this repository:
```bash
# Install dependencies
pnpm install

# Build CLI package
pnpm run build

# Run tests to ensure everything works properly
pnpm run test
```

### Step 2: Enable the `skills` CLI globally
To run `skills` directly from any terminal directory without specifying long paths:
```bash
cd packages/cli
npm link
# Or: pnpm link --global
```
*After linking, you can run `skills --help` from anywhere on your machine.*

*(Optional) Run directly from the built file if not linked:*
```bash
node {<root-path>}/packages/cli/dist/index.js --help
```

---

## ✍️ 3. Skill Authoring & Management Workflow (For Maintainers)

Each new skill is created in the `skills/<skill-name>/` directory according to the following structure:

```text
skills/<skill-name>/
├── SKILL.md                 # [REQUIRED] Metadata + Rules + SOP Guidelines
├── templates/               # [OPTIONAL] Sample boilerplate code
├── scripts/                 # [OPTIONAL] Verification/lint/test scripts
└── references/              # [OPTIONAL] Reference documentation, cheat-sheets
```

### Standard structure of `SKILL.md`:
```markdown
---
name: "skill-name-kebab-case"
version: "1.0.0"
description: "A concise 1-2 sentence description of the skill's purpose."
triggers:
  globs:
    - "src/**/*.ts"
    - "src/**/*.tsx"
  intents:
    - "write new component"
    - "refactor code"
  default_mode: "auto"       # "auto" | "always" | "manual"
dependencies:                # Flat Peer Dependencies (if any)
  - "typescript-strict-rules"
---

# Skill Name

## 1. Core Principles
- Rule 1
- Rule 2

## 2. Standard Operating Procedure (SOP)
Detailed steps the agent must follow...

> [!TIP]
> Refer to boilerplate code at: `.skills/<skill-name>/templates/`

> [!IMPORTANT]
> Run code quality verification using:
> `bash .skills/<skill-name>/scripts/verify.sh`
```

### Testing a newly created skill:
After creating or editing a skill, run:
```bash
pnpm test
```
The automated test suite verifies compatibility across all target platforms (Cursor, Claude, Windsurf, Generic).

---

## 💻 4. Practical Usage in Downstream Projects (Developer Workflow)

When starting a new project (e.g., Next.js web app, Go/Node.js backend API, etc.):

### 1. Initialize Skills Management (`init`)
Navigate your terminal to your project directory and run:
```bash
skills init
```
- **Behavior**: The CLI automatically inspects the project to detect Cursor (`.cursor`), Claude (`.claude`), Windsurf (`.windsurfrules`), or Terminal (`AGENTS.md`), and generates the `.skills.json` file.

### 2. Install a Skill into the project (`add`)
```bash
# Interactive installation (select platforms with Space/Enter)
skills add nextjs-clean-architecture

# Or automatic installation without prompts (auto-detects project platforms)
skills add nextjs-clean-architecture --yes

# Or specify desired target platforms explicitly
skills add nextjs-clean-architecture --targets cursor,claude
```
- **Behavior**:
  1. Downloads the complete skill package into `.skills/<name>/`.
  2. Resolves `dependencies` (if the skill requires a base skill, the CLI prompts to install it automatically).
  3. Compiles the corresponding Thin Projections (e.g., generating `.cursor/rules/<name>.mdc`).
  4. Computes the SHA-256 hash and records it in `.skills.json`.

> [!CAUTION]
> **Golden Rule #1:** You **MUST** commit both the `.skills/` directory and the `.skills.json` file to the project's Git repository. Do not add them to `.gitignore`. This ensures teammates or CI/CD pipelines never encounter "broken links".

### 3. Check Integrity & Detect Changes (`diff`)
```bash
skills diff
```
- **Behavior**:
  - If `.skills/` contents match the installation state 100%: Displays `[CLEAN]`.
  - If files inside `.skills/` were modified locally: Displays `[LOCAL MODIFIED]` with hash comparisons to show what customizations were made relative to upstream.

### 4. Update Skills (`update`)
When the upstream registry publishes a new version or updated best practices:
```bash
skills update nextjs-clean-architecture
```
- **Safe 3-Way Check Mechanism**:
  - If you **have not modified files locally**: The CLI automatically updates to the latest upstream version and rebuilds all Thin Projections.
  - If you **have made local modifications**: The CLI pauses and prompts for your choice:
    - `[s] Skip`: Skip (keeps your local custom code).
    - `[b] Backup`: Automatically creates a backup directory `.skills/<name>.backup-<timestamp>` before updating.
    - `[o] Overwrite`: Overwrites local changes with the latest upstream version.

---

## 🌐 5. Distribution Guide (Publishing to GitHub & npm)

When you want to share this toolchain with teammates or use it via `npx`:

### Option 1: Push Skills Repository to GitHub
1. Initialize a Git repository and push all source code to GitHub (e.g., `github.com/locT-581/loct-skills`).
2. Open [lockfile.ts](file:///Users/loct-581/Work/My-Project/loct-custom-skills/packages/cli/src/core/lockfile.ts) and configure your default repository name.
3. Users on any machine can then install skills via:
   ```bash
   npx @loctx581/skills add <skill-name>
   ```

### Option 2: Publish CLI Package to npm
In the `packages/cli/` directory:
```bash
# Update package name in packages/cli/package.json to @scope/skills or your-cli-name
npm login
npm publish --access public
```

---

## ❓ 6. Frequently Asked Questions (Troubleshooting)

**Q: Why not just use Symlinks from the upstream repository to projects?**  
*A:* Symlinks work fine on a single local machine, but break completely (broken symlinks) when committed to Git, cloned by teammates, or run in CI/CD environments (GitHub Actions) or on Windows. The copied package + SHA-256 Lockfile model is industry standard (similar to npm and `shadcn/ui`).

**Q: If I only use Cursor, do I need files for other agents?**  
*A:* No. When running `skills add <name> --targets cursor`, the CLI generates only `.cursor/rules/<name>.mdc` and the canonical package `.skills/<name>/`. Your project stays clean without unnecessary Claude or Windsurf configuration files.

**Q: How do I write a safe verification script (`verify.sh`)?**  
*A:* Verification scripts should only perform read-only static analysis: grep for forbidden imports, run typecheck, or run linters. Never write commands that delete files, mutate data, or send outbound network requests in verification scripts.
