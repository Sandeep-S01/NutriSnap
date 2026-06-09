# NutriSnap Deployment Guide

## Deployment Target

NutriSnap is prepared for deployment on Vercel with:

- Next.js App Router
- PostgreSQL accessed through Prisma
- Clerk authentication
- Google Gemini Vision with optional OpenRouter fallback
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
| `GEMINI_API_KEY` | Yes | Google AI Studio Gemini API key. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash-lite`. |
| `GEMINI_FALLBACK_MODEL` | No | Defaults to `gemini-2.5-flash`. |
| `OPENROUTER_API_KEY` | No | Enables OpenRouter as the final free vision fallback provider. |
| `OPENROUTER_MODEL` | No | Defaults to `google/gemma-4-26b-a4b-it:free`. |
| `NUTRISNAP_BLOB_READ_WRITE_TOKEN` | Yes | Public Vercel Blob read/write token for this app. |
| `NEXT_PUBLIC_APP_URL` | Yes | Production app URL, for example `https://your-domain.com`. |

## Database Migration

Before routing production traffic to a deployment, apply Prisma migrations against the production database:

```bash
npm run db:migrate:deploy
```

For Vercel deployments, run this command from a trusted local machine or CI job that has the production `DATABASE_URL` and `DIRECT_URL`.

## Neon Postgres Connection Strings

Use Neon's pooled connection for runtime traffic and the direct connection for Prisma migrations:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

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

Create a public Vercel Blob store and add the generated read/write token as `NUTRISNAP_BLOB_READ_WRITE_TOKEN` in the Vercel project environment variables.

Uploaded food images are stored under:

```text
users/{clerkUserId}/food-images/{uuid}-{filename}
```

## AI Provider Configuration

Set `GEMINI_API_KEY` in Vercel. The app tries AI analysis in this order:

1. `GEMINI_MODEL`, default `gemini-2.5-flash-lite`
2. `GEMINI_FALLBACK_MODEL`, default `gemini-2.5-flash`
3. `OPENROUTER_MODEL`, default `google/gemma-4-26b-a4b-it:free`, only when `OPENROUTER_API_KEY` is configured

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
- `NUTRISNAP_BLOB_READ_WRITE_TOKEN` is present.
- Gemini key is present and has quota available.
- Optional OpenRouter key is present if fallback coverage is required.

## Post-Deployment Smoke Test

After deployment:

1. Visit the production URL.
2. Sign up with Clerk.
3. Open `/upload`.
4. Upload a `jpg`, `jpeg`, `png`, or `webp` image under 10MB.
5. Confirm AI analysis returns nutrition data.
6. Save the meal.
7. Confirm `/dashboard` updates today's totals.
8. Confirm `/analytics` shows weekly/monthly trends.

## Known MVP Operational Notes

- Rate limiting is in-memory and resets per serverless instance.
- Runtime observability currently uses structured console logs. Connect a production log drain or monitoring provider from Vercel for long-term retention.
- Error monitoring is represented by route error boundaries and structured logs in this MVP phase.
