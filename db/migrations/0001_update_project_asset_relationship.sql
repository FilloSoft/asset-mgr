-- Migration: Update projects table to use direct asset relationship
-- This migration removes the many-to-many relationship and adds a direct foreign key

-- Add the new columns to projects table
ALTER TABLE projects 
ADD COLUMN asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
ADD COLUMN assigned_at TIMESTAMP;

-- Migrate existing data from asset_projects junction table
INSERT INTO projects (asset_id, assigned_at)
SELECT 
    ap.asset_id,
    ap.assigned_at
FROM asset_projects ap
JOIN projects p ON ap.project_id = p.id
ON CONFLICT (id) DO UPDATE SET
    asset_id = EXCLUDED.asset_id,
    assigned_at = EXCLUDED.assigned_at;

-- Create index on the new asset_id column
CREATE INDEX projects_asset_idx ON projects(asset_id);

-- Drop the junction table
DROP TABLE IF EXISTS asset_projects;