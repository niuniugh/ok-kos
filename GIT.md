# Git Workflow Guide

This project uses a **branch-based PR workflow**.
Nobody pushes directly to `main` — not even the owner.
Every change goes through: **branch → commit → push → Pull Request → CI → merge**.

---

## Rules

- Never commit directly to `main`
- Every PR must pass CI (lint + typecheck) before merging
- At least 1 person must approve before merging

---

## Phase 1 — First-Time Setup

Only do this once when you first join the project.

### Step 1 — Clone the repository

```bash
git clone https://github.com/niuniugh/ok-kos.git
cd ok-kos
```

This downloads the full codebase to your local computer inside a folder called `ok-kos`.

### Step 2 — Install dependencies

```bash
pnpm install
```

This installs all the packages the project needs. You must have `pnpm` installed first.
If you don't have it: `npm install -g pnpm`

### Step 3 — Start the local database

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts a PostgreSQL database in Docker. You must have Docker Desktop running first.

### Step 4 — Set up your environment file

```bash
cp .env.example .env
```

Open `.env` and fill in the required values (ask the project owner if unsure).

---

## Phase 2 — Daily Workflow (Every Time You Work)

Do this every time you want to make any change to the codebase.

### Step 1 — Switch to main and pull the latest changes

```bash
git checkout main
git pull origin main
```

**Why:** Someone else may have merged code since you last worked. Always start from the latest version of `main` to avoid conflicts.

Expected output:
```
Already on 'main'
Your branch is up to date with 'origin/main'.
```
or
```
Updating abc1234..def5678
Fast-forward
 src/somefile.ts | 5 +++++
```

### Step 2 — Create a new branch

```bash
git checkout -b feature/your-feature-name
```

Replace `feature/your-feature-name` with a short descriptive name. Use these prefixes:

| Prefix | When to use |
|---|---|
| `feature/` | Adding new functionality |
| `fix/` | Fixing a bug |
| `docs/` | Documentation changes only |
| `chore/` | Config, tooling, dependencies |

Examples:
```bash
git checkout -b feature/add-room-booking
git checkout -b fix/login-error
git checkout -b docs/update-readme
git checkout -b chore/upgrade-dependencies
```

**Why:** Never work directly on `main`. A branch is your own isolated workspace where your changes don't affect anyone else until you're ready.

Expected output:
```
Switched to a new branch 'feature/add-room-booking'
```

### Step 3 — Edit the codebase

Open the project in your editor (VS Code, etc.) and make your changes.
There are no git commands here — just write your code normally.

### Step 4 — Check what you changed

```bash
git status
```

This shows you which files you modified, added, or deleted.

Expected output:
```
On branch feature/add-room-booking
Changes not staged for commit:
  modified:   src/modules/room/room.service.ts
  modified:   src/routes/room.tsx

Untracked files:
  src/modules/room/room.validator.ts
```

### Step 5 — Stage your changes

```bash
git add .
```

This marks all your changed files as "ready to commit".

If you only want to stage specific files instead of everything:
```bash
git add src/modules/room/room.service.ts
```

**Why:** Git requires you to explicitly choose what goes into each commit. `git add .` stages everything in your current directory.

### Step 6 — Commit your changes

```bash
git commit -m "feat: add room booking functionality"
```

Use this format for the message: `type: short description in lowercase`

| Type | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Config, tooling, non-functional |
| `refactor:` | Code restructure, no behavior change |

Examples:
```bash
git commit -m "feat: add tenant registration form"
git commit -m "fix: correct room price calculation"
git commit -m "docs: update API usage in README"
```

**What happens automatically:** Husky runs `pnpm lint` before every commit.
If your code has lint errors, the commit will be rejected. Fix the errors, then try committing again.

Expected output on success:
```
[feature/add-room-booking a1b2c3d] feat: add room booking functionality
 3 files changed, 47 insertions(+), 2 deletions(-)
```

### Step 7 — Push your branch to GitHub

```bash
git push origin feature/add-room-booking
```

Replace `feature/add-room-booking` with your actual branch name.

**Why:** This uploads your local branch to GitHub so you can open a Pull Request.

Expected output:
```
To https://github.com/niuniugh/ok-kos.git
 * [new branch]      feature/add-room-booking -> feature/add-room-booking
```

GitHub will also print a direct URL to open a PR:
```
remote: Create a pull request for 'feature/add-room-booking' on GitHub by visiting:
remote:      https://github.com/niuniugh/ok-kos/pull/new/feature/add-room-booking
```

### Step 8 — Open a Pull Request on GitHub

1. Go to the URL printed in your terminal, or navigate to:
   ```
   https://github.com/niuniugh/ok-kos/compare/main...feature/add-room-booking
   ```
2. Click **"Create pull request"**
3. Fill in the title (same as your commit message is fine)
4. Add a short description of what you changed and why
5. Click **"Create pull request"**

### Step 9 — Wait for CI to pass

After opening the PR, GitHub Actions will automatically run the CI pipeline:

```
Lint & Typecheck
├── pnpm install
├── pnpm prisma generate
├── pnpm lint         ← checks code style with Biome
└── pnpm tsc --noEmit ← checks TypeScript types
```

You will see one of these at the bottom of your PR:

- **Yellow circle** — CI is still running, wait
- **Green checkmark** — CI passed, you're good
- **Red X** — CI failed, you need to fix something

**If CI fails:**
1. Click "Details" next to the failed check to see the error
2. Fix the error on your local machine
3. Commit the fix: `git add . && git commit -m "fix: resolve lint error"`
4. Push again: `git push origin feature/add-room-booking`
5. CI will re-run automatically

### Step 10 — Get a review and merge

1. Ask the project owner or a teammate to review your PR
2. They will either approve it or leave comments requesting changes
3. If changes are requested, make them locally → commit → push (repeat Step 6–7)
4. Once approved and CI passes, click **"Merge pull request"** on GitHub
5. Click **"Confirm merge"**
6. Click **"Delete branch"** to clean up

---

## Phase 3 — After Your PR Is Merged

Once your PR is merged, clean up your local machine.

### Step 1 — Switch back to main

```bash
git checkout main
```

### Step 2 — Pull the merged changes

```bash
git pull origin main
```

Your changes are now in `main` along with everyone else's.

### Step 3 — Delete your local branch

```bash
git branch -d feature/add-room-booking
```

**Why:** Keep your local repo clean. The branch already exists on GitHub history, you don't need it locally anymore.

---

## Quick Reference

```
git checkout main                        # go to main
git pull origin main                     # get latest changes
git checkout -b feature/your-name        # create your branch
# ... edit files ...
git status                               # see what changed
git add .                                # stage all changes
git commit -m "feat: your message"       # commit
git push origin feature/your-name        # push to GitHub
# open PR on GitHub → wait for CI → get review → merge
git checkout main                        # back to main
git pull origin main                     # sync merged changes
git branch -d feature/your-name          # delete local branch
```
