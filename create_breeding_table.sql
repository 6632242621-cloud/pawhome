-- สร้างตาราง breeding_pets สำหรับสัตว์เลี้ยงที่ต้องการหาคู่ผสมพันธุ์
CREATE TABLE IF NOT EXISTS breeding_pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    age VARCHAR(50),
    breed VARCHAR(100),
    gender ENUM('Male', 'Female') NOT NULL,
    image_url TEXT,
    vaccinated BOOLEAN DEFAULT FALSE,
    dewormed BOOLEAN DEFAULT FALSE,
    health_certificate BOOLEAN DEFAULT FALSE,
    genetic_tested BOOLEAN DEFAULT FALSE,
    genetic_match_score INT DEFAULT 0,
    description TEXT,
    status ENUM('active', 'inactive', 'matched') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- สร้างตาราง breeding_likes สำหรับการกดถูกใจในระบบ breeding
CREATE TABLE IF NOT EXISTS breeding_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    breeding_pet_id INT NOT NULL,
    status ENUM('like', 'reject') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (breeding_pet_id) REFERENCES breeding_pets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_breeding_like (user_id, breeding_pet_id)
);

-- สร้างตาราง breeding_matches สำหรับคู่ที่แมทกัน
CREATE TABLE IF NOT EXISTS breeding_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    pet1_id INT NOT NULL,
    pet2_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet1_id) REFERENCES breeding_pets(id) ON DELETE CASCADE,
    FOREIGN KEY (pet2_id) REFERENCES breeding_pets(id) ON DELETE CASCADE
);

-- ใส่ข้อมูลตัวอย่าง
INSERT INTO breeding_pets (user_id, name, age, breed, gender, image_url, vaccinated, dewormed, health_certificate, genetic_tested, genetic_match_score, description, status) VALUES
(2, 'Bella', '3 ปี', 'Golden Retriever', 'Female', 'https://images.unsplash.com/photo-1612536980122-c31e3a00f902?w=500', TRUE, TRUE, TRUE, TRUE, 95, 'น้องเบลล่าสายพันธุ์ดี มีประวัติครอบครัวชัดเจน สุขภาพแข็งแรง', 'active'),
(2, 'Rocky', '4 ปี', 'German Shepherd', 'Male', 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=500', TRUE, TRUE, TRUE, TRUE, 92, 'น้องร็อคกี้พันธุ์แท้ ฝึกแล้ว มีประวัติการผสมพันธุ์ดี', 'active'),
(2, 'Luna', '2 ปี', 'Siberian Husky', 'Female', 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=500', TRUE, TRUE, TRUE, TRUE, 88, 'น้องลูน่าสุขภาพดีเยี่ยม ตรวจสุขภาพครบ พร้อมผสมพันธุ์', 'active'),
(2, 'Max', '5 ปี', 'Labrador', 'Male', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500', TRUE, TRUE, TRUE, TRUE, 90, 'น้องแม็กซ์พันธุ์แท้ ประสบการณ์การผสมพันธุ์ดี', 'active'),
(2, 'Mia', '3 ปี', 'French Bulldog', 'Female', 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=500', TRUE, TRUE, TRUE, TRUE, 85, 'น้องมีอาพันธุ์ดี สุขภาพแข็งแรง มีใบรับรอง', 'active'),
(2, 'Charlie', '4 ปี', 'Beagle', 'Male', 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500', TRUE, TRUE, TRUE, TRUE, 87, 'น้องชาร์ลีพันธุ์แท้ มีประวัติดี พร้อมผสมพันธุ์', 'active'),
(2, 'Daisy', '2 ปี', 'Pomeranian', 'Female', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500', TRUE, TRUE, TRUE, TRUE, 91, 'น้องเดซี่ขนาดเล็ก น่ารัก สุขภาพดี', 'active'),
(2, 'Cooper', '6 ปี', 'Border Collie', 'Male', 'https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=500', TRUE, TRUE, TRUE, TRUE, 93, 'น้องคูเปอร์ฉลาด สุขภาพดี มีประสบการณ์ดี', 'active');
