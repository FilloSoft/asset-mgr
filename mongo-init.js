// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the assetmgr database
db = db.getSiblingDB('assetmgr');

// Create a collection for assets
db.createCollection('assets');

// Insert sample data
db.assets.insertMany([
    {
        name: 'Laptop Dell XPS 13',
        description: 'Development laptop',
        value: 1200.00,
        category: 'Electronics',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Office Chair',
        description: 'Ergonomic office chair',
        value: 350.00,
        category: 'Furniture',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Monitor Samsung 27"',
        description: '4K monitor for development',
        value: 450.00,
        category: 'Electronics',
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for better performance
db.assets.createIndex({ "name": 1 });
db.assets.createIndex({ "category": 1 });
db.assets.createIndex({ "createdAt": 1 });

print('MongoDB initialized with sample assets data');