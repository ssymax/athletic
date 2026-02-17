# Athletic Club

System recepcji klubu sportowego (Next.js + NextAuth + Prisma).

## Wymagania

- Node.js 20+
- npm
- baza PostgreSQL (np. Neon)

## Lokalne uruchomienie

1. Skopiuj zmienne środowiskowe:

```bash
cp .env.example .env
```

2. Uzupełnij `DATABASE_URL` i `AUTH_SECRET` w `.env`.

3. Zainstaluj zależności:

```bash
npm install
```

4. Wdróż migracje:

```bash
npm run db:migrate:deploy
```

5. Uruchom aplikację:

```bash
npm run dev
```

## Deploy: GitHub + Vercel + Neon

1. Wypchnij repo na GitHub i podłącz projekt w Vercel.
2. Dodaj integrację bazy w Neon i ustaw env w Vercel.
3. Pobierz env lokalnie:

```bash
vercel env pull .env.development.local
```

4. (Opcjonalnie) doinstaluj pakiet Neon, jeśli chcesz używać bezpośredniego drivera Neon:

```bash
npm install @neondatabase/serverless
```

Przy samym Prisma ten pakiet nie jest wymagany.

5. Build command w Vercel ustaw na:

```bash
npm run vercel-build
```

`vercel-build` uruchamia:
- `prisma migrate deploy`
- `prisma generate`
- `next build`

## Uwaga o migracjach

Repo jest przygotowane pod PostgreSQL (Neon). Migracje SQLite zostały zastąpione migracją PostgreSQL.
