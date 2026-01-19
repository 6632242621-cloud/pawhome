const { Pool } = require('pg');
const config = require('./config');

// สร้าง PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || config.db.connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Wrapper สำหรับ query ให้เหมือน mysql2
pool.query = async function(sql, params) {
    const client = await this.connect();
    try {
        // แปลง ? placeholders เป็น $1, $2, ... สำหรับ PostgreSQL
        let pgSql = sql;
        if (params && params.length > 0) {
            let index = 0;
            pgSql = sql.replace(/\?/g, () => `$${++index}`);
        }
        
        const result = await client.query(pgSql, params);
        // แปลง format ให้เหมือน mysql2 [rows, fields]
        return [result.rows, result.fields];
    } finally {
        client.release();
    }
};

// ทดสอบการเชื่อมต่อ
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ เชื่อมต่อฐานข้อมูล PostgreSQL สำเร็จ');
        client.release();
    } catch (error) {
        console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', error.message);
        process.exit(1);
    }
}

module.exports = {
    pool,
    testConnection
};
