# NutriSnap Local Setup

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database
- Clerk application
- Gemini API key
- Optional OpenRouter API key for final AI fallback
- Vercel Blob token

## 1. Install Dependencies

```bash
npm ci
```

## 2. Configure Environment

Copy the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set these values in `.env.local`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-2.5-flash-lite"
GEMINI_FALLBACK_MODEL="gemini-2.5-flash"
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="google/gemma-4-26b-a4b-it:free"
NUTRISNAP_BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Prepare Database

Generate Prisma Client:

```bash
npm run db:generate
```

Apply local migrations:

```bash
npm run db:migrate:dev
```

## 4. Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## 5. Verify Before Deployment

```bash
npm run deploy:preflight
```

This runs linting and a production build.

## Notes

- Protected dashboard and analytics pages require `DATABASE_URL`.
- Prisma migrations require `DIRECT_URL`.
- Upload and analysis require valid Clerk, Vercel Blob, and Gemini credentials. OpenRouter is optional for fallback coverage.
- The app uses an in-memory rate limiter. It is suitable for MVP hardening but resets between serverless instances.
