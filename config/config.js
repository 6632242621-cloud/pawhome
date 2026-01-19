require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    db: {
        // PostgreSQL connection string
        connectionString: process.env.DATABASE_URL || 
            `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'pawhome_db'}`,
        
        // Fallback config
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pawhome_db',
        port: process.env.DB_PORT || 5432
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
};
