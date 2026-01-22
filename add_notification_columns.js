const { pool } = require('./config/database');

async function addNotificationColumns() {
    try {
        console.log('Adding notification columns...');
        
        // เพิ่มคอลัมน์ link
        await pool.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS link VARCHAR(100)
        `);
        console.log('✅ Added link column');
        
        // เพิ่มคอลัมน์ related_like_id
        await pool.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS related_like_id INTEGER
        `);
        console.log('✅ Added related_like_id column');
        
        // เพิ่มคอลัมน์ related_breeding_like_id
        await pool.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS related_breeding_like_id INTEGER
        `);
        console.log('✅ Added related_breeding_like_id column');
        
        console.log('✅ All notification columns added successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addNotificationColumns();
