# Asset Manager - Friend Setup Guide

This guide will help you run the Asset Manager application on your local machine using Docker.

## Prerequisites

Make sure you have Docker and Docker Compose installed on your machine:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

## Files You Should Have Received

1. `asset-mgr-app.tar` - The application Docker image
2. `docker-compose.friend.yml` - Docker configuration file
3. `friend-setup.ps1` - PowerShell setup script (Windows)
4. `init.sql` - Database initialization script
5. This README file

## Quick Setup (Windows PowerShell)

1. Place all files in a folder on your computer
2. Open PowerShell as Administrator
3. Navigate to the folder containing the files:
   ```powershell
   cd "C:\path\to\your\folder"
   ```
4. Run the setup script:
   ```powershell
   .\friend-setup.ps1
   ```

## Manual Setup (All Operating Systems)

### Step 1: Load the Docker Image
```bash
docker load -i asset-mgr-app.tar
```

### Step 2: Pull Required Images
```bash
docker pull postgres:16-alpine
docker pull dpage/pgadmin4:latest
```

### Step 3: Start the Application
```bash
docker-compose -f docker-compose.friend.yml up -d
```

## Accessing the Application

Once everything is running:

- **Asset Manager App**: http://localhost:3000
- **Database Admin (pgAdmin)**: http://localhost:8080
  - Email: admin@admin.com
  - Password: admin

## What You Can Do

The Asset Manager allows you to:
- 📦 **Manage Assets**: Add, edit, and track physical assets
- 🗂️ **Organize Projects**: Create and manage projects
- 🔗 **Link Assets to Projects**: Associate assets with specific projects
- 📍 **View Asset Locations**: See assets on an interactive map
- 📊 **View Statistics**: Dashboard with asset and project insights

## Troubleshooting

### Application Won't Start
1. Check if Docker is running:
   ```bash
   docker --version
   ```
2. Check if containers are running:
   ```bash
   docker-compose -f docker-compose.friend.yml ps
   ```

### Database Connection Issues
Wait a minute after starting - the database needs time to initialize.

### Port Conflicts
If ports 3000 or 8080 are in use, edit `docker-compose.friend.yml` and change:
- `"3000:3000"` to `"YOUR_PORT:3000"` for the app
- `"8080:80"` to `"YOUR_PORT:80"` for pgAdmin

## Stopping the Application

To stop the application:
```bash
docker-compose -f docker-compose.friend.yml down
```

To stop and remove all data:
```bash
docker-compose -f docker-compose.friend.yml down -v
```

## Default Sample Data

The application comes with sample data including:
- 4 sample assets (laptop, chair, monitor, projector)
- 5 sample projects
- Asset-project relationships

You can modify or delete this data once the application is running.

## Need Help?

If you encounter any issues, contact the person who shared this application with you!