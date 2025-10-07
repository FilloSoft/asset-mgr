# Railway Deployment Guide

## 🚄 **Deploying Asset Manager to Railway**

Railway is perfect for your Asset Manager! Here are the deployment options:

## ✅ **Option 1: App + Railway PostgreSQL (Recommended)**

### **What You Need**

- ✅ Your existing Dockerfile (already perfect!)
- ✅ Railway PostgreSQL service
- ✅ Environment variables configuration

### **Step-by-Step Deployment**

#### **1. Create Railway Project**

1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `asset-mgr` repository

#### **2. Add PostgreSQL Database**

1. In your Railway project dashboard
2. Click **"+ New Service"**
3. Select **"Database"** → **"PostgreSQL"**
4. Railway will create a PostgreSQL instance

#### **3. Configure Environment Variables**

In your Railway app service, add these variables:

```bash
# Database (Railway will provide these)
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway

# App Configuration
NODE_ENV=production
PORT=3000

# Mapbox (if you're using it)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

#### **4. Add Database Initialization**

Railway PostgreSQL starts empty, so we need to initialize it.

**Create**: `railway-init.sql` (simplified version)

```sql
-- Create the assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planning',
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

-- Add some sample data
INSERT INTO projects (id, name, description, status) VALUES
    ('123e4567-e89b-12d3-a456-426614174001', 'Sample Project', 'A sample project for testing', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO assets (id, name, description, location, status) VALUES
    ('456e7890-e89b-12d3-a456-426614174001', 'Sample Asset', 'A sample asset for testing', '{"lat": 40.7128, "lng": -74.0060}', 'active')
ON CONFLICT DO NOTHING;
```

### **Deployment Flow**

```mermaid
graph TD
    A[Push to GitHub] --> B[Railway Detects Changes]
    B --> C[Build using Dockerfile]
    C --> D[Deploy App Service]
    D --> E[Connect to PostgreSQL]
    E --> F[App Live at railway.app URL]

    G[PostgreSQL Service] --> E
    H[Environment Variables] --> D
```

## 🛠️ **Option 2: Everything in Dockerfile (Advanced)**

If you want everything in one container, you'd need to modify your Dockerfile:

```dockerfile
# Multi-service Dockerfile (NOT recommended for Railway)
FROM node:20-alpine

# Install PostgreSQL
RUN apk add --no-cache postgresql postgresql-client

# ... your existing app setup ...

# Add startup script to run both services
COPY start-services.sh /start-services.sh
RUN chmod +x /start-services.sh

CMD ["/start-services.sh"]
```

**But this is NOT recommended because:**

- ❌ Harder to scale
- ❌ Single point of failure
- ❌ Railway prefers microservices
- ❌ Database backups are complex

## 🚀 **Quick Start Commands**

### **Deploy Now (5 minutes)**

```bash
# 1. Push your current code
git add .
git commit -m "Ready for Railway deployment"
git push

# 2. Go to railway.app
# 3. New Project → Deploy from GitHub
# 4. Add PostgreSQL service
# 5. Set environment variables
# 6. Deploy!
```

### **Railway CLI (Alternative)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add --database postgres
railway up
```

## ⚙️ **Environment Variables You'll Need**

### **Required**

```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname
NODE_ENV=production
```

### **Optional**

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx...
PORT=3000
```

### **Railway Auto-Provides**

Railway will automatically provide:

- `DATABASE_URL` (when you add PostgreSQL)
- `PORT` (usually 3000)
- Build and deployment URLs

## 🔧 **Railway-Specific Optimizations**

### **1. Create railway.json (Optional)**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKER"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **2. Add Health Check to Your App**

```typescript
// In your Next.js app (pages/api/health.ts or app/api/health/route.ts)
export async function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

### **3. Optimize Docker for Railway**

Your Dockerfile is already good, but you could optimize:

```dockerfile
# Add this to your existing Dockerfile for better caching
FROM node:20-alpine

# Add package files first (better Docker caching)
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

# Then add source code
COPY . .
RUN pnpm build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000
CMD ["pnpm", "start"]
```

## 💰 **Railway Pricing**

### **Free Tier**

- ✅ $5/month free credit
- ✅ Perfect for testing/personal projects
- ✅ Multiple services included

### **Pro Plan**

- 💳 Pay-as-you-go after free credits
- 📈 Scales automatically
- 🔄 Great for production apps

## 🎯 **Comparison: Railway vs Other Options**

| Platform     | Setup Time | Database           | Scaling | Cost       |
| ------------ | ---------- | ------------------ | ------- | ---------- |
| **Railway**  | 5 min      | ✅ Managed         | Auto    | $5/mo free |
| Vercel       | 2 min      | ❌ External needed | Auto    | Free tier  |
| Heroku       | 10 min     | ✅ Addon           | Manual  | $7/mo      |
| DigitalOcean | 30 min     | 🔧 Setup required  | Manual  | $10/mo     |

## ✅ **Railway Advantages for Your App**

1. **Perfect Dockerfile Support** ✅
2. **Managed PostgreSQL** ✅
3. **Automatic HTTPS** ✅
4. **Environment Variables** ✅
5. **GitHub Integration** ✅
6. **Custom Domains** ✅
7. **Auto-scaling** ✅

## 🚨 **Things to Watch Out For**

### **Database Initialization**

- Railway PostgreSQL starts empty
- You'll need to run your schema migration
- Consider using Drizzle migrations in production

### **Environment Variables**

- Don't commit secrets to GitHub
- Use Railway's environment variable UI
- DATABASE_URL is auto-generated

### **File Storage**

- Railway containers are ephemeral
- Use external storage for uploaded files
- Your app doesn't upload files, so you're good!

## 🎉 **Ready to Deploy?**

Your Asset Manager is **perfectly suited** for Railway deployment!

**Next steps:**

1. Push your code to GitHub
2. Go to railway.app
3. Deploy from GitHub repo
4. Add PostgreSQL service
5. Set environment variables
6. Your app will be live! 🌍

Railway will give you a URL like: `https://your-app-name.up.railway.app`

---

**Railway + Your Dockerfile = Perfect match!** 🚄✨
