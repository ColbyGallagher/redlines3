-- SQL Migration for project_reference_documents

CREATE TABLE project_reference_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_reference_documents ENABLE ROW LEVEL SECURITY;

-- Project members can SELECT
CREATE POLICY "Project members can view reference documents" ON project_reference_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_id = project_reference_documents.project_id
      AND user_id = auth.uid()
    )
  );

-- Project admins can INSERT/DELETE
CREATE POLICY "Project admins can manage reference documents" ON project_reference_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_id = project_reference_documents.project_id
      AND user_id = auth.uid()
      AND (role = 'admin' OR role = 'owner')
    )
  );
