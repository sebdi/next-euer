# NextEÜR

Minimalist, self-hosted income and expense bookkeeping for German freelancers (Einnahmenüberschussrechnung). Each deployment is a private instance for a single GitHub account.

NextEÜR is not tax software, not an ELSTER product, and not GoBD-certified. You remain responsible for the correctness of your records and for compliance with German tax law.

## Features

- GitHub OAuth with a single allowed numeric GitHub user ID
- PostgreSQL storage via Prisma (no browser or file-based books)
- Create, edit, delete, search, sort, and filter bookings
- Calendar-year selection with exact integer-cent totals (income, expenses, profit/loss)
- CSV import with preview and CSV export (semicolon, UTF-8 BOM)
- Desktop table and mobile list, light and dark theme

## Tech stack

- Next.js App Router, TypeScript, React
- PostgreSQL and Prisma ORM
- Auth.js (NextAuth) with GitHub OAuth
- Zod validation
- Tailwind CSS

## Local development

Requirements: Node.js 20.19+ and a PostgreSQL database.

```bash
git clone <your-fork-url>
cd next-euer
cp .env.example .env
npm install
```

Fill `.env` (see [Environment variables](#environment-variables)). Then:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are sent to `/login`.

```bash
npm test
npm run typecheck
npm run build
```

## PostgreSQL setup

Create an empty database dedicated to this instance, for example:

```sql
CREATE DATABASE nexteuer;
```

Set `DATABASE_URL` to a connection string Prisma can reach. On serverless hosts prefer a pooled URL (Neon pooler, PgBouncer, or similar). Do not reuse a database across unrelated deployments if you want isolation.

Apply schema:

```bash
npx prisma migrate deploy
```

Development iteration:

```bash
npx prisma migrate dev
```

Generate the client (also runs on `npm install` via `postinstall`):

```bash
npx prisma generate
```

## GitHub OAuth setup

1. GitHub → Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers) → New OAuth App.
2. Application name: `NextEÜR` (or your instance name).
3. Homepage URL: `http://localhost:3000` locally, or your production origin.
4. Authorization callback URL:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://YOUR_DOMAIN/api/auth/callback/github`
5. Copy the Client ID and Client Secret into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

Create a separate OAuth app (or additional callback URL) for production.

## Numeric GitHub user ID

Authorization uses the immutable numeric account ID, never the login name or email.

1. Open `https://api.github.com/users/YOUR_USERNAME` while signed in or in a private browser.
2. Read the JSON field `"id"` (a number).
3. Put that value into `GITHUB_ALLOWED_USER_ID`.

Any other GitHub account is rejected. If the variable is missing or not a number, nobody can sign in.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `GITHUB_ALLOWED_USER_ID` | Numeric GitHub user ID allowed to use this instance |
| `AUTH_SECRET` | Session cookie signing secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Optional public origin if Auth.js cannot infer it |

See `.env.example` for comments. Never commit real secrets or financial data.

## Database migrations

```bash
npx prisma migrate deploy    # apply committed migrations
npx prisma migrate dev       # create/apply migrations in development
npx prisma generate          # regenerate Prisma Client
```

## Vercel deployment

Each person who uses NextEÜR should deploy their own project and database. There is no shared backend and no maintainer access to your books.

1. Create a PostgreSQL database (for example Neon on the Vercel Marketplace).
2. Import the Git repository into a new Vercel project.
3. Set the environment variables from `.env.example` for Production (and Preview if you use GitHub OAuth there).
4. Set the build command to:

   ```text
   npx prisma generate && npx prisma migrate deploy && next build
   ```

5. Add the production callback URL to the GitHub OAuth app: `https://YOUR_DOMAIN/api/auth/callback/github`.
6. Deploy. Sign in with the allowlisted GitHub account.

Auth.js uses `trustHost` so it works behind Vercel’s proxy. Session cookies are HTTP-only. Do not enable Vercel Deployment Protection in a way that blocks `/api/auth/*` unless you know how to allow the OAuth callback.

## CSV import and export

Export downloads `nexteuer-YYYY.csv` for the selected calendar year (all bookings of that year, not only the current search). Format:

- UTF-8 with BOM
- Semicolon-separated
- Header: `Art;Konto;Bezeichnung;Datum;Einnahmen;Ausgaben`
- Dates `DD.MM.YYYY`
- German decimal amounts (`1.234,56`)
- Formula-like cells are prefixed so spreadsheet apps do not execute them

Import accepts the same layout. The UI shows a preview with per-row errors. Invalid files are rejected as a whole. Valid rows run in one database transaction. Rows that already exist with the same date, category, account, description, and amounts are skipped.

Imported text is never evaluated as code.

## Security considerations

- Every page, API route, and server action checks the session and the numeric GitHub allowlist on the server.
- There is no public registration. One GitHub ID per deployment.
- Amounts are stored as integer cents (`BIGINT`). Validation uses Zod.
- Prisma parameterizes queries.
- Secrets stay in environment variables. Financial data stays in your database.
- Error messages shown to users do not include stack traces or raw database errors.
- This repository must not contain real bookings or production credentials.

## Limitations and accounting disclaimer

- NextEÜR is a personal record-keeping tool, not a tax advisor and not a DATEV/ELSTER integration.
- It does not calculate VAT, income tax, or category-specific deduction limits.
- Default account numbers are optional placeholders. Align them with your own chart of accounts.
- It does not claim GoBD certification, audit-proof archiving, or automatic legal compliance.
- You are responsible for backups, access to your Vercel/database accounts, and the correctness of your books.

## License

[MIT](./LICENSE)
