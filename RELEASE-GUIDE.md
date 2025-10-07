# Release Guide

This guide explains how to create a GitHub release for the Asset Manager application that your friends can easily use.

## 🚀 Quick Release (Automated)

### Method 1: GitHub Actions (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for release"
   git push
   ```

2. **Go to GitHub Actions**:
   - Navigate to your repository on GitHub
   - Click on "Actions" tab
   - Click "Build and Release Asset Manager"
   - Click "Run workflow"
   - Enter version (e.g., `v1.0.0`)
   - Click "Run workflow"

3. **Wait for completion** (5-10 minutes)
   - The workflow will build, package, and create a release automatically
   - Downloads will be available on the Releases page

### Method 2: Git Tag Trigger

1. **Create and push a tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Automatic release**:
   - GitHub Actions will automatically trigger
   - Release will be created with downloads

## 🛠️ Manual Release (Local Build)

### Preparation

1. **Run the preparation script**:
   ```powershell
   .\prepare-release.ps1 -Version "v1.0.0"
   ```

2. **Test the release locally**:
   - Extract the created ZIP file
   - Run `friend-setup.ps1` to test
   - Verify everything works

### Create GitHub Release

1. **Create a Git tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Go to GitHub**:
   - Navigate to your repository
   - Click "Releases" → "Create a new release"
   - Select the tag you created
   - Add release title: "Asset Manager v1.0.0"

3. **Add description**:
   ```markdown
   # Asset Manager v1.0.0
   
   A complete asset management system with interactive maps and project tracking.
   
   ## Quick Start
   
   ### Windows Users
   1. Download `asset-manager-v1.0.0.zip`
   2. Extract all files
   3. Run `friend-setup.ps1` as Administrator
   4. Open http://localhost:3000
   
   ### Linux/Mac Users
   1. Download `asset-manager-v1.0.0.tar.gz`
   2. Extract and run `./setup.sh`
   3. Open http://localhost:3000
   
   ## Features
   - 🗺️ Interactive asset mapping
   - 📊 Project management dashboard
   - 🔗 Asset-project relationships
   - 📱 Responsive web interface
   ```

4. **Upload files**:
   - Drag and drop the ZIP and TAR.GZ files
   - Upload checksums.txt file

5. **Publish release**

## 📦 What Gets Packaged

Your release includes everything your friend needs:

### Core Files
- **Docker image** (`asset-mgr-app-v1.0.0.tar`) - Your application
- **docker-compose.yml** - Simplified configuration
- **init.sql** - Database with sample data

### Setup Scripts
- **friend-setup.ps1** - Windows PowerShell setup
- **setup.bat** - Windows batch file setup  
- **setup.sh** - Linux/Mac shell script

### Documentation
- **README.md** - Complete setup guide
- **QUICK-SETUP.md** - Quick start instructions
- **VERSION.txt** - Version and build info

## 🎯 Friend Experience

Your friend will:

1. **Download** one file (ZIP or TAR.GZ)
2. **Extract** to a folder
3. **Run** setup script
4. **Access** the app at localhost:3000

That's it! No complex configuration needed.

## 🔧 Troubleshooting

### Build Issues
- Make sure Docker is running
- Check that all files exist
- Verify no syntax errors in configs

### GitHub Actions Issues  
- Check repository secrets are set
- Verify GITHUB_TOKEN permissions
- Look at Actions logs for errors

### Release Issues
- Ensure tag format is `v1.0.0`
- Check file upload size limits
- Verify release permissions

## 📋 Release Checklist

Before creating a release:

- [ ] Test application locally
- [ ] Update version numbers
- [ ] Test friend-setup.ps1 script
- [ ] Verify all files are included
- [ ] Check docker-compose.friend.yml works
- [ ] Test on clean system if possible
- [ ] Update documentation
- [ ] Create descriptive release notes

## 🚀 Pro Tips

1. **Test releases** on different systems when possible
2. **Use semantic versioning** (v1.0.0, v1.1.0, v2.0.0)
3. **Include changelog** in release notes
4. **Provide screenshots** in release description
5. **Tag stable releases** for easy finding

## 📞 Support

If your friend has issues:
1. Check the included README.md
2. Verify system requirements
3. Check Docker installation
4. Look at container logs: `docker-compose logs`

---

**Ready to share your awesome asset manager!** 🎉