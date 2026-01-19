-- ปิด foreign key check ชั่วคราว
SET FOREIGN_KEY_CHECKS = 0;

-- ลบข้อมูลเก่าและ reset auto_increment (ใช้ DELETE แทน TRUNCATE)
DELETE FROM messages;
DELETE FROM pet_likes;
DELETE FROM matches;
DELETE FROM pets;
DELETE FROM services;
DELETE FROM users;

-- Reset auto_increment
ALTER TABLE messages AUTO_INCREMENT = 1;
ALTER TABLE pet_likes AUTO_INCREMENT = 1;
ALTER TABLE matches AUTO_INCREMENT = 1;
ALTER TABLE pets AUTO_INCREMENT = 1;
ALTER TABLE services AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- เพิ่มข้อมูลผู้ใช้ทดสอบ
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@pawhome.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('user1', 'user1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pet-owner'),
('caregiver1', 'caregiver1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'caregiver');

-- เพิ่มข้อมูลสัตว์เลี้ยงทดสอบ
INSERT INTO pets (user_id, name, age, breed, image_url, tags, description, status) VALUES
(3, 'Luna', '2 ปี', 'Golden Retriever', 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500', 
 '["Friendly", "Vaccinated", "House-trained"]', 
 'น้องลูน่าเป็นน้องหมาที่เป็นมิตรมากๆ ชอบเล่นกับเด็กๆ และสัตว์เลี้ยงตัวอื่นๆ เหมาะกับครอบครัวที่มีเด็ก', 
 'available'),

(3, 'Max', '3 ปี', 'Siberian Husky', 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=500',
 '["Active", "Vaccinated", "Trained"]',
 'น้องแม็กซ์เป็นน้องหมาที่มีพลังงานสูง ชอบวิ่งเล่น เหมาะกับคนที่ชอบออกกำลังกาย',
 'available'),

(3, 'Mimi', '1 ปี', 'Persian Cat', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500',
 '["Calm", "Indoor", "Vaccinated"]',
 'น้องมิมิเป็นแมวเปอร์เซียสีขาว สงบ ชอบนอนกลิ้งเล่น เหมาะกับการเลี้ยงในห้อง',
 'available'),

(3, 'Coco', '4 เดือน', 'Beagle', 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500',
 '["Playful", "Curious", "Vaccinated"]',
 'น้องโคโค่ยังเป็นลูกหมา ขี้เล่น อยากรู้อยากเห็น เหมาะกับคนที่มีเวลาดูแล',
 'available'),

(3, 'Simba', '2 ปี', 'Maine Coon', 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=500',
 '["Gentle", "Large", "Vaccinated"]',
 'น้องซิมบ้าเป็นแมวพันธุ์เมนคูน ขนาดใหญ่แต่อ่อนโยน เป็นมิตรกับทุกคน',
 'available'),

(3, 'Bella', '3 ปี', 'Pomeranian', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500',
 '["Cute", "Small", "Vaccinated"]',
 'น้องเบลล่าเป็นน้องหมาขนาดเล็ก น่ารัก ขี้อ้อน เหมาะกับการเลี้ยงในคอนโด',
 'available'),

(3, 'Tiger', '1.5 ปี', 'Bengal Cat', 'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=500',
 '["Active", "Playful", "Vaccinated"]',
 'น้องไทเกอร์เป็นแมวเบงกอล ขี้เล่น กระฉับกระเฉง ชอบไต่ปีน',
 'available'),

(3, 'Charlie', '4 ปี', 'Labrador', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500',
 '["Friendly", "Loyal", "Vaccinated"]',
 'น้องชาร์ลีเป็นน้องหมาที่ซื่อสัตย์ เชื่อฟัง เหมาะกับทุกครอบครัว',
 'available');

-- เปิด foreign key check กลับ
SET FOREIGN_KEY_CHECKS = 1;
