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

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pawhome/pets',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// อัปโหลดรูปภาพสัตว์เลี้ยง
router.post('/upload-image', upload.single('petImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                success: false,
                message: 'ไม่พบไฟล์รูปภาพ'
            });
        }

        // Cloudinary returns the uploaded image URL
        const imageUrl = req.file.path;
        
        console.log('✅ Image uploaded to Cloudinary:', imageUrl);
        
        res.json({
            success: true,
            message: 'อัปโหลดรูปภาพสำเร็จ',
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload image error:', error);
        res.json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
        });
    }
});

// ดึงรายการสัตว์เลี้ยงทั้งหมด (รองรับ filter ตาม user_id)
router.get('/list', async (req, res) => {
    try {
        const excludeUserId = req.query.exclude_user_id; // ยกเว้นสัตว์ของ user นี้
        
        let query = `
            SELECT 
                p.*,
                u.username as caregiver_name,
                u.email as caregiver_email,
                u.role as caregiver_role
            FROM pets p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.status = 'available'
        `;
        
        const params = [];
        if (excludeUserId) {
            query += ' AND p.user_id != ?';
            params.push(excludeUserId);
        }
        
        query += ' ORDER BY p.created_at DESC';
        
        const [pets] = await pool.query(query, params);

        // แปลง JSON tags เป็น array
        const petsWithTags = pets.map(pet => ({
            ...pet,
            tags: pet.tags ? JSON.parse(pet.tags) : []
        }));

        res.json({ 
            success: true, 
            pets: petsWithTags 
        });

    } catch (error) {
        console.error('List pets error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงข้อมูลสัตว์เลี้ยงตัวเดียว
router.get('/get/:id', async (req, res) => {
    try {
        const petId = req.params.id;

        const [pets] = await pool.query(`
            SELECT 
                p.*,
                u.username as caregiver_name,
                u.email as caregiver_email,
                u.role as caregiver_role
            FROM pets p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [petId]);

        if (pets.length === 0) {
            return res.json({ 
                success: false, 
                message: 'ไม่พบข้อมูล' 
            });
        }

        const pet = {
            ...pets[0],
            tags: pets[0].tags ? JSON.parse(pets[0].tags) : []
        };

        res.json({ 
            success: true, 
            pet 
        });

    } catch (error) {
        console.error('Get pet error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// เพิ่มสัตว์เลี้ยงใหม่
router.post('/add', async (req, res) => {
    try {
        const { 
            user_id, 
            name,
            species,
            gender,
            age, 
            breed, 
            weight,
            health_status,
            location,
            contact_phone,
            image, 
            tags = [], 
            description,
            status = 'available'
        } = req.body;

        const tagsJson = JSON.stringify(tags);

        const [result] = await pool.query(`
            INSERT INTO pets (user_id, name, species, gender, age, breed, weight, health_status, location, contact_phone, image, tags, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [user_id, name, species, gender, age, breed, weight, health_status, location, contact_phone, image, tagsJson, description, status]);

        res.json({
            success: true,
            message: 'เพิ่มสัตว์เลี้ยงสำเร็จ',
            pet_id: result.insertId
        });

    } catch (error) {
        console.error('Add pet error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// อัพเดตข้อมูลสัตว์เลี้ยง
router.put('/update/:id', async (req, res) => {
    try {
        const petId = req.params.id;
        const { 
            name,
            species,
            gender,
            age, 
            breed,
            weight,
            health_status,
            location,
            contact_phone,
            image, 
            tags = [], 
            description, 
            status 
        } = req.body;

        const tagsJson = JSON.stringify(tags);

        await pool.query(`
            UPDATE pets SET
                name = ?,
                species = ?,
                gender = ?,
                age = ?,
                breed = ?,
                weight = ?,
                health_status = ?,
                location = ?,
                contact_phone = ?,
                image = ?,
                tags = ?,
                description = ?,
                status = ?
            WHERE id = ?
        `, [name, species, gender, age, breed, weight, health_status, location, contact_phone, image, tagsJson, description, status, petId]);

        res.json({
            success: true,
            message: 'อัพเดตข้อมูลสำเร็จ'
        });

    } catch (error) {
        console.error('Update pet error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ลบสัตว์เลี้ยง
router.delete('/delete/:id', async (req, res) => {
    try {
        const petId = req.params.id;

        await pool.query('DELETE FROM pets WHERE id = ?', [petId]);

        res.json({
            success: true,
            message: 'ลบข้อมูลสำเร็จ'
        });

    } catch (error) {
        console.error('Delete pet error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงสัตว์เลี้ยงของผู้ใช้
router.get('/my-pets/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const [pets] = await pool.query(`
            SELECT * FROM pets 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [userId]);

        const petsWithTags = pets.map(pet => {
            let tags = [];
            if (pet.tags) {
                try {
                    tags = typeof pet.tags === 'string' ? JSON.parse(pet.tags) : pet.tags;
                } catch (e) {
                    tags = [];
                }
            }
            return {
                ...pet,
                tags: tags
            };
        });

        res.json({ 
            success: true, 
            pets: petsWithTags 
        });

    } catch (error) {
        console.error('My pets error:', error);
        res.json({ 
            success: false, 
            message: error.message,
            pets: []
        });
    }
});

module.exports = router;
