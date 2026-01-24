-- Add status column to pet_likes table
ALTER TABLE pet_likes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Add status column to breeding_likes table
ALTER TABLE breeding_likes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pet_likes_status ON pet_likes(status);
CREATE INDEX IF NOT EXISTS idx_breeding_likes_status ON breeding_likes(status);
