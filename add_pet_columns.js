const { Pool } = require('pg');
const config = require('./config/config');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || config.db.connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function addPetColumns() {
    const client = await pool.connect();
    
    try {
        console.log('Adding new columns to pets table...');
        
        // Add weight column
        await client.query(`
            ALTER TABLE pets 
            ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2)
        `);
        console.log('✓ Added weight column');
        
        // Add health_status column
        await client.query(`
            ALTER TABLE pets 
            ADD COLUMN IF NOT EXISTS health_status TEXT
        `);
        console.log('✓ Added health_status column');
        
        // Add contact_phone column
        await client.query(`
            ALTER TABLE pets 
            ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20)
        `);
        console.log('✓ Added contact_phone column');
        
        // Add location column
        await client.query(`
            ALTER TABLE pets 
            ADD COLUMN IF NOT EXISTS location VARCHAR(100)
        `);
        console.log('✓ Added location column');
        
        // Add tags column if not exists
        await client.query(`
            ALTER TABLE pets 
            ADD COLUMN IF NOT EXISTS tags TEXT
        `);
        console.log('✓ Added tags column');
        
        console.log('✅ All columns added successfully!');
        
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addPetColumns()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
