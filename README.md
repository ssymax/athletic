# Athletic Club

Reception system for a gym/fitness club, built with Next.js, NextAuth, and Prisma.

Originally built as a one-day project.

## Production Status

This project is also running in production and is actively used by the real Athletic Fitness Club in Olsztyn, Poland. The club owner reduced software costs, and the developer gets a free gym membership.

## Current Scope

- Credential-based login (`ADMIN`, `RECEPTION`)
- Member management (create, edit, deactivate, delete)
- Membership sales (time-based and entry-based)
  - **Discount** — enter a PLN discount amount when selling a membership; the final price is shown in real time
  - **Edit purchased membership** — change dates, remaining entries, status, price, payment method, and notes on any existing membership
  - **Time limit for entry-based memberships** — optionally set a day limit alongside entry count (e.g. 12 entries *or* 30 days, whichever comes first)
- Check-in flow with membership validation
- POS sales for products with stock updates
- Admin inventory management
- Sales and membership reports (admin-only)
- User management (admin-only)

## Tech Stack

- Next.js 15 (App Router)
- React 19
- NextAuth v5 (credentials provider)
- Prisma + PostgreSQL
- TypeScript

## Requirements

- Node.js 20+
- npm
- PostgreSQL (local or cloud, e.g. Neon)

## Docker Development

The easiest way to get started — no local PostgreSQL required.

**Prerequisites:** Docker and Docker Compose.

1. Start the dev environment (Next.js with hot reload + PostgreSQL):

```bash
npm run docker:dev
# or:
docker compose --profile dev up dev db
```

2. Seed demo data (once the app is running):

```bash
npm run db:seed
# or:
curl http://localhost:3000/api/seed
```

The app is available at `http://localhost:3000`. Source files are mounted into the container so any change triggers an instant hot reload — no rebuild needed.

Seed users:

- `admin` / `admin_dev_2024` (`ADMIN`)
- `recepcja` / `recepcja_dev_2024` (`RECEPTION`)

> PostgreSQL is exposed on port `5433` (to avoid conflicts with a local instance on `5432`).

To run the **production build** in Docker instead:

```bash
docker compose up --build
```

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL` - Prisma runtime connection
- `AUTH_SECRET` - NextAuth secret

Also present in `.env.example`:

- `DATABASE_URL_UNPOOLED` - optional (provider-dependent; not directly used by app code)

## Local Development

The app uses a local PostgreSQL database for development (separate from production).

1. Install dependencies:

```bash
npm install
```

2. Make sure local PostgreSQL is running and create the dev database:

```bash
brew services start postgresql@18
createdb athletic_dev
```

3. Set `DATABASE_URL` in `.env.local` to the local database:

```
DATABASE_URL=postgresql://YOUR_USER@localhost:5432/athletic_dev
```

4. Run migrations:

```bash
npm run db:migrate:dev
```

5. Start the app:

```bash
npm run dev
```

6. Seed demo data:

```bash
curl http://localhost:3000/api/seed
```

Local seed users:

- `admin` / `admin_dev_2024` (`ADMIN`)
- `recepcja` / `recepcja_dev_2024` (`RECEPTION`)

## Testing

Tests are written with [Vitest](https://vitest.dev/) and cover the server action layer (business logic, validation, RBAC). All external dependencies — Prisma, NextAuth, and Next.js cache — are mocked so tests run without a database or Next.js runtime.

### Running tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Test files

| File                                    | Covers                                                       |
| --------------------------------------- | ------------------------------------------------------------ |
| `src/__tests__/members.test.ts`         | Member CRUD, primary membership selection logic              |
| `src/__tests__/checkin.test.ts`         | Check-in search, visit registration (TIME / ENTRY / expired) |
| `src/__tests__/memberships.test.ts`     | Membership sale, endDate / entry calculation, history record |
| `src/__tests__/pos.test.ts`             | Sale processing, total calculation, stock decrement          |
| `src/__tests__/users.test.ts`           | User CRUD, role validation, password hashing, RBAC guard     |
| `src/__tests__/membershipTypes.test.ts` | Membership type creation / deletion, RBAC guard              |

## Scripts

- `npm run dev` - start development server (local)
- `npm run build` - `prisma generate` + `next build`
- `npm run start` - start production server
- `npm run lint` - run ESLint
- `npm run test` - run tests
- `npm run test:watch` - run tests in watch mode
- `npm run test:coverage` - run tests with coverage report
- `npm run db:migrate:deploy` - apply Prisma migrations (production)
- `npm run db:seed` - seed demo data into the running app
- `npm run docker:dev` - start dev environment in Docker (hot reload + PostgreSQL)
- `npm run docker:seed` - seed demo data via Docker
- `npm run vercel-build` - `prisma migrate deploy` + `prisma generate` + `next build`

## Deployment (Vercel + PostgreSQL/Neon)

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Configure environment variables in Vercel (`DATABASE_URL`, `AUTH_SECRET`, and optionally `DATABASE_URL_UNPOOLED`).
4. Use `npm run vercel-build` as the build command (if you override defaults).

To sync Vercel env vars locally:

```bash
vercel env pull .env.development.local
```

## Notes

- Prisma schema and migrations are configured for PostgreSQL.
- Middleware protects all non-public routes and redirects unauthenticated users to `/login`.
