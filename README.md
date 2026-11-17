# NextEÜR

NextEÜR is a small, self-hosted book for a German [Einnahmenüberschussrechnung](https://www.gesetze-im-internet.de/estg/__4.html) (EÜR): the cash-basis record of business income and expenses that many freelancers keep for the year.

You deploy your own copy. One deployment belongs to one person, stores their bookings in their own PostgreSQL database, and lets only one GitHub account sign in. There is no shared server and no access to anyone else's books.

NextEÜR is a personal ledger, not tax software. It does not file with ELSTER, does not replace an accountant, and is not GoBD-certified. You are responsible for your records and for German tax law.

## What you can do

- Sign in with GitHub. Only the numeric GitHub user ID you configure is accepted.
- Keep a home address and a personal marginal tax rate on the profile page. The profile estimates income tax for the selected year as the EÜR profit multiplied by that rate.
- Record income and expenses in whole euro cents, with German category names and an optional account number. While typing, previously used descriptions, accounts, invoice numbers, and route addresses are proposed.
- Switch calendar years and see income, expenses, and profit or loss for the whole year.
- Search, sort, and filter the list. On a desktop you get a table. On a phone you get a list.
- Switch light and dark mode, and blur amounts and personal details when someone is looking at your screen.
- Import and export a year as semicolon-separated CSV.
- For **Bewirtungskosten**, enter the gross amount. The booking stores 70% of it, which is the deductible share, and keeps the gross amount so you can edit it later.
- For **Fahrtkosten**, enter a start and a destination. The app asks a routing service for the driving distance and fills in the amount from a kilometre rate. The default rate is 0,30 €/km. You can mark the trip as a return journey, which doubles that distance. A home address saved in the account menu can be inserted as the start or the destination.

Expenses can use a category: Abschreibungen, Bewirtungskosten, Bürobedarf, Fahrtkosten, Fortbildungen, Homeoffice, Internet und Telefon, Laufende EDV Kosten, Öffentliche und andere, Übernachtungskosten, or Verpflegung. A missing category is marked in the table. Income has no category and can store an optional invoice number. Suggested account numbers are placeholders. Use the chart of accounts you actually keep.

The app does not calculate VAT, income tax, or other deduction limits.

## Deploy on Vercel

Each person deploys a separate Vercel project and a separate database. Fork this repository if you want your own Git history. You can also deploy it directly.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsebdi%2Fnext-euer&env=GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,GITHUB_ALLOWED_USER_ID,AUTH_SECRET,AUTH_URL,HEIGIT_API_KEY&envDescription=GitHub%20OAuth%20credentials%2C%20your%20numeric%20GitHub%20user%20ID%2C%20a%20session%20secret%2C%20the%20public%20site%20URL%2C%20and%20an%20optional%20HeiGIT%20key&envLink=https%3A%2F%2Fgithub.com%2Fsebdi%2Fnext-euer%23environment-variables&project-name=next-euer&repository-name=next-euer)

Connect the database before the first successful build. The build applies database migrations. Without `DATABASE_URL`, that step cannot reach a database and the deployment fails.

### 1. Create the project

Import the repository in the [Vercel dashboard](https://vercel.com/new) or use the button above. Leave the framework as Next.js.

The build command is already set in [`vercel.json`](./vercel.json):

```text
npx prisma generate && npx prisma migrate deploy && next build
```

Keep that command. A plain `next build` skips the migrations, so the app starts against an empty database schema.

### 2. Add PostgreSQL

Create a Postgres database and attach it to the Vercel project. [Neon](https://vercel.com/marketplace/neon) on the Vercel Marketplace does this for you and sets `DATABASE_URL` for Production and Preview.

Use a pooled connection string for the running app. On Neon that is the host that contains `-pooler`. Do not point two unrelated deployments at the same database if you want their books kept apart.

If the first deployment already failed because the database was not connected yet, open the project, confirm `DATABASE_URL` is present, and redeploy.

### 3. Create a GitHub OAuth app

1. Open [GitHub OAuth apps](https://github.com/settings/developers) and create a new app.
2. Homepage URL: your production origin, for example `https://your-project.vercel.app`.
3. Authorization callback URL, exactly:

   ```text
   https://your-project.vercel.app/api/auth/callback/github
   ```

   Use the stable domain people open in the browser. A one-off deployment host such as `your-project-abc123.vercel.app` will not match later visits. If you also use another alias, add that callback URL too.
4. Copy the client ID and generate a client secret.

For local development, add a second callback URL of `http://localhost:3000/api/auth/callback/github`, or create a separate OAuth app. GitHub rejects a login when the callback URL is not registered for the host you are on. The error looks like: "The redirect_uri is not associated with this application."

### 4. Set the environment variables

In the Vercel project, open **Settings → Environment Variables** and set these for Production. Set the same values for Preview only if preview deployments should accept logins. Preview then needs its own callback URL on the OAuth app.

| Variable | What to put there |
|---|---|
| `DATABASE_URL` | Usually filled in by Neon. A pooled Postgres URL. |
| `GITHUB_CLIENT_ID` | Client ID from the OAuth app. |
| `GITHUB_CLIENT_SECRET` | Client secret from the OAuth app. |
| `GITHUB_ALLOWED_USER_ID` | Your numeric GitHub user ID. Digits only, for example `12345678`. |
| `AUTH_SECRET` | A long random string. Create one with `openssl rand -base64 32`. |
| `AUTH_URL` | The public origin, for example `https://your-project.vercel.app`. No path, no trailing slash. |
| `HEIGIT_API_KEY` | Optional. Needed only for driving-distance calculation. |
| `DISTANCE_PROVIDER` | Optional. Leave unset. The default is `heigit`. |

Find the GitHub user ID by opening `https://api.github.com/users/YOUR_USERNAME` and reading the `id` field. Do not use the username or the email address. If `GITHUB_ALLOWED_USER_ID` is missing or contains anything other than digits, nobody can sign in.

`AUTH_URL` must be the same origin as the callback URL you registered. After changing it, redeploy so new logins use that host.

The variable names are `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. Auth.js also documents `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. This project does not read those names.

### 5. Deploy and sign in

Deploy the project, open the production URL, and sign in with the GitHub account whose numeric ID you allowlisted. Every other GitHub account is turned away.

Distance calculation stays disabled until `HEIGIT_API_KEY` is set. Create a free key at [api.heigit.org](https://api.heigit.org/) and copy it from the account dashboard. The key stays on the server. Bookings themselves work without it. You can still type a Fahrtkosten amount by hand.

Do not put Vercel Deployment Protection in front of `/api/auth` unless the OAuth callback can still reach the app. A login wall on the callback breaks GitHub sign-in.

## Run it locally

You need Node.js 20.19 or newer and a PostgreSQL database.

```bash
git clone https://github.com/sebdi/next-euer.git
cd next-euer
cp .env.example .env
npm install
```

Create an empty database, put its URL in `DATABASE_URL`, and fill in the GitHub and `AUTH_SECRET` values from the table above. For a local OAuth callback, register `http://localhost:3000/api/auth/callback/github`. You can omit `AUTH_URL` locally.

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Visitors who are not signed in are sent to `/login`.

To pull the Production variables from a linked Vercel project instead of copying them by hand:

```bash
npx vercel link
npx vercel env pull .env.local
```

Neon does not inject `DATABASE_URL` into the Development environment. A local `.env` still needs a database URL the machine can reach. `vercel env pull` writes secrets to `.env.local`. That file is gitignored. Do not commit it.

```bash
npm test
npm run typecheck
npm run build
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for this instance |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth client secret |
| `GITHUB_ALLOWED_USER_ID` | Yes | Numeric GitHub user ID allowed to sign in |
| `AUTH_SECRET` | Yes | Signs the session cookie |
| `AUTH_URL` | Production | Public origin Auth.js uses for the OAuth callback |
| `HEIGIT_API_KEY` | For distances | Key for the HeiGIT routing API |
| `DISTANCE_PROVIDER` | No | Routing backend. Default: `heigit` |

Comments and empty placeholders are in [`.env.example`](./.env.example). Never commit real secrets or real bookings.

## Fahrtkosten and the routing API

Driving distance goes through the `DistanceProvider` interface in `lib/distance`. Another routing service can be added there without changing the booking form. The included provider geocodes both addresses and requests a `driving-car` route from [HeiGIT](https://api.heigit.org/).

The stored distance is the one-way trip. A return journey doubles that distance when the amount is calculated. The home address is stored on your profile and is only used when you press **Zuhause** on a Fahrtkosten booking.

## CSV import and export

Export downloads `nexteuer-YYYY.csv` for the selected calendar year. It includes every booking of that year, including ones hidden by the current search.

- UTF-8 with a byte-order mark
- Semicolon-separated
- Header: `Art;Konto;Bezeichnung;Datum;Einnahmen;Ausgaben;Rechnungsnummer`
- `Rechnungsnummer` may be omitted on import and is stored only for income. Leave `Art` empty for income, or for an expense without a category. Older files that used `Nutzungseinnahme` for income are still accepted. An unknown category is rejected.
- Dates as `DD.MM.YYYY`
- Amounts in German decimal notation, such as `1.234,56`
- Cells that look like spreadsheet formulas are prefixed so the spreadsheet does not execute them

Import accepts a comma, semicolon, or tab-separated file. In the dialog, map its columns to the booking fields. Bezeichnung and Datum are required, plus either a Betrag column or separate Einnahmen and Ausgaben columns. A positive Betrag is income and a negative Betrag is an expense. Art, Konto, and Rechnungsnummer are optional. The first row is treated as column names unless you turn that off. The export layout above is recognized automatically. The dialog shows a preview and marks invalid rows. If any row is invalid, nothing is imported. Valid rows are written in one database transaction. A row that already exists with the same date, category, account, description, and amounts is skipped. Imported text is stored as text and is never evaluated as code.

The 70% Bewirtungskosten reduction applies when you enter a booking in the form. A CSV import stores the amounts in the file as they are.

## Security

- Pages, the export route, and server actions check the session on the server and allow only the configured GitHub user ID.
- There is no public registration and no second user.
- Money is stored as integer cents in `BIGINT`. Inputs are checked with Zod.
- Database queries go through Prisma.
- Secrets belong in environment variables. Bookings belong in your database.
- Errors shown in the app do not include stack traces or raw database messages.
- This repository must not contain real bookings or production credentials.

## Limits

- NextEÜR does not give tax advice and does not connect to DATEV or ELSTER.
- It does not calculate VAT, income tax, or deduction limits other than the 70% Bewirtungskosten share entered in the form.
- It does not claim GoBD certification or audit-proof archiving.
- You keep your own backups and your own access to Vercel, GitHub, and the database.

## License

[MIT](./LICENSE)
