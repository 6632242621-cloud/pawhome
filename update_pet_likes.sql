-- อัพเดตตาราง pet_likes ให้รองรับ status
ALTER TABLE pet_likes 
ADD COLUMN status ENUM('liked', 'rejected') DEFAULT 'liked' AFTER pet_id;

-- อัพเดต default value สำหรับข้อมูลเก่า
UPDATE pet_likes SET status = 'liked' WHERE status IS NULL;
