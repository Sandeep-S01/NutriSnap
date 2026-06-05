# NutriSnap Local Setup

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database
- Clerk application
- OpenAI API key with access to GPT-4o
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
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"
OPENAI_API_KEY="sk-..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
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
- Upload and analysis require valid Clerk, Vercel Blob, and OpenAI credentials.
- The app uses an in-memory rate limiter. It is suitable for MVP hardening but resets between serverless instances.
