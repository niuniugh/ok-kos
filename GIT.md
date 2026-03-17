# Git Workflow

This project uses a **branch-based PR workflow**. No one pushes directly to `main` — not even the owner.

---

## Rules

- `main` is protected. All changes go through a Pull Request.
- Every PR must pass CI (lint + typecheck) before merging.
- At least 1 approval is required before merging.

---

## Daily Workflow

### 1. Start from an up-to-date main

```bash
git checkout main
git pull origin main
```

### 2. Create a new branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` — new features
- `fix/` — bug fixes
- `chore/` — config, tooling, dependencies
- `docs/` — documentation changes

### 3. Make changes and commit

```bash
git add .
git commit -m "feat: describe what you did"
```

Commit message format:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — non-functional change
- `docs:` — documentation only

### 4. Push your branch

```bash
git push origin feature/your-feature-name
```

### 5. Open a Pull Request

Go to:
```
https://github.com/niuniugh/ok-kos/compare/main...feature/your-feature-name
```

- Add a clear title and description
- Submit the PR

### 6. Wait for CI to pass

GitHub Actions will automatically run:
- Lint (`pnpm lint`)
- Typecheck (`pnpm tsc --noEmit`)

Fix any failures locally, commit, and push again — CI re-runs automatically.

### 7. Get a review and merge

- At least 1 person must approve the PR
- Once CI passes and approval is given, merge into `main`
- Delete the branch after merging

---

## First-Time Setup (for new contributors)

```bash
git clone https://github.com/niuniugh/ok-kos.git
cd ok-kos
pnpm install
```

Make sure Docker is running for the local database:

```bash
docker compose -f docker-compose.dev.yml up -d
```
