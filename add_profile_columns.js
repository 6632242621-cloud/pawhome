const { pool } = require('./config/database');

async function addProfileColumns() {
    try {
        console.log('Adding profile columns to users table...');
        
        // Add name column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS name VARCHAR(100)
        `);
        console.log('✓ Added name column');
        
        // Add bio column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS bio TEXT
        `);
        console.log('✓ Added bio column');
        
        // Add date_of_birth column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS date_of_birth DATE
        `);
        console.log('✓ Added date_of_birth column');
        
        // Add gender column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS gender VARCHAR(10)
        `);
        console.log('✓ Added gender column');
        
        console.log('All profile columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding profile columns:', error);
        process.exit(1);
    }
}

addProfileColumns();
