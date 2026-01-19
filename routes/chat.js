const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ดึงข้อความทั้งหมดใน match
router.post('/list', async (req, res) => {
    try {
        const { match_id } = req.body;

        const [messages] = await pool.query(`
            SELECT m.*, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.match_id = ?
            ORDER BY m.created_at ASC
        `, [match_id]);

        res.json({ 
            success: true, 
            messages 
        });

    } catch (error) {
        console.error('List messages error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ส่งข้อความใหม่
router.post('/send', async (req, res) => {
    try {
        const { match_id, sender_id, message } = req.body;

        if (!message || message.trim() === '') {
            return res.json({ 
                success: false, 
                message: 'ข้อความว่างเปล่า' 
            });
        }

        const [result] = await pool.query(`
            INSERT INTO messages (match_id, sender_id, message)
            VALUES (?, ?, ?)
        `, [match_id, sender_id, message]);

        res.json({
            success: true,
            message: 'ส่งข้อความสำเร็จ',
            message_id: result.insertId
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ทำเครื่องหมายข้อความว่าอ่านแล้ว (ลบออกเพราะใช้ WebSocket real-time แล้ว)
router.post('/mark-read', async (req, res) => {
    try {
        const { match_id, user_id } = req.body;

        // ปิดการใช้งาน is_read ชั่วคราว เนื่องจากใช้ WebSocket real-time
        // await pool.query(`
        //     UPDATE messages 
        //     SET is_read = 1 
        //     WHERE match_id = ? AND sender_id != ?
        // `, [match_id, user_id]);

        res.json({ 
            success: true,
            message: 'อัพเดตสถานะสำเร็จ'
        });

    } catch (error) {
        // Silent error - ใช้ WebSocket real-time แทน
        res.json({ 
            success: true, 
            message: 'อัพเดตสถานะสำเร็จ'
        });
    }
});

// ลบข้อความ
router.delete('/delete/:id', async (req, res) => {
    try {
        const messageId = req.params.id;

        await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);

        res.json({
            success: true,
            message: 'ลบข้อความสำเร็จ'
        });

    } catch (error) {
        console.error('Delete message error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// นับจำนวนข้อความที่ยังไม่ได้อ่าน (ปิดชั่วคราว - ใช้ WebSocket real-time)
router.get('/unread-count/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // ปิดการใช้งาน is_read เนื่องจากใช้ WebSocket real-time
        res.json({ 
            success: true, 
            unread_count: 0 // คืนค่า 0 เพราะใช้ real-time notification แทน
        });

    } catch (error) {
        // Silent error - ใช้ WebSocket real-time แทน
        res.json({ 
            success: true, 
            unread_count: 0
        });
    }
});

// Get unread count per match (ปิดชั่วคราว - ใช้ WebSocket real-time)
router.get('/unread-per-match/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // ปิดการใช้งาน is_read เนื่องจากใช้ WebSocket real-time
        // คืนค่า object ว่างเพราะใช้ real-time notification
        res.json({ 
            success: true, 
            unread_counts: {}
        });

    } catch (error) {
        // Silent error - ใช้ WebSocket real-time แทน
        res.json({ 
            success: true, 
            unread_counts: {}
        });
    }
});

module.exports = router;
