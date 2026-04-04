-- ============================================
-- Migration: Create review_phases table
-- ============================================

CREATE TABLE IF NOT EXISTS review_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Complete', 'Skipped', 'Resolved', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE review_phases ENABLE ROW LEVEL SECURITY;

-- Basic policy: allow authenticated users to read access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'review_phases' AND policyname = 'Allow authenticated read access'
    ) THEN
        CREATE POLICY "Allow authenticated read access" ON review_phases
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'review_phases' AND policyname = 'Allow authenticated manage access'
    ) THEN
        CREATE POLICY "Allow authenticated manage access" ON review_phases
            FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- Add updated_at trigger if moddatetime extension exists (optional)
-- CREATE TRIGGER handle_updated_at BEFORE UPDATE ON review_phases 
-- FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
