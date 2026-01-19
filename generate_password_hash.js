// สร้าง Password Hash สำหรับใส่ในฐานข้อมูล
const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
    // รับรหัสผ่านจาก command line
    const password = process.argv[2];
    
    if (!password) {
        console.log('❌ กรุณาระบุรหัสผ่านที่ต้องการสร้าง hash');
        console.log('');
        console.log('📝 วิธีใช้:');
        console.log('   node generate_password_hash.js <รหัสผ่าน>');
        console.log('');
        console.log('📝 ตัวอย่าง:');
        console.log('   node generate_password_hash.js 123456');
        console.log('   node generate_password_hash.js mySecurePassword');
        console.log('');
        process.exit(1);
    }
    
    try {
        console.log('🔐 กำลังสร้าง password hash...');
        console.log('');
        
        // สร้าง hash (10 rounds)
        const hash = await bcrypt.hash(password, 10);
        
        console.log('✅ สร้าง hash สำเร็จ!');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 รหัสผ่าน:', password);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Password Hash:');
        console.log(hash);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('💡 วิธีใช้:');
        console.log('   1. Copy hash ด้านบน');
        console.log('   2. เปิด phpMyAdmin → เลือก database pawhome_db → ตาราง users');
        console.log('   3. แก้ไขข้อมูล user ที่ต้องการ');
        console.log('   4. วาง hash ลงในคอลัมน์ "password"');
        console.log('');
        console.log('📝 หรือใช้ SQL:');
        console.log(`   UPDATE users SET password = '${hash}' WHERE username = 'ชื่อuser';`);
        console.log('');
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    }
}

// รันฟังก์ชัน
generatePasswordHash();
