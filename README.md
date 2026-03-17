# TanStack Boilerplate

A production-ready fullstack boilerplate built with TanStack Start, Prisma, PostgreSQL, and shadcn/ui. Clone this once, skip the setup, focus on your MVP.

## Stack

- **Framework** — [TanStack Start](https://tanstack.com/start) (SSR, file-based routing, server functions)
- **Database** — PostgreSQL via [Prisma v7](https://www.prisma.io/) with `@prisma/adapter-pg` (WASM, no binary engine)
- **Auth** — Email/password with bcrypt, encrypted cookie sessions
- **UI** — [shadcn/ui](https://ui.shadcn.com/) (radix-nova style) + Tailwind CSS v4 + Geist font
- **Validation** — Zod v4
- **Linting** — Biome (enforced on every commit via Husky)

## Features

- Register, login, logout flows with session cookie auth
- Auth guard on protected routes (`/_dashboard`)
- Inline form validation with field-level errors
- Toast notifications (sonner) themed to match the design system
- Dark mode by default (custom ThemeProvider, no next-themes)
- 56 shadcn/ui components pre-installed
- Docker Compose for local PostgreSQL
- Convenience scripts for DB and Docker

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9
- [Docker](https://www.docker.com/) (for local PostgreSQL)

## Getting Started

**1. Use this template**

Click "Use this template" on GitHub to create a new repo from this boilerplate.

**2. Clone your new repo**

```bash
git clone https://github.com/yourname/your-project.git
cd your-project
```

**3. Install dependencies**

```bash
pnpm install
```

**4. Set up environment variables**

```bash
cp .env.example .env
```

Then edit `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5440/postgres

# Generate a strong secret: openssl rand -hex 32
SESSION_SECRET=your_session_secret_here
```

**5. Start the database**

```bash
pnpm docker:up
```

**6. Run migrations**

```bash
pnpm db:migrate
```

**7. Start the dev server**

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
│   └── ui/              # 56 shadcn/ui components
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
│   ├── __root.tsx           # Root layout (ThemeProvider, Toaster)
│   ├── index.tsx            # Redirects to /dashboard or /login
│   ├── login.tsx            # Login page
│   ├── register.tsx         # Register page
│   ├── _dashboard.tsx       # Auth guard layout
│   └── _dashboard/
│       └── dashboard/
│           └── index.tsx    # Dashboard placeholder
└── styles.css               # Tailwind v4 + design tokens
```

## Adding a New Protected Route

Create a file under `src/routes/_dashboard/`:

```
src/routes/_dashboard/your-page/index.tsx
```

It will automatically be protected by the auth guard and accessible at `/your-page`.

## Database

The schema is in `prisma/schema.prisma`. After modifying it:

```bash
pnpm db:migrate
```

Prisma client is generated to `generated/prisma/` (gitignored, regenerated on migrate).
