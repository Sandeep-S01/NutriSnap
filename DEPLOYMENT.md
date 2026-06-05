# NutriSnap Deployment Guide

## Deployment Target

NutriSnap is prepared for deployment on Vercel with:

- Next.js App Router
- PostgreSQL accessed through Prisma
- Clerk authentication
- OpenAI GPT-4o Vision
- Vercel Blob storage

## Required Vercel Environment Variables

Configure these variables in Vercel Project Settings for Production, Preview, and Development as needed:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Production PostgreSQL connection string. |
| `DIRECT_URL` | Yes | Direct/session connection used by Prisma migrations. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key. |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Use `/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Use `/sign-up`. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Yes | Use `/dashboard`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | Use `/dashboard`. |
| `OPENAI_API_KEY` | Yes | OpenAI API key. |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob read/write token. |
| `NEXT_PUBLIC_APP_URL` | Yes | Production app URL, for example `https://your-domain.com`. |

## Database Migration

Before routing production traffic to a deployment, apply Prisma migrations against the production database:

```bash
npm run db:migrate:deploy
```

For Vercel deployments, run this command from a trusted local machine or CI job that has the production `DATABASE_URL` and `DIRECT_URL`.

## Supabase Postgres Connection Strings

Use Supabase's connection pooler strings for Vercel:

```bash
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
```

Use the transaction pooler on port `6543` for runtime traffic and the session/direct connection on port `5432` for Prisma migrations.

## Vercel Build Settings

The project includes `vercel.json`:

```json
{
  "framework": "nextjs",
  "installCommand": "npm ci",
  "buildCommand": "npm run build"
}
```

The build script runs:

```bash
prisma generate && next build
```

## Clerk Configuration

In Clerk:

- Add the production domain to allowed origins.
- Configure sign-in URL as `/sign-in`.
- Configure sign-up URL as `/sign-up`.
- Configure fallback redirect URL as `/dashboard`.
- Confirm production keys are used in Vercel.

## Vercel Blob Configuration

Create a Vercel Blob store and add the generated `BLOB_READ_WRITE_TOKEN` to the Vercel project environment variables.

Uploaded food images are stored under:

```text
users/{clerkUserId}/food-images/{uuid}-{filename}
```

## OpenAI Configuration

Set `OPENAI_API_KEY` in Vercel. The app uses GPT-4o Vision through the OpenAI Responses API with strict structured JSON output.

## Preflight Checklist

Run locally before deployment:

```bash
npm run deploy:preflight
```

Confirm:

- `npm run lint` passes.
- `npm run build` passes.
- `npm run db:migrate:deploy` has run against production.
- Vercel environment variables are configured.
- Clerk production domain and redirects are configured.
- Vercel Blob token is present.
- OpenAI key is present and has billing/quota available.

## Post-Deployment Smoke Test

After deployment:

1. Visit the production URL.
2. Sign up with Clerk.
3. Open `/upload`.
4. Upload a `jpg`, `jpeg`, `png`, or `webp` image under 10MB.
5. Confirm GPT-4o analysis returns nutrition data.
6. Save the meal.
7. Confirm `/dashboard` updates today's totals.
8. Confirm `/analytics` shows weekly/monthly trends.

## Known MVP Operational Notes

- Rate limiting is in-memory and resets per serverless instance.
- Runtime observability currently uses structured console logs. Connect a production log drain or monitoring provider from Vercel for long-term retention.
- Error monitoring is represented by route error boundaries and structured logs in this MVP phase.
