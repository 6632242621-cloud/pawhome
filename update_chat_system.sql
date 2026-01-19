-- อัพเดทตาราง matches ให้รองรับทั้ง Pet Finder และ Breeding
ALTER TABLE matches 
ADD COLUMN match_type ENUM('pet_finder', 'breeding') DEFAULT 'pet_finder' AFTER pet_id,
ADD COLUMN breeding_pet1_id INT NULL AFTER match_type,
ADD COLUMN breeding_pet2_id INT NULL AFTER breeding_pet1_id;

-- เพิ่ม foreign key สำหรับ breeding pets
ALTER TABLE matches 
ADD CONSTRAINT fk_breeding_pet1 FOREIGN KEY (breeding_pet1_id) REFERENCES breeding_pets(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_breeding_pet2 FOREIGN KEY (breeding_pet2_id) REFERENCES breeding_pets(id) ON DELETE CASCADE;

-- อัพเดท breeding_matches ที่มีอยู่ให้ย้ายเข้า matches
INSERT INTO matches (user1_id, user2_id, pet_id, match_type, breeding_pet1_id, breeding_pet2_id, status, created_at)
SELECT user1_id, user2_id, pet1_id, 'breeding', pet1_id, pet2_id, 
       CASE status 
           WHEN 'pending' THEN 'pending'
           WHEN 'accepted' THEN 'matched'
           WHEN 'rejected' THEN 'rejected'
       END,
       created_at
FROM breeding_matches
WHERE NOT EXISTS (
    SELECT 1 FROM matches m 
    WHERE m.match_type = 'breeding' 
    AND m.breeding_pet1_id = breeding_matches.pet1_id 
    AND m.breeding_pet2_id = breeding_matches.pet2_id
);
