#!/bin/bash
# Render build script

echo "🔧 Installing dependencies..."
npm install

echo "🔄 Running database migration..."
node migrate.js

echo "⚙️ Running additional migration..."
node run_migration.js

echo "✅ Build complete!"
