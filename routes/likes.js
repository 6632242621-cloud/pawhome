const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { createNotification } = require('./notifications');

// เพิ่ม like ใหม่
router.post('/add', async (req, res) => {
    try {
        const { user_id, pet_id } = req.body;

        // ตรวจสอบว่าเคย like แล้วหรือยัง
        const [existing] = await pool.query(
            'SELECT id FROM pet_likes WHERE user_id = ? AND pet_id = ?',
            [user_id, pet_id]
        );

        if (existing.length > 0) {
            return res.json({ 
                success: true, 
                message: 'เคย like ไปแล้ว',
                already_exists: true
            });
        }

        // บันทึก like
        const [result] = await pool.query(
            'INSERT INTO pet_likes (user_id, pet_id) VALUES (?, ?)',
            [user_id, pet_id]
        );

        // ดึงข้อมูลสัตว์เลี้ยงและเจ้าของ
        const [petInfo] = await pool.query(
            'SELECT p.*, u.username as liker_name FROM pets p, users u WHERE p.id = ? AND u.id = ?',
            [pet_id, user_id]
        );

        // ตรวจสอบว่ามี mutual like หรือไม่ (สำหรับ matching)
        const [petOwner] = await pool.query(
            'SELECT user_id FROM pets WHERE id = ?',
            [pet_id]
        );

        let hasMatch = false;
        if (petOwner.length > 0) {
            const ownerId = petOwner[0].user_id;
            
            // สร้าง notification ให้เจ้าของสัตว์เลี้ยง
            if (petInfo.length > 0) {
                await createNotification({
                    user_id: ownerId,
                    type: 'pet_like',
                    title: '🐾 มีคนสนใจสัตว์เลี้ยงของคุณ',
                    message: `${petInfo[0].liker_name} สนใจ ${petInfo[0].name} - กดเพื่อดูข้อมูลและตอบกลับ`,
                    link: 'pet-finder',
                    related_user_id: user_id,
                    related_pet_id: pet_id,
                    related_like_id: result.insertId
                });
            }
            
            // ตรวจสอบว่าเจ้าของสัตว์ก็ชอบเราด้วยหรือไม่
            const [mutualLike] = await pool.query(
                'SELECT id FROM pet_likes WHERE user_id = ? AND pet_id IN (SELECT id FROM pets WHERE user_id = ?)',
                [ownerId, user_id]
            );

            if (mutualLike.length > 0) {
                hasMatch = true;
                
                // สร้าง match อัตโนมัติ
                await pool.query(
                    'INSERT INTO matches (user1_id, user2_id, pet_id, match_type) VALUES (?, ?, ?, "pet_finder")',
                    [user_id, ownerId, pet_id]
                );
                
                // สร้าง notification สำหรับ match
                if (petInfo.length > 0) {
                    await createNotification({
                        user_id: ownerId,
                        type: 'match',
                        title: '💕 It\'s a Match!',
                        message: `คุณและ ${petInfo[0].liker_name} ถูกใจกันและกัน`,
                        related_user_id: user_id,
                        related_pet_id: pet_id
                    });
                }
            }
        }

        res.json({
            success: true,
            message: 'บันทึก like สำเร็จ',
            like_id: result.insertId,
            has_match: hasMatch
        });

    } catch (error) {
        console.error('Add like error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// เพิ่ม reject (pass)
router.post('/reject', async (req, res) => {
    try {
        const { user_id, pet_id } = req.body;

        // บันทึก reject (ใช้ status = 'rejected' หรือสร้างตารางแยก)
        // ตอนนี้เราจะใช้วิธี insert ลง pet_likes แต่เพิ่ม field status
        const [result] = await pool.query(
            'INSERT INTO pet_likes (user_id, pet_id, status) VALUES (?, ?, "rejected")',
            [user_id, pet_id]
        );

        res.json({
            success: true,
            message: 'บันทึก reject สำเร็จ'
        });

    } catch (error) {
        console.error('Add reject error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงรายการ pets ที่ user เคย like หรือ reject
router.get('/viewed/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const [viewed] = await pool.query(
            'SELECT pet_id FROM pet_likes WHERE user_id = ?',
            [userId]
        );

        const viewedIds = viewed.map(row => row.pet_id);

        res.json({
            success: true,
            viewed_pet_ids: viewedIds
        });

    } catch (error) {
        console.error('Get viewed error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงรายการ pets ที่ user ได้ like
router.get('/my-likes/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const [likes] = await pool.query(`
            SELECT 
                l.id,
                l.created_at,
                p.id as pet_id,
                p.name,
                p.age,
                p.breed,
                p.image,
                p.tags,
                p.description
            FROM pet_likes l
            JOIN pets p ON l.pet_id = p.id
            WHERE l.user_id = ? AND l.status = 'liked'
            ORDER BY l.created_at DESC
        `, [userId]);

        const likesWithTags = likes.map(like => ({
            ...like,
            tags: like.tags ? JSON.parse(like.tags) : []
        }));

        res.json({
            success: true,
            likes: likesWithTags
        });

    } catch (error) {
        console.error('Get my likes error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Accept like (สร้าง match)
router.post('/accept', async (req, res) => {
    try {
        const { like_id, owner_user_id, liker_user_id, pet_id } = req.body;

        // ตรวจสอบว่ามี match อยู่แล้วหรือไม่
        const [existingMatch] = await pool.query(`
            SELECT id FROM matches 
            WHERE match_type = 'pet_finder' 
            AND ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
            AND pet_id = ?
        `, [owner_user_id, liker_user_id, liker_user_id, owner_user_id, pet_id]);

        if (existingMatch.length > 0) {
            return res.json({ 
                success: true, 
                message: 'Match อยู่แล้ว',
                match_id: existingMatch[0].id
            });
        }

        // สร้าง match ใหม่
        const [matchResult] = await pool.query(`
            INSERT INTO matches (user1_id, user2_id, pet_id, match_type, status)
            VALUES (?, ?, ?, 'pet_finder', 'active')
        `, [owner_user_id, liker_user_id, pet_id]);

        const matchId = matchResult.insertId;

        // อัพเดต like status
        await pool.query(
            'UPDATE pet_likes SET status = ? WHERE id = ?',
            ['accepted', like_id]
        );

        // ดึงข้อมูลสัตว์เลี้ยง
        const [petInfo] = await pool.query('SELECT name FROM pets WHERE id = ?', [pet_id]);
        const petName = petInfo[0]?.name || 'สัตว์เลี้ยง';

        // ดึงข้อมูล users
        const [ownerInfo] = await pool.query('SELECT username FROM users WHERE id = ?', [owner_user_id]);
        const [likerInfo] = await pool.query('SELECT username FROM users WHERE id = ?', [liker_user_id]);

        // สร้าง notification ให้ liker
        await createNotification({
            user_id: liker_user_id,
            type: 'match',
            title: '🎉 Match สำเร็จ!',
            message: `${ownerInfo[0]?.username || 'เจ้าของ'} ตอบรับคุณแล้ว! ตอนนี้คุณสามารถแชทกับเจ้าของ ${petName} ได้`,
            link: 'matches',
            related_user_id: owner_user_id,
            related_pet_id: pet_id
        });

        res.json({
            success: true,
            message: 'Accept สำเร็จ',
            match_id: matchId
        });

    } catch (error) {
        console.error('Accept like error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Reject like
router.post('/reject', async (req, res) => {
    try {
        const { like_id } = req.body;

        // อัพเดต like status เป็น rejected
        await pool.query(
            'UPDATE pet_likes SET status = ? WHERE id = ?',
            ['rejected', like_id]
        );

        res.json({
            success: true,
            message: 'Reject สำเร็จ'
        });

    } catch (error) {
        console.error('Reject like error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงข้อมูล like พร้อมข้อมูลผู้ like
router.get('/detail/:likeId', async (req, res) => {
    try {
        const { likeId } = req.params;

        const [likes] = await pool.query(`
            SELECT 
                pl.*,
                u.username as liker_name,
                u.email as liker_email,
                u.phone as liker_phone,
                u.location as liker_location,
                u.bio as liker_bio,
                u.profile_image as liker_image,
                u.gender as liker_gender,
                u.date_of_birth as liker_dob,
                p.name as pet_name,
                p.breed as pet_breed,
                p.image as pet_image
            FROM pet_likes pl
            JOIN users u ON pl.user_id = u.id
            JOIN pets p ON pl.pet_id = p.id
            WHERE pl.id = ?
        `, [likeId]);

        if (likes.length === 0) {
            return res.json({ 
                success: false, 
                message: 'ไม่พบข้อมูล' 
            });
        }

        res.json({ 
            success: true, 
            like: likes[0] 
        });

    } catch (error) {
        console.error('Get like detail error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
