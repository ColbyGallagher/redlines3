-- ============================================
-- Migration: Create project_workflows and update project_review_phases
-- ============================================

-- 1. Create project_workflows table
CREATE TABLE IF NOT EXISTS project_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Add workflow_id to project_review_phases
ALTER TABLE project_review_phases ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES project_workflows(id) ON DELETE CASCADE;

-- 3. Migration: Create a default workflow for projects that already have phases
DO $$
DECLARE
    p_id UUID;
    w_id UUID;
BEGIN
    FOR p_id IN SELECT DISTINCT project_id FROM project_review_phases WHERE workflow_id IS NULL
    LOOP
        -- Insert a 'Default Workflow' for the project
        INSERT INTO project_workflows (project_id, name)
        VALUES (p_id, 'Default Workflow')
        RETURNING id INTO w_id;

        -- Link existing phases for this project to the new default workflow
        UPDATE project_review_phases
        SET workflow_id = w_id
        WHERE project_id = p_id AND workflow_id IS NULL;
    END LOOP;
END $$;

-- 4. Enable RLS for project_workflows
ALTER TABLE project_workflows ENABLE ROW LEVEL SECURITY;

-- 5. Policies for project_workflows
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_workflows' AND policyname = 'Allow authenticated read access'
    ) THEN
        CREATE POLICY "Allow authenticated read access" ON project_workflows
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_workflows' AND policyname = 'Allow authenticated manage access'
    ) THEN
        CREATE POLICY "Allow authenticated manage access" ON project_workflows
            FOR ALL TO authenticated USING (
                EXISTS (
                    SELECT 1 FROM project_users 
                    WHERE project_users.project_id = project_workflows.project_id 
                    AND project_users.user_id = auth.uid()
                    -- Note: specific role check happens in code, but we allow all project members with manage permissions
                )
            );
    END IF;
END $$;
