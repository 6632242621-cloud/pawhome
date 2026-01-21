-- Add sample data for production database
-- Run this after initial migration

-- Insert test users (password for all: password123)
INSERT INTO users (username, email, password, role, location, phone) VALUES
('owner1', 'owner1@test.com', '$2a$10$rX8qZqGxEYvkNZYqCQCjme7WZ9vKH3zGYLZHAqVKhJ5PYE8vYxGYy', 'pet-owner', 'กรุงเทพ', '081-234-5678'),
('owner2', 'owner2@test.com', '$2a$10$rX8qZqGxEYvkNZYqCQCjme7WZ9vKH3zGYLZHAqVKhJ5PYE8vYxGYy', 'pet-owner', 'เชียงใหม่', '082-345-6789'),
('caregiver1', 'care1@test.com', '$2a$10$rX8qZqGxEYvkNZYqCQCjme7WZ9vKH3zGYLZHAqVKhJ5PYE8vYxGYy', 'caregiver', 'ภูเก็ต', '083-456-7890'),
('business1', 'biz1@test.com', '$2a$10$rX8qZqGxEYvkNZYqCQCjme7WZ9vKH3zGYLZHAqVKhJ5PYE8vYxGYy', 'business', 'ขอนแก่น', '084-567-8901')
ON CONFLICT (email) DO NOTHING;

-- Insert sample pets (assuming user IDs 1-5 after admin)
INSERT INTO pets (user_id, name, species, breed, age, gender, description, status) VALUES
(2, 'Luna', 'สุนัข', 'Golden Retriever', 2, 'female', 'น้องลูน่าเป็นสุนัขที่น่ารักและเป็นมิตรมาก ชอบเล่นกับเด็กๆ เหมาะกับครอบครัว', 'available'),
(2, 'Max', 'สุนัข', 'Siberian Husky', 3, 'male', 'น้องแม็กซ์มีพลังงานสูง ชอบวิ่งเล่น เหมาะกับคนที่รักการออกกำลังกาย', 'available'),
(2, 'Mimi', 'แมว', 'Persian', 1, 'female', 'น้องมิมิเป็นแมวเปอร์เซียสีขาว สงบ เหมาะกับการเลี้ยงในห้อง', 'available'),
(3, 'Coco', 'สุนัข', 'Beagle', 1, 'female', 'น้องโคโค่ยังเป็นลูกหมา ขี้เล่น อยากรู้อยากเห็น', 'available'),
(3, 'Simba', 'แมว', 'Maine Coon', 2, 'male', 'น้องซิมบ้าเป็นแมวพันธุ์เมนคูน ขนาดใหญ่แต่อ่อนโยน', 'available'),
(3, 'Buddy', 'สุนัข', 'Labrador', 4, 'male', 'น้องบัดดี้เป็นสุนัขที่ฉลาดและซื่อสัตย์ เคยผ่านการฝึกมาแล้ว', 'available')
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO services (user_id, title, description, category, price, location, contact, status) VALUES
(4, 'บริการอาบน้ำตัดขน', 'บริการอาบน้ำ ตัดขน ตัดเล็บ สำหรับสุนัขและแมวทุกพันธุ์', 'grooming', 350.00, 'กรุงเทพ', '084-567-8901', 'active'),
(4, 'โรงแรมสุนัข-แมว', 'ฝากเลี้ยงสุนัขและแมว มีบริการดูแลตลอด 24 ชั่วโมง', 'boarding', 500.00, 'กรุงเทพ', '084-567-8901', 'active'),
(5, 'คลินิกสัตว์เลี้ยง', 'บริการตรวจรักษา ฉีดวัคซีน ทำหมัน โดยสัตวแพทย์ผู้เชี่ยวชาญ', 'veterinary', 800.00, 'เชียงใหม่', '085-678-9012', 'active'),
(5, 'ฝึกสอนสุนัข', 'ฝึกพื้นฐานและพฤติกรรม สำหรับสุนัขทุกวัย', 'training', 1200.00, 'เชียงใหม่', '085-678-9012', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample breeding pets
INSERT INTO breeding_pets (user_id, name, species, breed, age, gender, description, health_info, pedigree, status) VALUES
(2, 'Prince', 'สุนัข', 'Golden Retriever', 3, 'male', 'พ่อพันธุ์โกลเด้นสุดหล่อ มีใบเพ็ดดีกรี', 'ฉีดวัคซีนครบ ตรวจสุขภาพเรียบร้อย', 'มีใบเพ็ดดีกรีจาก AKC', 'available'),
(3, 'Princess', 'แมว', 'Scottish Fold', 2, 'female', 'แม่พันธุ์สก็อตติชโฟลด์หูพับสวยงาม', 'ฉีดวัคซีนครบ ไม่มีโรคทางพันธุกรรม', 'มีใบเพ็ดดีกรีครบถ้วน', 'available')
ON CONFLICT DO NOTHING;
