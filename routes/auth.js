const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config/config');

// ล็อกอิน
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ 
                success: false, 
                message: 'กรุณากรอกข้อมูลให้ครบ' 
            });
        }

        // ค้นหาผู้ใช้ (username หรือ email)
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.json({ 
                success: false, 
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
            });
        }

        const user = users[0];

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.json({ 
                success: false, 
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
            });
        }

        // สร้าง JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email,
                role: user.role 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // ส่งข้อมูลผู้ใช้กลับ (ไม่รวม password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาด: ' + error.message 
        });
    }
});

// ลงทะเบียน
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role = 'pet-owner' } = req.body;

        if (!username || !password) {
            return res.json({ 
                success: false, 
                message: 'กรุณากรอกข้อมูลให้ครบ' 
            });
        }

        // ตรวจสอบว่า username ซ้ำหรือไม่
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.json({ 
                success: false, 
                message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' 
            });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // บันทึกข้อมูล
        const [result] = await pool.query(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email || null, role]
        );

        const userId = result.insertId;

        // สร้าง JWT token
        const token = jwt.sign(
            { 
                id: userId, 
                username,
                email,
                role 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            success: true,
            message: 'ลงทะเบียนสำเร็จ',
            token,
            user: {
                id: userId,
                username,
                email,
                role
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาด: ' + error.message 
        });
    }
});

// Middleware สำหรับตรวจสอบ token
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'ไม่พบ token' 
            });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token ไม่ถูกต้อง' 
        });
    }
};

// ดึงข้อมูลผู้ใช้ปัจจุบัน
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.json({ 
                success: false, 
                message: 'ไม่พบผู้ใช้' 
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาด: ' + error.message 
        });
    }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
