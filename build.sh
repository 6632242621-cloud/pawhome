#!/bin/bash
# Render build script

echo "🔧 Installing dependencies..."
npm install

echo "🔄 Running database migration..."
node migrate.js

echo "⚙️ Running additional migration..."
node run_migration.js

echo "👤 Adding profile columns..."
node add_profile_columns.js

echo "🐾 Adding pet columns..."
node add_pet_columns.js

echo "✅ Build complete!"
