# Athletic Club

Reception system for a gym/fitness club, built with Next.js, NextAuth, and Prisma.

Originally built as a one-day project.

## Current Scope

- Credential-based login (`ADMIN`, `RECEPTION`)
- Member management (create, edit, deactivate, delete)
- Membership sales (time-based and entry-based)
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
- PostgreSQL database (for example Neon)

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

1. Install dependencies:

```bash
npm install
```

2. Run migrations:

```bash
npm run db:migrate:deploy
```

3. Start the app:

```bash
npm run dev
```

4. Optional: seed demo data:

```bash
curl http://localhost:3000/api/seed
```

Local seed users:

- `admin` / `adminpassword` (`ADMIN`)
- `recepcja` / `password123` (`RECEPTION`)

## Scripts

- `npm run dev` - start development server
- `npm run build` - `prisma generate` + `next build`
- `npm run start` - start production server
- `npm run lint` - run ESLint
- `npm run db:migrate:deploy` - apply Prisma migrations
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

## Production Status

This project is also running in production and is actively used by the real Athletic Fitness Club in Olsztyn, Poland. The club owner reduced software costs, and the developer gets a free gym membership.

## Notes

- Prisma schema and migrations are configured for PostgreSQL.
- Middleware protects all non-public routes and redirects unauthenticated users to `/login`.
