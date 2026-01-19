-- PawHome PostgreSQL Database Schema
-- Converted from MySQL to PostgreSQL

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'pet-owner' CHECK (role IN ('pet-owner', 'caregiver', 'business', 'admin')),
    profile_image VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pets table  
CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    description TEXT,
    image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'adopted', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    pet_owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'matched' CHECK (status IN ('matched', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id, pet_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pet_likes table
CREATE TABLE IF NOT EXISTS pet_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    pet_owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pet_id)
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2),
    image VARCHAR(255),
    location VARCHAR(255),
    contact VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create breeding_pets table
CREATE TABLE IF NOT EXISTS breeding_pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    description TEXT,
    image VARCHAR(255),
    health_info TEXT,
    pedigree TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'matched', 'unavailable')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create breeding_likes table
CREATE TABLE IF NOT EXISTS breeding_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    breeding_pet_id INTEGER REFERENCES breeding_pets(id) ON DELETE CASCADE,
    pet_owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, breeding_pet_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    related_pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    related_breeding_pet_id INTEGER REFERENCES breeding_pets(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_pet_likes_user_pet ON pet_likes(user_id, pet_id);
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_breeding_pets_user_id ON breeding_pets(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@pawhome.com', '$2a$10$rX8qZqGxEYvkNZYqCQCjme7WZ9vKH3zGYLZHAqVKhJ5PYE8vYxGYy', 'admin')
ON CONFLICT (username) DO NOTHING;
