-- Add missing columns to matches table for production
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'pet_finder',
ADD COLUMN IF NOT EXISTS breeding_pet1_id INTEGER REFERENCES breeding_pets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS breeding_pet2_id INTEGER REFERENCES breeding_pets(id) ON DELETE SET NULL;
