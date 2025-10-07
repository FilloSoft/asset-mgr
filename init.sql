-- Create the assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the many-to-many relationship table
CREATE TABLE IF NOT EXISTS asset_projects (
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (asset_id, project_id)
);

-- Create indexes for better performance

-- Asset indexes
CREATE INDEX IF NOT EXISTS assets_name_idx ON assets(name);
CREATE INDEX IF NOT EXISTS assets_status_idx ON assets(status);
CREATE INDEX IF NOT EXISTS assets_created_at_idx ON assets(created_at);
CREATE INDEX IF NOT EXISTS assets_location_idx ON assets USING GIN(location);

-- Project indexes
CREATE INDEX IF NOT EXISTS projects_name_idx ON projects(name);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);

-- Asset-Project relationship indexes
CREATE INDEX IF NOT EXISTS asset_projects_asset_idx ON asset_projects(asset_id);
CREATE INDEX IF NOT EXISTS asset_projects_project_idx ON asset_projects(project_id);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Insert sample projects first
INSERT INTO projects (id, name, description, status, start_date) VALUES
    ('123e4567-e89b-12d3-a456-426614174001', 'Project Alpha', 'Mobile application development project', 'active', '2024-01-15'),
    ('123e4567-e89b-12d3-a456-426614174002', 'Mobile App Development', 'Cross-platform mobile app for asset tracking', 'active', '2024-02-01'),
    ('123e4567-e89b-12d3-a456-426614174003', 'Office Setup', 'Complete office renovation and setup', 'planning', '2024-03-01'),
    ('123e4567-e89b-12d3-a456-426614174004', 'Hardware Upgrade', 'Upgrade all development workstations', 'on-hold', NULL),
    ('123e4567-e89b-12d3-a456-426614174005', 'Display Calibration', 'Calibrate all monitors for accurate colors', 'completed', '2024-01-01')
ON CONFLICT DO NOTHING;

-- Insert sample assets
INSERT INTO assets (id, name, description, location, status) VALUES
    ('456e7890-e89b-12d3-a456-426614174001', 'Laptop Dell XPS 13', 'Development laptop for software engineering team', '{"lat": 40.7128, "lng": -74.0060}', 'active'),
    ('456e7890-e89b-12d3-a456-426614174002', 'Office Chair', 'Ergonomic office chair for workspace comfort', '{"lat": 40.7580, "lng": -73.9855}', 'active'),
    ('456e7890-e89b-12d3-a456-426614174003', 'Monitor Samsung 27"', '4K monitor for development and design work', '{"lat": 40.7505, "lng": -73.9934}', 'maintenance'),
    ('456e7890-e89b-12d3-a456-426614174004', 'Conference Room Projector', 'High-resolution projector for presentations', '{"lat": 40.7614, "lng": -73.9776}', 'inactive')
ON CONFLICT DO NOTHING;

-- Create asset-project relationships
INSERT INTO asset_projects (asset_id, project_id) VALUES
    ('456e7890-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174001'), -- Laptop -> Project Alpha
    ('456e7890-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'), -- Laptop -> Mobile App Development
    ('456e7890-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174003'), -- Office Chair -> Office Setup
    ('456e7890-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174004'), -- Monitor -> Hardware Upgrade
    ('456e7890-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174005')  -- Monitor -> Display Calibration
ON CONFLICT DO NOTHING;