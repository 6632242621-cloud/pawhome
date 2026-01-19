const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const petsRoutes = require('./routes/pets');
const matchesRoutes = require('./routes/matches');
const chatRoutes = require('./routes/chat');
const servicesRoutes = require('./routes/services');
const adminRoutes = require('./routes/admin');
const likesRoutes = require('./routes/likes');
const breedingRoutes = require('./routes/breeding');
const notificationsRoutes = require('./routes/notifications');
const usersRoutes = require('./routes/users');

// Import socket handlers
const { initializeSocketHandlers } = require('./socket/chatSocket');

// สร้าง Express app
const app = express();

// สร้าง HTTP server และ Socket.IO
const server = http.createServer(app);

// Configure CORS for production
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
            return callback(new Error('CORS policy error'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Static files
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/breeding', breedingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'PawHome API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในระบบ',
        error: config.env === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'ไม่พบ endpoint ที่ร้องขอ' 
    });
});

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// เริ่มเซิร์ฟเวอร์
async function startServer() {
    try {
        // ทดสอบการเชื่อมต่อฐานข้อมูล
        await testConnection();
        
        // เริ่ม server (ใช้ http server แทน app)
        server.listen(config.port, () => {
            console.log(`🚀 Server is running on http://localhost:${config.port}`);
            console.log(`📝 Environment: ${config.env}`);
            console.log(`🔌 WebSocket is ready for real-time chat!`);
        });
    } catch (error) {
        console.error('❌ ไม่สามารถเริ่ม server ได้:', error);
        process.exit(1);
    }
}

startServer();

module.exports = { app, io, server };
