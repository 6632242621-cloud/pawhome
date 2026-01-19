-- เพิ่ม is_read column ในตาราง messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read TINYINT(1) DEFAULT 0;
