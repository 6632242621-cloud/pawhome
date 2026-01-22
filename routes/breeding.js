const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { createNotification } = require('./notifications');

// ดึงรายการสัตว์เลี้ยงที่เปิดหาคู่ผสมพันธุ์
router.get('/list', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT bp.*, u.username as owner_name
            FROM breeding_pets bp
            JOIN users u ON bp.user_id = u.id
            WHERE bp.status = 'active'
            ORDER BY bp.created_at DESC
        `);
        res.json({ success: true, pets: rows });
    } catch (error) {
        console.error('Error fetching breeding pets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch breeding pets' });
    }
});

// ดึงรายการสัตว์เลี้ยงสำหรับ user (ยกเว้นของตัวเองและที่เคย like/reject)
router.get('/list/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT bp.*, u.username as owner_name
            FROM breeding_pets bp
            JOIN users u ON bp.user_id = u.id
            LEFT JOIN breeding_likes bl ON bp.id = bl.breeding_pet_id AND bl.user_id = ?
            WHERE bp.status = 'active' 
            AND bp.user_id != ?
            AND bl.id IS NULL
            ORDER BY bp.created_at DESC
        `, [userId, userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching breeding pets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch breeding pets' });
    }
});

// ดึงข้อมูลสัตว์เลี้ยงที่ user ยังไม่ได้ดู
router.get('/unviewed/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT bp.*, u.username as owner_name
            FROM breeding_pets bp
            JOIN users u ON bp.user_id = u.id
            LEFT JOIN breeding_likes bl ON bp.id = bl.breeding_pet_id AND bl.user_id = ?
            WHERE bp.status = 'active' 
            AND bp.user_id != ?
            AND bl.id IS NULL
            ORDER BY bp.created_at DESC
        `, [userId, userId]);
        res.json({ success: true, pets: rows });
    } catch (error) {
        console.error('Error fetching unviewed breeding pets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unviewed pets' });
    }
});

// เพิ่มสัตว์เลี้ยงเข้าระบบ breeding
router.post('/add', async (req, res) => {
    try {
        const {
            user_id, name, age, breed, gender, image,
            vaccinated, dewormed, health_certificate, genetic_tested,
            genetic_match_score, description
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO breeding_pets 
            (user_id, name, age, breed, gender, image, vaccinated, dewormed, 
             health_certificate, genetic_tested, genetic_match_score, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [user_id, name, age, breed, gender, image, vaccinated, dewormed, 
            health_certificate, genetic_tested, genetic_match_score, description]);

        res.json({ 
            success: true, 
            message: 'Breeding pet added successfully',
            petId: result.insertId 
        });
    } catch (error) {
        console.error('Error adding breeding pet:', error);
        res.status(500).json({ success: false, message: 'Failed to add breeding pet' });
    }
});

// กด Like ในระบบ breeding
router.post('/like', async (req, res) => {
    try {
        const { user_id, breeding_pet_id } = req.body;

        // บันทึกการ like
        const [result] = await pool.query(`
            INSERT INTO breeding_likes (user_id, breeding_pet_id, status)
            VALUES (?, ?, 'like')
            ON DUPLICATE KEY UPDATE status = 'like'
        `, [user_id, breeding_pet_id]);

        // ตรวจสอบว่ามีการ like กลับหรือไม่
        const [petInfo] = await pool.query(`
            SELECT bp.*, u.username as liker_name 
            FROM breeding_pets bp, users u 
            WHERE bp.id = ? AND u.id = ?
        `, [breeding_pet_id, user_id]);

        if (petInfo.length > 0) {
            const otherUserId = petInfo[0].user_id;
            
            // สร้าง notification ให้เจ้าของสัตว์เลี้ยง
            await createNotification({
                user_id: otherUserId,
                type: 'breeding_like',
                title: '💕 มีคนสนใจสัตว์ของคุณในระบบ Breeding',
                message: `${petInfo[0].liker_name} สนใจ ${petInfo[0].name} สำหรับผสมพันธุ์ - กดเพื่อดูข้อมูลและตอบกลับ`,
                link: 'breeding',
                related_user_id: user_id,
                related_breeding_pet_id: breeding_pet_id,
                related_breeding_like_id: result.insertId
            });
            
            // หาสัตว์เลี้ยงของ user ที่กด like
            const [myPets] = await pool.query(`
                SELECT id, name FROM breeding_pets WHERE user_id = ? AND status = 'active' LIMIT 1
            `, [user_id]);

            if (myPets.length > 0) {
                const myPetId = myPets[0].id;
                
                // ตรวจสอบว่าอีกฝ่ายกด like กลับหรือไม่
                const [mutualLike] = await pool.query(`
                    SELECT * FROM breeding_likes 
                    WHERE user_id = ? AND breeding_pet_id = ? AND status = 'like'
                `, [otherUserId, myPetId]);

                if (mutualLike.length > 0) {
                    // สร้าง match (ใช้ตาราง matches แทน matches)
                    await pool.query(`
                        INSERT INTO matches 
                        (user1_id, user2_id, pet_id, match_type, breeding_pet1_id, breeding_pet2_id, status)
                        VALUES (?, ?, NULL, 'breeding', ?, ?, 'matched')
                    `, [user_id, otherUserId, myPetId, breeding_pet_id]);
                    
                    // สร้าง notification สำหรับ match
                    await createNotification({
                        user_id: otherUserId,
                        type: 'match',
                        title: '💕 It\'s a Match! (Breeding)',
                        message: `คุณและ ${petInfo[0].liker_name} ถูกใจกันและกันสำหรับการผสมพันธุ์`,
                        related_user_id: user_id,
                        related_breeding_pet_id: breeding_pet_id
                    });

                    res.json({ 
                        success: true, 
                        matched: true,
                        message: 'It\'s a match!' 
                    });
                    return;
                }
            }
        }

        res.json({ success: true, matched: false });
    } catch (error) {
        console.error('Error liking breeding pet:', error);
        res.status(500).json({ success: false, message: 'Failed to like pet' });
    }
});

// กด Reject
router.post('/reject', async (req, res) => {
    try {
        const { user_id, breeding_pet_id } = req.body;

        await pool.query(`
            INSERT INTO breeding_likes (user_id, breeding_pet_id, status)
            VALUES (?, ?, 'reject')
            ON DUPLICATE KEY UPDATE status = 'reject'
        `, [user_id, breeding_pet_id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error rejecting breeding pet:', error);
        res.status(500).json({ success: false, message: 'Failed to reject pet' });
    }
});

// ดูสัตว์เลี้ยงที่ user กด like
router.get('/my-likes/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT bp.*, u.username as owner_name, bl.created_at as liked_at
            FROM breeding_likes bl
            JOIN breeding_pets bp ON bl.breeding_pet_id = bp.id
            JOIN users u ON bp.user_id = u.id
            WHERE bl.user_id = ? AND bl.status = 'like'
            ORDER BY bl.created_at DESC
        `, [userId]);
        res.json({ success: true, pets: rows });
    } catch (error) {
        console.error('Error fetching breeding likes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch likes' });
    }
});

// ดู matches ของ user
router.get('/my-matches/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT 
                m.*,
                bp1.name as my_pet_name, bp1.image as my_pet_image,
                bp2.name as match_pet_name, bp2.image as match_pet_image,
                u.username as match_username
            FROM matches m
            JOIN breeding_pets bp1 ON m.breeding_pet1_id = bp1.id
            JOIN breeding_pets bp2 ON m.breeding_pet2_id = bp2.id
            JOIN users u ON (CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END) = u.id
            WHERE m.match_type = 'breeding'
            AND (m.user1_id = ? OR m.user2_id = ?)
            ORDER BY m.created_at DESC
        `, [userId, userId, userId]);
        res.json({ success: true, matches: rows });
    } catch (error) {
        console.error('Error fetching breeding matches:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch matches' });
    }
});

// ดึงสัตว์เลี้ยงของ user ในระบบ breeding
router.get('/my-pets/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT * FROM breeding_pets
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);
        res.json({ success: true, pets: rows });
    } catch (error) {
        console.error('Error fetching user breeding pets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user pets' });
    }
});

// อัพเดตข้อมูลสัตว์เลี้ยงในระบบ breeding
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, age, breed, gender, image,
            vaccinated, dewormed, health_certificate, genetic_tested,
            genetic_match_score, description, status
        } = req.body;

        await pool.query(`
            UPDATE breeding_pets 
            SET name = ?, age = ?, breed = ?, gender = ?, image = ?,
                vaccinated = ?, dewormed = ?, health_certificate = ?, genetic_tested = ?,
                genetic_match_score = ?, description = ?, status = ?
            WHERE id = ?
        `, [name, age, breed, gender, image, vaccinated, dewormed, 
            health_certificate, genetic_tested, genetic_match_score, description, status, id]);

        res.json({ success: true, message: 'Breeding pet updated successfully' });
    } catch (error) {
        console.error('Error updating breeding pet:', error);
        res.status(500).json({ success: false, message: 'Failed to update breeding pet' });
    }
});

// ลบสัตว์เลี้ยงออกจากระบบ breeding
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM breeding_pets WHERE id = ?', [id]);
        res.json({ success: true, message: 'Breeding pet deleted successfully' });
    } catch (error) {
        console.error('Error deleting breeding pet:', error);
        res.status(500).json({ success: false, message: 'Failed to delete breeding pet' });
    }
});

// Accept breeding like (สร้าง match)
router.post('/accept', async (req, res) => {
    try {
        const { like_id, owner_user_id, liker_user_id, breeding_pet_id } = req.body;

        // ตรวจสอบว่ามี match อยู่แล้วหรือไม่
        const [existingMatch] = await pool.query(`
            SELECT id FROM matches 
            WHERE match_type = 'breeding' 
            AND ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
            AND breeding_pet1_id = ?
        `, [owner_user_id, liker_user_id, liker_user_id, owner_user_id, breeding_pet_id]);

        if (existingMatch.length > 0) {
            return res.json({ 
                success: true, 
                message: 'Match อยู่แล้ว',
                match_id: existingMatch[0].id
            });
        }

        // สร้าง match ใหม่
        const [matchResult] = await pool.query(`
            INSERT INTO matches (user1_id, user2_id, breeding_pet1_id, match_type, status)
            VALUES (?, ?, ?, 'breeding', 'active')
        `, [owner_user_id, liker_user_id, breeding_pet_id]);

        const matchId = matchResult.insertId;

        // อัพเดต like status
        await pool.query(
            'UPDATE breeding_likes SET status = ? WHERE id = ?',
            ['accepted', like_id]
        );

        // ดึงข้อมูลสัตว์เลี้ยง
        const [petInfo] = await pool.query('SELECT name FROM breeding_pets WHERE id = ?', [breeding_pet_id]);
        const petName = petInfo[0]?.name || 'สัตว์เลี้ยง';

        // ดึงข้อมูล users
        const [ownerInfo] = await pool.query('SELECT username FROM users WHERE id = ?', [owner_user_id]);
        const [likerInfo] = await pool.query('SELECT username FROM users WHERE id = ?', [liker_user_id]);

        // สร้าง notification ให้ liker
        await createNotification({
            user_id: liker_user_id,
            type: 'match',
            title: '🎉 Match สำเร็จ!',
            message: `${ownerInfo[0]?.username || 'เจ้าของ'} ตอบรับคุณแล้ว! ตอนนี้คุณสามารถแชทเกี่ยวกับการผสมพันธุ์ ${petName} ได้`,
            link: 'matches',
            related_user_id: owner_user_id,
            related_breeding_pet_id: breeding_pet_id
        });

        res.json({
            success: true,
            message: 'Accept สำเร็จ',
            match_id: matchId
        });

    } catch (error) {
        console.error('Accept breeding like error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Reject breeding like
router.post('/reject', async (req, res) => {
    try {
        const { like_id } = req.body;

        await pool.query(
            'UPDATE breeding_likes SET status = ? WHERE id = ?',
            ['rejected', like_id]
        );

        res.json({
            success: true,
            message: 'Reject สำเร็จ'
        });

    } catch (error) {
        console.error('Reject breeding like error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ดึงข้อมูล breeding like พร้อมข้อมูลผู้ like
router.get('/like-detail/:likeId', async (req, res) => {
    try {
        const { likeId } = req.params;

        const [likes] = await pool.query(`
            SELECT 
                bl.*,
                u.username as liker_name,
                u.email as liker_email,
                u.phone as liker_phone,
                u.location as liker_location,
                u.bio as liker_bio,
                u.profile_image as liker_image,
                u.gender as liker_gender,
                u.date_of_birth as liker_dob,
                bp.name as pet_name,
                bp.breed as pet_breed,
                bp.image as pet_image
            FROM breeding_likes bl
            JOIN users u ON bl.user_id = u.id
            JOIN breeding_pets bp ON bl.breeding_pet_id = bp.id
            WHERE bl.id = ?
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
        console.error('Get breeding like detail error:', error);
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;


