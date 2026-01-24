const { pool } = require('../config/database');

async function runMigration() {
    try {
        console.log('🔄 Running migration: Add status column to likes tables...');
        
        // Add status to pet_likes
        await pool.query(`
            ALTER TABLE pet_likes 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
            CHECK (status IN ('pending', 'accepted', 'rejected'))
        `);
        
        // Add status to breeding_likes
        await pool.query(`
            ALTER TABLE breeding_likes 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
            CHECK (status IN ('pending', 'accepted', 'rejected'))
        `);
        
        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_pet_likes_status ON pet_likes(status)
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_breeding_likes_status ON breeding_likes(status)
        `);
        
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

module.exports = { runMigration };
