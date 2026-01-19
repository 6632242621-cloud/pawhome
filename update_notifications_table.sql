-- เพิ่ม related_like_id และ related_breeding_like_id
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_like_id INT,
ADD COLUMN IF NOT EXISTS related_breeding_like_id INT;
