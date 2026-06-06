# NutriSnap Project Progress

## Current Status

Phase 9 is complete.

## Phase Checklist

- [x] Phase 1: Project setup
- [x] Phase 2: Authentication
- [x] Phase 3: Food upload
- [x] Phase 4: AI food analysis
- [x] Phase 5: Meal logging
- [x] Phase 6: Dashboard
- [x] Phase 7: Analytics
- [x] Phase 8: Production hardening
- [x] Phase 9: Deployment

## Phase 1 Notes

- Established NutriSnap as the application name.
- Aligned the app foundation with Next.js 15 and the App Router.
- Added Prisma PostgreSQL datasource configuration.
- Added reusable Prisma client setup.
- Added typed environment validation with Zod.
- Added Clerk package configuration and root provider wiring.
- Added clean architecture folders under `src`.
- Removed active prototype API routes so later phases can add them cleanly.

## Phase 1 Verification

- `npx prisma generate` passed.
- `npm run lint` passed.
- `npm run build` passed with placeholder environment values.

## Phase 2 Notes

- Added Clerk sign-in and sign-up routes.
- Added protected dashboard and profile routes.
- Added middleware protection for `/dashboard`, `/profile`, and future `/api` routes.
- Added authenticated app header with profile menu.
- Added a server-side `requireCurrentUser` helper for future Server Actions and API routes.
- Updated the landing page to route signed-out users to auth and signed-in users to the dashboard.

## Phase 2 Verification

- `npm run lint` passed.
- `npm run build` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.

## Phase 3 Notes

- Added `@vercel/blob` for image storage.
- Added a protected `/upload` route.
- Added camera, gallery, and drag/drop image selection.
- Added client and server validation for `jpg`, `jpeg`, `png`, and `webp`.
- Enforced a 10MB maximum upload size.
- Added a Server Action that uploads validated food images to Vercel Blob under the authenticated user's path.
- Added upload navigation from the protected app header and dashboard.

## Phase 3 Verification

- `npm run lint` passed.
- `npm run build` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.

## Phase 4 Notes

- Added a server-only OpenAI client.
- Added GPT-4o Vision analysis through the OpenAI Responses API.
- Added strict Structured Outputs JSON schema for food nutrition analysis.
- Added a robust prompt for multiple foods, partial visibility, unclear images, and low confidence cases.
- Added server-side validation for OpenAI analysis output.
- Automatically starts food analysis after a successful Vercel Blob upload.
- Added UI for calories, protein, carbs, fat, fiber, vitamins, estimated weight, and confidence.

## Phase 4 Verification

- `npm run lint` passed.
- `npm run build` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.
- Live OpenAI analysis was not executed because real `OPENAI_API_KEY`, Clerk, and Blob credentials are required.

## Phase 5 Notes

- Added Prisma `Meal` model.
- Added SQL migration for the `Meal` table.
- Stored image URL, food name, calories, protein, carbs, fat, fiber, vitamins, confidence, estimated weight, and AI raw response.
- Added authenticated save meal API: `POST /api/meals`.
- Added authenticated update meal API: `PATCH /api/meals/[id]`.
- Added authenticated delete meal API: `DELETE /api/meals/[id]`.
- Added meal validation schemas with Zod.
- Added Prisma meal persistence helpers.
- Added save meal UI after successful AI analysis.

## Phase 5 Verification

- `npx prisma generate` passed.
- `npm run lint` passed.
- `npm run build` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.
- Database migration was not applied because a live PostgreSQL `DATABASE_URL` was not available in this environment.

## Phase 6 Notes

- Replaced the placeholder dashboard with live saved-meal data.
- Added today totals for calories, protein, carbs, fat, and fiber.
- Added calories/protein chart for meals saved today.
- Added recent meal history with food image, name, timestamp, calories, and macros.
- Added empty states for charts and recent meals.
- Added Prisma query helpers for recent meals and date-range meals.

## Phase 6 Verification

- `npm run lint` passed.
- `npm run build` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.
- Runtime data rendering still requires a migrated PostgreSQL database with saved meals.

## Phase 7 Notes

- Added a protected `/analytics` route.
- Added weekly and monthly reports based on trailing 7-day and 30-day saved meal ranges.
- Added daily calorie and protein trend calculations with zero-filled days.
- Added responsive calorie/protein trend charts.
- Added most eaten foods ranking over the trailing 30 days.
- Added analytics navigation in the authenticated app header.
- Added middleware protection for `/analytics`.

## Phase 7 Verification

- `npm run lint` passed.
- `npm run build` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.
- Runtime analytics rendering still requires a migrated PostgreSQL database with saved meals.

## Phase 8 Notes

- Added active-path structured server logging.
- Added in-memory rate limiting for upload, AI analysis, and meal mutation flows.
- Added consistent JSON body parsing errors for API routes.
- Added sanitized server action and API error responses.
- Added retry logic for GPT-4o Vision analysis and client meal-save requests.
- Added protected route error boundary with retry.
- Added loading states for dashboard, upload, and analytics routes.
- Added security headers through Next.js config.
- Added Vercel Blob image host support and removed global image unoptimization.
- Optimized Prisma meal reads to select only the fields needed by UI and API responses.

## Phase 8 Verification

- `npm run lint` passed.
- `npm run build` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.
- Runtime verification still requires real Clerk, PostgreSQL, OpenAI, and Vercel Blob credentials.

## Phase 9 Notes

- Added Vercel deployment configuration.
- Added Prisma `DIRECT_URL` support for Supabase migration/admin connections.
- Added deployment-focused npm scripts for Prisma generation, migration deploy, local migration, Studio, and preflight checks.
- Replaced the default Next.js README with NutriSnap project documentation.
- Added local setup guide.
- Added Vercel deployment guide with environment checklist, Prisma migration workflow, Clerk setup, Blob setup, OpenAI setup, and smoke test steps.
- Expanded `.env.example` with grouped production-ready variable sections.

## Phase 9 Verification

- `npm run deploy:preflight` passed with placeholder Clerk, PostgreSQL, OpenAI, and Blob environment values.
- The previously running local dev server was stopped to release a Windows Prisma query-engine file lock before rerunning preflight.
- Production deployment still requires real Vercel, Clerk, PostgreSQL, OpenAI, and Vercel Blob credentials.

## Next Step

All planned MVP phases are complete.

## Post-Deployment Fixes

- Verified the production Blob upload issue was not caused by token shape or public-store access.
- Updated `/api/upload` so Clerk authentication is required only while generating a browser upload token.
- Allowed Vercel Blob upload-completed callbacks to reach `handleUpload` without Clerk browser cookies.
- Narrowed middleware API protection to meal API routes so the Blob upload route can handle both authenticated browser token requests and Vercel Blob callbacks.
