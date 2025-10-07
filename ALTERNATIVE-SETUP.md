# Alternative Setup - Build from Source

If the Docker image file is too large to share, your friend can build it themselves:

## Step 1: Get the Source Code
Share these files instead of the tar:
- All source code (the entire project folder)
- `docker-compose.friend.yml` 
- `README-FRIEND.md`

## Step 2: Your Friend Builds Locally
```bash
# Navigate to project folder
cd asset-manager-project

# Build the images
docker-compose build

# Start the application  
docker-compose -f docker-compose.friend.yml up -d
```

This approach requires your friend to have the complete source code but results in a much smaller download.