# NutriSnap

NutriSnap is a production-ready MVP for AI-powered food image analysis and meal tracking. Users upload a food photo, Gemini Vision estimates nutrition, and saved meals update dashboard and analytics views.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Clerk authentication
- PostgreSQL with Prisma
- Google Gemini Vision with optional OpenRouter fallback
- Vercel Blob storage
- Vercel deployment

## Features

- Clerk sign up, sign in, user profile, and protected routes
- Camera, gallery, and drag/drop image upload
- Vercel Blob image storage with file type and size validation
- Gemini food analysis with structured JSON output and provider fallback
- Meal save, update, and delete APIs
- Dashboard with today's totals and recent meals
- Weekly/monthly analytics with nutrition trends and most eaten foods
- Rate limiting, security headers, loading states, retry handling, and sanitized errors

## Local Setup

See [SETUP.md](./SETUP.md) for local development setup.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment, Prisma migration, and environment setup.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run db:migrate:dev
npm run db:migrate:deploy
npm run deploy:preflight
```

## Required Environment Variables

Copy `.env.example` to `.env.local` for local development and configure the same required variables in Vercel:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `GEMINI_API_KEY`
- `NUTRISNAP_BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_APP_URL`

## Optional AI Fallback Variables

- `GEMINI_MODEL` defaults to `gemini-2.5-flash-lite`
- `GEMINI_FALLBACK_MODEL` defaults to `gemini-2.5-flash`
- `OPENROUTER_API_KEY` enables the OpenRouter fallback provider
- `OPENROUTER_MODEL` defaults to `google/gemma-4-26b-a4b-it:free`
