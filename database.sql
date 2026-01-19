-- สร้าง Database
CREATE DATABASE IF NOT EXISTS pawhome_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pawhome_db;

-- ตาราง users (ผู้ใช้งาน)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'pet-owner', 'caregiver', 'business') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง pets (สัตว์เลี้ยง)
CREATE TABLE IF NOT EXISTS pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    age VARCHAR(50),
    breed VARCHAR(100),
    image_url TEXT,
    tags JSON,
    description TEXT,
    status ENUM('available', 'adopted', 'reserved') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง pet_likes (การกดถูกใจ)
CREATE TABLE IF NOT EXISTS pet_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pet_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, pet_id)
);

-- ตาราง matches (การแมท)
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    pet_id INT NOT NULL,
    status ENUM('pending', 'matched', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- ตาราง messages (ข้อความแชท)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง services (บริการ)
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    type ENUM('grooming', 'veterinary', 'daycare', 'training', 'pet-food', 'other') NOT NULL,
    image_url TEXT,
    distance VARCHAR(50),
    rating DECIMAL(2,1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    category VARCHAR(100),
    price VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ใส่ข้อมูลตัวอย่าง
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@pawhome.com', 'admin'),
('user1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user1@example.com', 'pet-owner'),
('caregiver1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'caregiver1@example.com', 'caregiver');

-- ใส่ข้อมูลสัตว์เลี้ยงตัวอย่าง
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
