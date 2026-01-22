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

echo "� Adding notification columns..."
node add_notification_columns.js || echo "⚠️ Notification columns may already exist"

echo "�🖼️ Fixing pet images..."
node fix_pet_images.js || echo "⚠️ Fix images failed (may be no invalid images)"

echo "✅ Build complete!"
