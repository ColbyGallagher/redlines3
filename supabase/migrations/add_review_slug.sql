-- ============================================
-- Migration: Add slug column to projects and reviews tables
-- Run this in the Supabase SQL Editor
-- ============================================

-- --------------------------------------------
-- PART 1: Projects Table
-- --------------------------------------------
-- A. Add slug column (nullable first so we can backfill)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug text;

-- B. Backfill existing rows: slugify(project_name) + '-' + first 6 chars of UUID
UPDATE projects
SET slug = CONCAT(
  LOWER(
    TRIM(
      BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(project_name, '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    )
  ),
  '-',
  LEFT(REPLACE(id::text, '-', ''), 6)
)
WHERE slug IS NULL;

-- C. Handle edge case: if project_name was empty/all symbols, set a fallback
UPDATE projects
SET slug = CONCAT('project-', LEFT(REPLACE(id::text, '-', ''), 6))
WHERE slug IS NULL OR slug = '' OR slug = CONCAT('-', LEFT(REPLACE(id::text, '-', ''), 6));

-- D. Make slug NOT NULL and add UNIQUE constraint
ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;
ALTER TABLE projects ADD CONSTRAINT projects_slug_unique UNIQUE (slug);

-- E. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects (slug);


-- --------------------------------------------
-- PART 2: Reviews Table
-- --------------------------------------------
-- 1. Add slug column (nullable first so we can backfill)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS slug text;

-- 2. Backfill existing rows: slugify(review_name) + '-' + first 6 chars of UUID
-- This creates URL-safe slugs like "structural-analysis-a1b2c3"
UPDATE reviews
SET slug = CONCAT(
  LOWER(
    TRIM(
      BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(review_name, '[^a-zA-Z0-9\s-]', '', 'g'),  -- strip special chars
          '\s+', '-', 'g'                                             -- spaces → hyphens
        ),
        '-+', '-', 'g'                                               -- collapse multiple hyphens
      )
    )
  ),
  '-',
  LEFT(REPLACE(id::text, '-', ''), 6)                               -- first 6 hex chars of UUID
)
WHERE slug IS NULL;

-- 3. Handle edge case: if review_name was empty/all symbols, set a fallback
UPDATE reviews
SET slug = CONCAT('review-', LEFT(REPLACE(id::text, '-', ''), 6))
WHERE slug IS NULL OR slug = '' OR slug = CONCAT('-', LEFT(REPLACE(id::text, '-', ''), 6));

-- 4. Make slug NOT NULL and add UNIQUE constraint
ALTER TABLE reviews ALTER COLUMN slug SET NOT NULL;
ALTER TABLE reviews ADD CONSTRAINT reviews_slug_unique UNIQUE (slug);

-- 5. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reviews_slug ON reviews (slug);

-- ============================================
-- Verify the migration
-- ============================================
-- SELECT id, project_name, slug FROM projects LIMIT 10;
-- SELECT id, review_name, slug FROM reviews LIMIT 10;
