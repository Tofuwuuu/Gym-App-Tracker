# Gym App Tracker

Full-stack gym workout tracker inspired by **Strong** and **Hevy**: fast set logging, routine templates, history, progress charts (volume / estimated 1RM / PRs), exercise library, and a lightweight social feed.

## Stack (free-tier friendly)

| Layer | Tech | Host |
| --- | --- | --- |
| App (UI + API) | Next.js (App Router) + TypeScript | [Vercel](https://vercel.com) Hobby |
| Database | PostgreSQL + Prisma | [Railway](https://railway.app) |
| Auth | Auth.js (NextAuth v5) — email/password + optional Google | — |
| UI | Tailwind CSS + shadcn/ui | — |
| Charts | Recharts | — |

## Features

- Sign up / sign in (credentials; Google if env vars set)
- Exercise library (~50 seeded moves) + custom exercises
- Routine builder (save & reuse templates)
- Active workout logging with rest timer
- Workout history + detail views
- Progress: volume chart, estimated 1RM, personal records
- Social: profiles, follow/unfollow, feed, likes

## Run with Docker

Requires Docker Desktop.

```bash
docker compose up --build
```

App: [http://localhost:3000](http://localhost:3000)  
Postgres: `localhost:5432` (`postgres` / `postgres` / `gymtracker`)

On boot the web container runs `prisma migrate deploy` and seeds the exercise library.

```bash
docker compose down          # stop
docker compose down -v       # stop and wipe DB volume
docker compose logs -f web   # follow app logs
```


### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — Railway Postgres connection string (or local Postgres)
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local
- Optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### 3. Database migrate + seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Or without migration history during early scaffolding:

```bash
npm run db:push
npm run db:seed
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Railway Postgres

1. Create a project at [railway.app](https://railway.app)
2. Add a **PostgreSQL** service
3. Copy the `DATABASE_URL` (or `DATABASE_PUBLIC_URL`) into your local `.env` and Vercel env vars
4. Run migrations against that database:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` / `AUTH_URL` (your Vercel URL, e.g. `https://your-app.vercel.app`)
   - Optional Google OAuth credentials (set redirect URI to `https://your-app.vercel.app/api/auth/callback/google`)
4. Deploy

You can also connect Railway to Vercel via the [Railway integration](https://vercel.com/marketplace/railway) so `DATABASE_URL` is injected automatically.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run build` | Generate Prisma client + production build |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:push` | Push schema without migration files |
| `npm run db:seed` | Seed starter exercise library |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
prisma/           # schema + seed
src/app/(auth)/   # sign-in / sign-up
src/app/(app)/    # dashboard, workout, routines, history, progress, exercises, feed, profile
src/components/   # UI, workout, charts, social
src/lib/          # auth, db, validations, server actions
```

## Notes

- Estimated 1RM uses the Epley formula: `weight × (1 + reps/30)`
- Warmup sets are excluded from volume calculations when marked as warmup
- Completed workouts from users you follow appear on `/feed`
