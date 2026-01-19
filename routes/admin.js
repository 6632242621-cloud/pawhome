const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ดึงสถิติทั้งหมด
router.get('/stats', async (req, res) => {
    try {
        const stats = {};
        
        // Total users
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        stats.total_users = users[0].count;
        
        // Total pets
        const [pets] = await pool.query('SELECT COUNT(*) as count FROM pets');
        stats.total_pets = pets[0].count;
        
        // Total likes
        const [likes] = await pool.query('SELECT COUNT(*) as count FROM pet_likes');
        stats.total_likes = likes[0].count;
        
        // Total matches
        const [matches] = await pool.query('SELECT COUNT(*) as count FROM matches');
        stats.total_matches = matches[0].count;
        
        res.json({ 
            success: true, 
            stats 
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงรายการผู้ใช้ทั้งหมด
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id, username, email, role, created_at
            FROM users
            ORDER BY created_at DESC
        `);
        
        res.json({ 
            success: true, 
            users 
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงรายการ likes ทั้งหมด
router.get('/likes', async (req, res) => {
    try {
        const [likes] = await pool.query(`
            SELECT 
                l.id,
                l.created_at,
                u.username,
                p.name as pet_name
            FROM pet_likes l
            JOIN users u ON l.user_id = u.id
            JOIN pets p ON l.pet_id = p.id
            ORDER BY l.created_at DESC
        `);
        
        res.json({ 
            success: true, 
            likes 
        });

    } catch (error) {
        console.error('Get likes error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงรายการ matches ทั้งหมด
router.get('/matches', async (req, res) => {
    try {
        const [matches] = await pool.query(`
            SELECT 
                m.id,
                m.status,
                m.created_at,
                u1.username as user1_name,
                u2.username as user2_name,
                p.name as pet_name
            FROM matches m
            JOIN users u1 ON m.user1_id = u1.id
            JOIN users u2 ON m.user2_id = u2.id
            JOIN pets p ON m.pet_id = p.id
            ORDER BY m.created_at DESC
        `);
        
        res.json({ 
            success: true, 
            matches 
        });

    } catch (error) {
        console.error('Get matches error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ลบผู้ใช้
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({
            success: true,
            message: 'ลบผู้ใช้สำเร็จ'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// อัพเดต role ผู้ใช้
router.put('/users/:id/role', async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        
        res.json({
            success: true,
            message: 'อัพเดต role สำเร็จ'
        });

    } catch (error) {
        console.error('Update role error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
