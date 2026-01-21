const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ดึงรายการบริการทั้งหมด
router.get('/list', async (req, res) => {
    try {
        const [services] = await pool.query(`
            SELECT s.*, u.username as owner_name 
            FROM services s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);

        res.json({ 
            success: true, 
            services 
        });

    } catch (error) {
        console.error('List services error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงบริการของผู้ใช้เฉพาะ
router.post('/my-services', async (req, res) => {
    try {
        const { user_id } = req.body;

        const [services] = await pool.query(`
            SELECT * FROM services 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [user_id]);

        res.json({ 
            success: true, 
            services 
        });

    } catch (error) {
        console.error('My services error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// เพิ่มบริการใหม่
router.post('/add', async (req, res) => {
    try {
        const { 
            user_id, 
            name, 
            type = 'other', 
            image, 
            price, 
            description, 
            category 
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO services (user_id, name, type, image, price, description, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [user_id, name, type, image, price, description, category]);

        res.json({
            success: true,
            message: 'เพิ่มบริการสำเร็จ',
            service_id: result.insertId
        });

    } catch (error) {
        console.error('Add service error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// อัพเดตบริการ
router.put('/update/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { 
            name, 
            type = 'other', 
            image, 
            price, 
            description, 
            category 
        } = req.body;

        await pool.query(`
            UPDATE services SET
                name = ?,
                type = ?,
                image = ?,
                price = ?,
                description = ?,
                category = ?
            WHERE id = ?
        `, [name, type, image, price, description, category, serviceId]);

        res.json({
            success: true,
            message: 'อัพเดตบริการสำเร็จ'
        });

    } catch (error) {
        console.error('Update service error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ลบบริการ
router.delete('/delete/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;

        await pool.query('DELETE FROM services WHERE id = ?', [serviceId]);

        res.json({
            success: true,
            message: 'ลบบริการสำเร็จ'
        });

    } catch (error) {
        console.error('Delete service error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ค้นหาบริการตามประเภท
router.get('/by-category/:category', async (req, res) => {
    try {
        const category = req.params.category;

        const [services] = await pool.query(`
            SELECT s.*, u.username as owner_name 
            FROM services s
            JOIN users u ON s.user_id = u.id
            WHERE s.category = ?
            ORDER BY s.created_at DESC
        `, [category]);

        res.json({ 
            success: true, 
            services 
        });

    } catch (error) {
        console.error('Services by category error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงข้อมูลบริการตัวเดียว
router.get('/get/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;

        const [services] = await pool.query(`
            SELECT s.*, u.username as owner_name, u.email as owner_email
            FROM services s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `, [serviceId]);

        if (services.length === 0) {
            return res.json({ 
                success: false, 
                message: 'ไม่พบบริการ' 
            });
        }

        res.json({ 
            success: true, 
            service: services[0] 
        });

    } catch (error) {
        console.error('Get service error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
