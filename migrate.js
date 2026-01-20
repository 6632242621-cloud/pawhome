// Database migration script for Render deployment
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔄 Starting database migration...');
        
        // Read SQL file
        const sqlPath = path.join(__dirname, 'database_postgresql.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute SQL
        await pool.query(sql);
        
        console.log('✅ Database migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
