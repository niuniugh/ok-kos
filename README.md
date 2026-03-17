# OK-KOS

A fullstack boarding house (kos) management application built with TanStack Start, Prisma, PostgreSQL, and shadcn/ui.

## Stack

- **Framework** — [TanStack Start](https://tanstack.com/start) (SSR, file-based routing, server functions)
- **Database** — PostgreSQL via [Prisma v7](https://www.prisma.io/) with `@prisma/adapter-pg`
- **Auth** — Email/password with bcrypt, encrypted cookie sessions
- **UI** — [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS v4 + Geist font
- **Validation** — Zod v4
- **Linting** — Biome (enforced on every commit via Husky)

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24
- [pnpm](https://pnpm.io/) >= 9
- [Docker](https://www.docker.com/) (for local PostgreSQL)

## Getting Started

**1. Clone the repo**

```bash
git clone <repo-url>
cd ok-kos
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5440/postgres

# Generate a strong secret: openssl rand -hex 32
SESSION_SECRET=your_session_secret_here
```

**4. Start the database**

```bash
pnpm docker:up
```

**5. Run migrations**

```bash
pnpm db:migrate
```

**6. Start the dev server**

```bash
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Run Biome linter with auto-fix |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm docker:up` | Start local PostgreSQL container |
| `pnpm docker:down` | Stop local PostgreSQL container |

## Project Structure

```
src/
├── components/
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── lib/
│   ├── prisma.ts        # Prisma client singleton
│   └── utils.ts         # cn(), parseServerError()
├── modules/
│   ├── auth/
│   │   ├── schema.ts    # Zod schemas (LoginSchema, RegisterSchema)
│   │   └── serverFn.ts  # loginFn, registerFn, logoutFn
│   └── sessions/
│       ├── appSession.ts    # Cookie session config
│       └── serverFn.ts      # getCurrentSession()
├── routes/
│   ├── __root.tsx           # Root layout
│   ├── index.tsx            # Redirects to /dashboard or /login
│   ├── login.tsx            # Login page
│   ├── register.tsx         # Register page
│   ├── _dashboard.tsx       # Auth guard layout
│   └── _dashboard/
│       └── dashboard/
│           └── index.tsx    # Dashboard
└── styles.css               # Tailwind v4 + design tokens
```

## Database

The schema lives in `prisma/schema.prisma`. After modifying it, run:

```bash
pnpm db:migrate
```

The Prisma client is generated to `generated/prisma/` (gitignored, auto-regenerated on migrate).
