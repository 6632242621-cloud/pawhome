const mysql = require('mysql2');
const config = require('./config');

// สร้าง connection pool
const pool = mysql.createPool(config.db);

// สร้าง promise wrapper
const promisePool = pool.promise();

// ทดสอบการเชื่อมต่อ
async function testConnection() {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
        connection.release();
    } catch (error) {
        console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', error.message);
        process.exit(1);
    }
}

module.exports = {
    pool: promisePool,
    testConnection
};
