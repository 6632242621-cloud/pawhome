// Script to check database connection and data
const { Pool } = require('pg');

async function checkDatabase() {
    const databaseUrl = process.argv[2];
    
    if (!databaseUrl) {
        console.log('❌ กรุณาใส่ DATABASE_URL เป็น argument');
        console.log('ตัวอย่าง: node check_database.js "postgresql://user:pass@host/db"');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 กำลังเชื่อมต่อฐานข้อมูล...\n');
        
        // Check connection
        await pool.query('SELECT NOW()');
        console.log('✅ เชื่อมต่อสำเร็จ!\n');
        
        // Check tables
        console.log('📋 ตารางในฐานข้อมูล:');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (tables.rows.length === 0) {
            console.log('❌ ไม่มีตารางใดๆ ในฐานข้อมูล!\n');
            console.log('💡 ต้องรัน migration script ก่อน');
            console.log('   คำสั่ง: node migrate.js\n');
        } else {
            tables.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
            console.log('');
            
            // Check users
            console.log('👥 ผู้ใช้ในระบบ:');
            const users = await pool.query('SELECT id, username, email, role FROM users');
            if (users.rows.length === 0) {
                console.log('❌ ไม่มีผู้ใช้ในระบบ');
            } else {
                users.rows.forEach(user => {
                    console.log(`   - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
                });
            }
        }
        
        console.log('\n✅ เช็คเสร็จสิ้น');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    }
}

checkDatabase();
