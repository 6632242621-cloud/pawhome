const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ดึงรายการสัตว์เลี้ยงทั้งหมด
router.get('/list', async (req, res) => {
    try {
        const [pets] = await pool.query(`
            SELECT 
                p.*,
                u.username as caregiver_name,
                u.email as caregiver_email,
                u.role as caregiver_role
            FROM pets p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.status = 'available'
            ORDER BY p.created_at DESC
        `);

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
            age, 
            breed, 
            image, 
            tags = [], 
            description 
        } = req.body;

        const tagsJson = JSON.stringify(tags);

        const [result] = await pool.query(`
            INSERT INTO pets (user_id, name, age, breed, image, tags, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [user_id, name, age, breed, image, tagsJson, description]);

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
            age, 
            breed, 
            image, 
            tags = [], 
            description, 
            status 
        } = req.body;

        const tagsJson = JSON.stringify(tags);

        await pool.query(`
            UPDATE pets SET
                name = ?,
                age = ?,
                breed = ?,
                image = ?,
                tags = ?,
                description = ?,
                status = ?
            WHERE id = ?
        `, [name, age, breed, image, tagsJson, description, status, petId]);

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

        const petsWithTags = pets.map(pet => ({
            ...pet,
            tags: pet.tags ? JSON.parse(pet.tags) : []
        }));

        res.json({ 
            success: true, 
            pets: petsWithTags 
        });

    } catch (error) {
        console.error('My pets error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
