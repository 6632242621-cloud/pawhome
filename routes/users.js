const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/profiles';
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, gif) เท่านั้น'));
        }
    }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [users] = await pool.query(
            'SELECT id, username, email, role, name, bio, date_of_birth, gender, phone, location, profile_image, created_at FROM users WHERE id = ?',
            [userId]
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
        console.error('Error fetching user profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' 
        });
    }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, phone, location, bio, date_of_birth, gender } = req.body;
        
        // Verify user exists
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.json({ 
                success: false, 
                message: 'ไม่พบผู้ใช้' 
            });
        }
        
        // Update profile
        await pool.query(
            `UPDATE users 
             SET name = ?, phone = ?, location = ?, bio = ?, date_of_birth = ?, gender = ?
             WHERE id = ?`,
            [name, phone, location, bio, date_of_birth, gender, userId]
        );
        
        // Get updated user data
        const [updatedUser] = await pool.query(
            'SELECT id, username, email, name, phone, location, bio, profile_image, date_of_birth, gender, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        res.json({ 
            success: true, 
            message: 'อัพเดทโปรไฟล์สำเร็จ',
            user: updatedUser[0]
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์' 
        });
    }
});

// Upload profile image
router.post('/profile/:userId/image', upload.single('profile_image'), async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!req.file) {
            return res.json({ 
                success: false, 
                message: 'ไม่พบไฟล์รูปภาพ' 
            });
        }
        
        // Get old profile image
        const [users] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            // Delete uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.json({ 
                success: false, 
                message: 'ไม่พบผู้ใช้' 
            });
        }
        
        // Delete old profile image if exists
        const oldImage = users[0].profile_image;
        if (oldImage && fs.existsSync(oldImage)) {
            fs.unlinkSync(oldImage);
        }
        
        // Update database with new image path
        const imagePath = req.file.path.replace(/\\/g, '/');
        await pool.query(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [imagePath, userId]
        );
        
        res.json({ 
            success: true, 
            message: 'อัพโหลดรูปโปรไฟล์สำเร็จ',
            profile_image: imagePath
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        
        // Delete uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการอัพโหลดรูป' 
        });
    }
});

module.exports = router;
