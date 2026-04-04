-- ============================================
-- Migration: Upgrade Workflow and Phase RLS Permissions
-- Description: Ensures "developer" and "org admin" roles have full management access
-- ============================================

-- 1. Ensure RLS is enabled for project_review_phases (it should be, but let's be certain)
ALTER TABLE project_review_phases ENABLE ROW LEVEL SECURITY;

-- 2. Update project_workflows "Allow authenticated manage access" policy
DROP POLICY IF EXISTS "Allow authenticated manage access" ON project_workflows;

CREATE POLICY "Allow authenticated manage access" ON project_workflows
    FOR ALL TO authenticated USING (
        -- Option A: User is explicitly listed as an admin/developer in the project_users table
        EXISTS (
            SELECT 1 FROM project_users 
            WHERE project_users.project_id = project_workflows.project_id 
            AND project_users.user_id = auth.uid()
            AND (LOWER(project_users.role) IN ('admin', 'project admin', 'developer'))
        )
        OR
        -- Option B: User has an administrative/developer role at the organization level for the project's company
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_companies uc ON p.company_id = uc.company_id
            JOIN roles r ON uc.role_id = r.id
            WHERE p.id = project_workflows.project_id
            AND uc.user_id = auth.uid()
            AND LOWER(r.name) IN ('admin', 'organization admin', 'org admin', 'developer')
        )
    );

-- 3. Update project_review_phases "Allow authenticated manage access" policy
DROP POLICY IF EXISTS "Allow authenticated manage access" ON project_review_phases;

CREATE POLICY "Allow authenticated manage access" ON project_review_phases
    FOR ALL TO authenticated USING (
        -- Option A: User is explicitly listed as an admin/developer in the project_users table
        EXISTS (
            SELECT 1 FROM project_users 
            WHERE project_users.project_id = project_review_phases.project_id 
            AND project_users.user_id = auth.uid()
            AND (LOWER(project_users.role) IN ('admin', 'project admin', 'developer'))
        )
        OR
        -- Option B: User has an administrative/developer role at the organization level for the project's company
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_companies uc ON p.company_id = uc.company_id
            JOIN roles r ON uc.role_id = r.id
            WHERE p.id = project_review_phases.project_id
            AND uc.user_id = auth.uid()
            AND LOWER(r.name) IN ('admin', 'organization admin', 'org admin', 'developer')
        )
    );
