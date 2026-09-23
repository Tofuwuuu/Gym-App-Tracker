# Gym App Tracker

A Strong/Hevy-style workout logger for lifters who want fast set logging, routine templates, and progress charts — a junior software-engineer portfolio project.

Log sets during a session, reuse routines, review history, and follow other lifters. The app runs on your machine with Docker Compose or a local Node and Postgres setup.

## Demo

**Availability: local/Docker only.** There is no live demo URL.

Nothing in this repo points at a production deployment: there is no `vercel.json`, `package.json` has no `homepage`, and the [GitHub repository homepage](https://github.com/Tofuwuuu/Gym-App-Tracker) is empty. Run it locally (below) instead of looking for a public site.

**Screenshots:** none are committed. When you capture the UI, put images in `docs/screenshots/` (for example `docs/screenshots/dashboard.png`). That path is a placeholder only.

### Status

- **Demo:** local Docker Compose or a native `npm run dev` server. No Vercel production URL is published.
- **Railway:** on free and trial tiers, Postgres can sleep after inactivity. The first query after sleep may stall until the database wakes. From a laptop or from Vercel, use Railway’s public URL (`DATABASE_PUBLIC_URL`), not the private network hostname.
- **Auth.js:** email and password work with `AUTH_SECRET` and the database alone. Google sign-in is optional and appears only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.

## Features

- Sign up and sign in with email and password (Google when those env vars are set)
- Exercise library (53 seeded movements) plus custom exercises
- Routine builder to save and reuse templates
- Active workout logging with a rest timer
- Workout history and detail views
- Progress: training-volume chart, estimated 1RM, and personal records
- Dashboard training heatmap
- Social: profiles, follow and unfollow, a feed, and likes

## Stack

Versions match `package.json`.

| Layer | Tech | Intended host |
| --- | --- | --- |
| App (UI + API) | Next.js 16 (App Router), React 19, TypeScript | [Vercel](https://vercel.com) Hobby |
| Database | PostgreSQL, Prisma 6 | [Railway](https://railway.app) |
| Auth | Auth.js (NextAuth v5) — email/password, optional Google | — |
| UI | Tailwind CSS 4, shadcn/ui | — |
| Charts | Recharts 3 | — |

## Setup

Node.js 20+ matches the Docker image. Postgres 16 matches `docker-compose.yml`.

### Option A — Docker Compose

Docker Compose starts the app and Postgres. You do not need a local `.env` for this path; the compose file injects the database URL and a dev `AUTH_SECRET`.

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose v2).
2. From the repo root, build and start both services:

   ```bash
   docker compose up --build
   ```

   Detached equivalent: `npm run docker:up`.

3. Open [http://localhost:3000](http://localhost:3000).
4. Postgres is on `localhost:5432` (`postgres` / `postgres` / `gymtracker`).
5. On boot the web container waits for Postgres, runs `prisma migrate deploy`, and seeds the exercise library.

```bash
docker compose down          # stop
docker compose down -v       # stop and wipe the database volume
docker compose logs -f web   # follow app logs (or npm run docker:logs)
npm run docker:down          # stop via the npm script
```

### Option B — Native

1. Install Node.js 20+ and PostgreSQL 16 (or point `DATABASE_URL` at Railway).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment:

   ```bash
   cp .env.example .env
   ```

   Fill in the variables in the table below. Generate a secret with `openssl rand -base64 32`.

4. Apply the schema and seed the exercise library:

   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

   During early scaffolding, without creating a new migration:

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copied from `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. Local Docker: `postgresql://postgres:postgres@localhost:5432/gymtracker?schema=public`. Railway: the public URL. |
| `AUTH_SECRET` | Yes | Auth.js signing secret (`openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Yes | Public origin. Local: `http://localhost:3000`. |
| `AUTH_URL` | Yes | Same origin as `NEXTAUTH_URL` (Auth.js v5). |
| `AUTH_TRUST_HOST` | Recommended | `true` when the host is forwarded (Docker, Vercel). |
| `GOOGLE_CLIENT_ID` | No | Enables the Google provider when set together with the secret. |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |

Docker Compose overrides `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_URL`, and `AUTH_TRUST_HOST` inside the web container (see `docker-compose.yml`).

## Deploy

These steps describe how to host the app. This repository does not include a live URL — use the origin Vercel assigns after the first deploy.

### Railway (Postgres)

1. Create a project at [railway.app](https://railway.app).
2. Add a **PostgreSQL** service.
3. Copy `DATABASE_URL` or `DATABASE_PUBLIC_URL` into local `.env` and into Vercel.
4. Apply migrations and seed once against that database:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

Free and trial Postgres can sleep when idle. After a cold start, retry the request once the database is awake.

### Vercel (Next.js app)

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Set environment variables:
   - `DATABASE_URL` (Railway public URL)
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` and `AUTH_URL` — the deployment origin Vercel gives you (for example the `*.vercel.app` host shown in the project dashboard)
   - `AUTH_TRUST_HOST` = `true`
   - Optional: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Deploy.
4. If you enable Google, set the OAuth redirect URI to `https://<your-vercel-host>/api/auth/callback/google`.

You can also connect Railway through the [Vercel Railway integration](https://vercel.com/marketplace/railway) so `DATABASE_URL` is injected for you. After it is connected, still set `AUTH_SECRET`, `NEXTAUTH_URL`, and `AUTH_URL` yourself.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a Prisma migration (`prisma migrate dev`) |
| `npm run db:push` | Push the schema without a migration file |
| `npm run db:seed` | Seed the starter exercise library |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | `docker compose up --build -d` |
| `npm run docker:down` | Stop the Compose stack |
| `npm run docker:logs` | Follow web container logs |

## Project structure

```
prisma/           # schema, migrations, seed
src/app/(auth)/   # sign-in / sign-up
src/app/(app)/    # dashboard, workout, routines, history, progress, exercises, feed, profile
src/components/   # UI, workout, charts, social
src/lib/          # auth, db, validations, server actions
```

## Notes

- Estimated 1RM uses the Epley formula: `weight × (1 + reps / 30)`, rounded to one decimal. A one-rep set returns the weight itself (`src/lib/workout-utils.ts`).
- Warmup sets are excluded from volume when `isWarmup` is set. Sets that are not completed are excluded as well.
- Completed workouts from people you follow, plus your own completed workouts, appear on `/feed`.
- Email/password is the default Auth.js provider. Google is registered only when both Google environment variables are present.
- Railway free-tier sleep is called out under [Status](#status). Budget for a cold start after idle time.

## License

[MIT](LICENSE).
