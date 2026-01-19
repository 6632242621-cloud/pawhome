const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ดึง notifications ของ user
router.get('/list/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { unread_only } = req.query;
        
        let query = `
            SELECT 
                n.*,
                u.username as related_user_name,
                p.name as pet_name,
                bp.name as breeding_pet_name
            FROM notifications n
            LEFT JOIN users u ON n.related_user_id = u.id
            LEFT JOIN pets p ON n.related_pet_id = p.id
            LEFT JOIN breeding_pets bp ON n.related_breeding_pet_id = bp.id
            WHERE n.user_id = ?
        `;
        
        if (unread_only === 'true') {
            query += ` AND n.is_read = FALSE`;
        }
        
        query += ` ORDER BY n.created_at DESC LIMIT 50`;
        
        const [notifications] = await pool.query(query, [userId]);
        
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

// นับจำนวน notifications ที่ยังไม่ได้อ่าน
router.get('/unread-count/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({ success: true, count: result[0].count });
    } catch (error) {
        console.error('Error counting notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to count notifications' });
    }
});

// ทำเครื่องหมายว่าอ่านแล้ว
router.post('/mark-read/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [notificationId]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
});

// ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
router.post('/mark-all-read/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
});

// สร้าง notification ใหม่ (ใช้ภายใน)
async function createNotification(data) {
    try {
        const { user_id, type, title, message, link, related_user_id, related_pet_id, related_breeding_pet_id, related_like_id, related_breeding_like_id } = data;
        
        await pool.query(
            `INSERT INTO notifications 
            (user_id, type, title, message, link, related_user_id, related_pet_id, related_breeding_pet_id, related_like_id, related_breeding_like_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, type, title, message, link || null, related_user_id || null, related_pet_id || null, related_breeding_pet_id || null, related_like_id || null, related_breeding_like_id || null]
        );
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

module.exports = router;
module.exports.createNotification = createNotification;
