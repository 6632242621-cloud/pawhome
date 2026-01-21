const { Pool } = require('pg');
const config = require('./config/config');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || config.db.connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function fixPetImages() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking and fixing pet images...');
        
        // Get all pets without valid images
        const result = await client.query(`
            SELECT id, name, image FROM pets 
            WHERE image IS NULL OR image = '' OR NOT (image LIKE 'http%' OR image LIKE '/%')
        `);
        
        console.log(`Found ${result.rows.length} pets with invalid images`);
        
        // Sample images for different breeds
        const sampleImages = [
            'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500', // Golden Retriever
            'https://images.unsplash.com/photo-1568572933382-74d440642117?w=500', // Husky
            'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500', // Persian Cat
            'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500', // Beagle
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500', // Pomeranian
            'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500'  // Labrador
        ];
        
        // Update each pet with a sample image
        for (let i = 0; i < result.rows.length; i++) {
            const pet = result.rows[i];
            const imageUrl = sampleImages[i % sampleImages.length];
            
            await client.query(
                'UPDATE pets SET image = $1 WHERE id = $2',
                [imageUrl, pet.id]
            );
            
            console.log(`✓ Updated ${pet.name} (ID: ${pet.id}) with image`);
        }
        
        console.log('✅ All pet images fixed!');
        
    } catch (error) {
        console.error('❌ Error fixing images:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixPetImages()
    .then(() => {
        console.log('Script completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('Script failed:', err);
        process.exit(1);
    });
