<!-- 7f689799-a0dc-4bed-aa19-c013bb17784f e6361d58-df7b-4fa6-96bf-7ed46c088763 -->

# Supabase Data Integration Plan

## 1. Establish Supabase data access layer

- Add a server-safe helper beside `src/lib/supabaseClient.ts` (e.g. `src/lib/supabase/server.ts`) that instantiates a Supabase client using a service role key or server component context as needed.
- Sketch typed query builders for `projects`, `reviews`, and `documents` aligned with `src/lib/db/schema.dbml` so the rest of the app consumes consistent shapes.

## 2. Replace mock `projects` data usage

- Update `src/lib/mock/projects.ts` consumers (`src/app/dashboard/page.tsx`, `src/app/projects/page.tsx`, `src/app/projects/[id]/page.tsx`, and dependent components in `src/components/projects/`) to fetch data from the new Supabase helpers in server components.
- Adjust props for downstream components (`ProjectSummaryHeader`, `ProjectReviewsList`, `IssuesTable`, etc.) to accept the Supabase-backed types and remove mock-only fields or derive them on the fly.

## 3. Load review + document details from Supabase

- Refactor `src/app/reviews/[id]/page.tsx` and `src/app/reviews/[id]/documents/[docId]/page.tsx` to call the Supabase data layer, replacing `getReviewDetailById` and related mock lookups.
- Update `src/components/reviews/review-details-view.tsx` (and subcomponents) to work with the Supabase payloads, adding any necessary loading/error states.

## 4. Remove or gate remaining mock data utilities

- Delete or feature-flag the mock modules in `src/lib/mock/` so they no longer drive production data.
- Verify pages still render with Supabase seeded data and document any required environment variables for local development.

### To-dos

- [ ] Create server-ready Supabase helper and typed query functions for projects, reviews, documents.
- [ ] Switch project listing/summary pages and components to use Supabase queries instead of mock data.
- [ ] Refactor review detail and document routes/components to load from Supabase data layer.
- [ ] Remove mock data modules and update docs/env guidance after Supabase wiring is verified.
