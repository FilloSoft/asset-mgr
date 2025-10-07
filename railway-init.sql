-- Railway PostgreSQL Initialization Script
-- This creates the basic schema for Asset Manager

-- Create the users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

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
CREATE INDEX IF NOT EXISTS assets_name_idx ON assets(name);
CREATE INDEX IF NOT EXISTS assets_status_idx ON assets(status);
CREATE INDEX IF NOT EXISTS assets_location_idx ON assets USING GIN(location);
CREATE INDEX IF NOT EXISTS projects_name_idx ON projects(name);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);

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

-- Insert sample data for Railway deployment
INSERT INTO projects (id, name, description, status, start_date) VALUES
    ('123e4567-e89b-12d3-a456-426614174001', 'Railway Demo Project', 'Sample project for Railway deployment', 'active', CURRENT_DATE),
    ('123e4567-e89b-12d3-a456-426614174002', 'Asset Tracking Initiative', 'Track and manage company assets', 'planning', CURRENT_DATE + INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assets (id, name, description, location, status) VALUES
    ('456e7890-e89b-12d3-a456-426614174001', 'Railway Server', 'Production server hosted on Railway', '{"lat": 37.7749, "lng": -122.4194}', 'active'),
    ('456e7890-e89b-12d3-a456-426614174002', 'Demo Workstation', 'Development workstation for testing', '{"lat": 40.7128, "lng": -74.0060}', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create relationships
INSERT INTO asset_projects (asset_id, project_id) VALUES
    ('456e7890-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174001'),
    ('456e7890-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174002')
ON CONFLICT (asset_id, project_id) DO NOTHING;