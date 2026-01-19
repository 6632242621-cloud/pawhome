// Reset Password Script
const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function resetPassword() {
    try {
        // ระบุ username หรือ email ของ account ที่ต้องการ reset
        const username = process.argv[2]; // รับจาก command line
        const newPassword = process.argv[3] || '123456'; // รหัสผ่านใหม่ (default: 123456)
        
        if (!username) {
            console.log('❌ กรุณาระบุ username หรือ email');
            console.log('📝 วิธีใช้: node reset_password.js <username/email> [new_password]');
            console.log('📝 ตัวอย่าง: node reset_password.js admin 123456');
            process.exit(1);
        }
        
        // ตรวจสอบว่า user มีอยู่จริง
        const [users] = await pool.query(
            'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        
        if (users.length === 0) {
            console.log(`❌ ไม่พบ user: ${username}`);
            process.exit(1);
        }
        
        const user = users[0];
        
        // Hash รหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // อัพเดทในฐานข้อมูล
        await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        console.log('✅ รีเซ็ตรหัสผ่านสำเร็จ!');
        console.log(`👤 Username: ${user.username}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 รหัสผ่านใหม่: ${newPassword}`);
        console.log('');
        console.log('💡 สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    }
}

// รันฟังก์ชัน
resetPassword();
