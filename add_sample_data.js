// Add sample data to production database
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function addSampleData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔄 Adding sample data to database...');
        
        // Read SQL file
        const sqlPath = path.join(__dirname, 'sample_data_postgresql.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute SQL
        await pool.query(sql);
        
        console.log('✅ Sample data added successfully!');
        console.log('\n📝 Test accounts (password for all: password123):');
        console.log('   - owner1@test.com (Pet Owner)');
        console.log('   - owner2@test.com (Pet Owner)');
        console.log('   - care1@test.com (Caregiver)');
        console.log('   - biz1@test.com (Business)');
        console.log('\n🐾 Added 6 sample pets');
        console.log('🏥 Added 4 sample services');
        console.log('💕 Added 2 breeding pets\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to add sample data:', error.message);
        process.exit(1);
    }
}

addSampleData();
