const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || 'demo',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Configure Cloudinary storage for profile images
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pawhome/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'thumb', gravity: 'center' }]
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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
        
        // Cloudinary returns the uploaded image URL
        const imageUrl = req.file.path;
        
        console.log('✅ Profile image uploaded to Cloudinary:', imageUrl);
        
        // Update database with Cloudinary URL
        await pool.query(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [imageUrl, userId]
        );
        
        res.json({ 
            success: true, 
            message: 'อัพโหลดรูปโปรไฟล์สำเร็จ',
            profile_image: imageUrl
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการอัพโหลดรูป' 
        });
    }
});

module.exports = router;
