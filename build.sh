#!/bin/bash
# Render build script

echo "🔧 Installing dependencies..."
npm install

echo "🔄 Running database migration..."
node migrate.js

echo "✅ Build complete!"
