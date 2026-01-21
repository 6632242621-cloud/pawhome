const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ดึง matches ของผู้ใช้ (รองรับทั้ง pet_finder และ breeding)
router.post('/list', async (req, res) => {
    try {
        const { user_id, match_type } = req.body;

        let query = `
            SELECT 
                m.*,
                p.name as pet_name,
                p.image as pet_image,
                p.user_id as pet_owner_id,
                u_matched.username as matched_user_name,
                u_matched.email as matched_user_email,
                u_matched.profile_image as matched_user_image,
                u_matched.role as matched_user_role,
                u_current.role as current_user_role
            FROM matches m
            LEFT JOIN pets p ON m.pet_id = p.id
            JOIN users u_matched ON (
                CASE 
                    WHEN m.user1_id = ? THEN m.user2_id
                    ELSE m.user1_id
                END = u_matched.id
            )
            JOIN users u_current ON u_current.id = ?
            WHERE (m.user1_id = ? OR m.user2_id = ?)`;
        
        const params = [user_id, user_id, user_id, user_id];
        
        if (match_type) {
            query += ` AND m.match_type = ?`;
            params.push(match_type);
        }
        
        query += ` ORDER BY m.created_at DESC`;

        const [matches] = await pool.query(query, params);

        res.json({ 
            success: true, 
            matches 
        });

    } catch (error) {
        console.error('List matches error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ตรวจสอบและสร้าง match ใหม่
router.post('/check', async (req, res) => {
    try {
        const { user_id, pet_id } = req.body;

        // ตรวจสอบว่ามี mutual likes หรือไม่
        const [mutualLikes] = await pool.query(`
            SELECT pl2.*, p.user_id as other_user_id
            FROM pet_likes pl1
            JOIN pet_likes pl2 ON pl1.pet_id = pl2.user_id AND pl2.pet_id = pl1.user_id
            JOIN pets p ON pl1.pet_id = p.id
            WHERE pl1.user_id = ? AND pl1.pet_id = ?
            AND NOT EXISTS (
                SELECT 1 FROM matches 
                WHERE pet_id = ? 
                AND ((user1_id = ? AND user2_id = p.user_id)
                   OR (user1_id = p.user_id AND user2_id = ?))
            )
        `, [user_id, pet_id, pet_id, user_id, user_id]);

        // สร้าง matches สำหรับ mutual likes
        let newMatchesCount = 0;
        for (const like of mutualLikes) {
            await pool.query(`
                INSERT INTO matches (user1_id, user2_id, pet_id, match_type)
                VALUES (?, ?, ?, 'pet_finder')
            `, [user_id, like.other_user_id, pet_id]);
            newMatchesCount++;
        }

        res.json({ 
            success: true, 
            new_matches: newMatchesCount 
        });

    } catch (error) {
        console.error('Check matches error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// สร้าง match ใหม่โดยตรง
router.post('/create', async (req, res) => {
    try {
        const { user1_id, user2_id, pet_id, match_type, breeding_pet1_id, breeding_pet2_id } = req.body;
        
        const type = match_type || 'pet_finder';

        // ตรวจสอบว่ามี match อยู่แล้วหรือไม่
        let query, params;
        if (type === 'breeding') {
            query = `SELECT id FROM matches 
                WHERE match_type = 'breeding'
                AND ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
                AND breeding_pet1_id IN (?, ?) AND breeding_pet2_id IN (?, ?)`;
            params = [user1_id, user2_id, user2_id, user1_id, 
                     breeding_pet1_id, breeding_pet2_id, breeding_pet1_id, breeding_pet2_id];
        } else {
            query = `SELECT id FROM matches 
                WHERE pet_id = ? AND match_type = 'pet_finder'
                AND ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))`;
            params = [pet_id, user1_id, user2_id, user2_id, user1_id];
        }
        
        const [existing] = await pool.query(query, params);

        if (existing.length > 0) {
            return res.json({ 
                success: false, 
                message: 'Match นี้มีอยู่แล้ว' 
            });
        }

        let insertQuery, insertParams;
        if (type === 'breeding') {
            insertQuery = `INSERT INTO matches (user1_id, user2_id, pet_id, match_type, breeding_pet1_id, breeding_pet2_id)
                VALUES (?, ?, NULL, 'breeding', ?, ?)`;
            insertParams = [user1_id, user2_id, breeding_pet1_id, breeding_pet2_id];
        } else {
            insertQuery = `INSERT INTO matches (user1_id, user2_id, pet_id, match_type)
                VALUES (?, ?, ?, 'pet_finder')`;
            insertParams = [user1_id, user2_id, pet_id];
        }

        const [result] = await pool.query(insertQuery, insertParams);

        res.json({
            success: true,
            message: 'สร้าง Match สำเร็จ',
            match_id: result.insertId
        });

    } catch (error) {
        console.error('Create match error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ลบ match
router.delete('/delete/:id', async (req, res) => {
    try {
        const matchId = req.params.id;

        await pool.query('DELETE FROM matches WHERE id = ?', [matchId]);

        res.json({
            success: true,
            message: 'ลบ Match สำเร็จ'
        });

    } catch (error) {
        console.error('Delete match error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
