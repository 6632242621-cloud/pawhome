-- ไฟล์สำหรับ reset รหัสผ่าน admin เป็น "123456"
-- รหัสผ่านนี้ถูก hash ด้วย bcrypt (10 rounds)

UPDATE users 
SET password = '$2y$10$S92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/og/at2.uheWG/igi'
WHERE username = 'admin';

-- หากต้องการ reset user อื่น ให้เปลี่ยน WHERE clause
-- ตัวอย่าง:
-- WHERE username = 'user1';
-- WHERE email = 'user@example.com';

-- รหัสผ่านหลัง reset: 123456
