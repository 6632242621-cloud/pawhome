const { pool } = require('../config/database');

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

function initializeSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('🔌 New WebSocket connection:', socket.id);

        // User joins with their userId
        socket.on('user:join', (userId) => {
            console.log(`👤 User ${userId} joined with socket ${socket.id}`);
            activeUsers.set(userId.toString(), socket.id);
            userSockets.set(socket.id, userId.toString());
            
            // Notify user they're connected
            socket.emit('connection:success', { userId, socketId: socket.id });
        });

        // Join a specific chat room (match)
        socket.on('chat:join', (matchId) => {
            socket.join(`match_${matchId}`);
            console.log(`💬 Socket ${socket.id} joined match room: ${matchId}`);
        });

        // Leave a chat room
        socket.on('chat:leave', (matchId) => {
            socket.leave(`match_${matchId}`);
            console.log(`👋 Socket ${socket.id} left match room: ${matchId}`);
        });

        // Send message
        socket.on('message:send', async (data) => {
            try {
                const { match_id, sender_id, message } = data;

                if (!message || message.trim() === '') {
                    socket.emit('message:error', { error: 'ข้อความว่างเปล่า' });
                    return;
                }

                // Save message to database
                const [result] = await pool.query(
                    `INSERT INTO messages (match_id, sender_id, message) VALUES (?, ?, ?)`,
                    [match_id, sender_id, message]
                );

                // Get the saved message with sender info
                const [messages] = await pool.query(
                    `SELECT m.*, u.username as sender_name
                     FROM messages m
                     JOIN users u ON m.sender_id = u.id
                     WHERE m.id = ?`,
                    [result.insertId]
                );

                const savedMessage = messages[0];

                // Broadcast to all users in the match room
                io.to(`match_${match_id}`).emit('message:new', savedMessage);

                // Send notification to the other user (only if they're NOT in the room)
                const [matchUsers] = await pool.query(
                    `SELECT user1_id, user2_id FROM matches WHERE id = ?`,
                    [match_id]
                );

                if (matchUsers.length > 0) {
                    const match = matchUsers[0];
                    const receiverId = match.user1_id == sender_id 
                        ? match.user2_id 
                        : match.user1_id;
                    
                    const receiverSocketId = activeUsers.get(receiverId.toString());
                    console.log(`🎯 Looking for receiver ${receiverId}, socket: ${receiverSocketId}`);
                    
                    if (receiverSocketId) {
                        // Only send notification (not message:new again, as it's already sent to room)
                        io.to(receiverSocketId).emit('notification:new_message', {
                            match_id,
                            sender_id,
                            message: savedMessage,
                            preview: message.substring(0, 50)
                        });
                        console.log(`✅ Sent notification to user ${receiverId}`);
                    } else {
                        console.log(`⚠️ Receiver ${receiverId} not online`);
                    }
                }

                console.log(`📨 Message sent in match ${match_id} by user ${sender_id}`);

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message:error', { error: 'ไม่สามารถส่งข้อความได้' });
            }
        });

        // User is typing indicator
        socket.on('typing:start', (data) => {
            const { match_id, user_id, username } = data;
            socket.to(`match_${match_id}`).emit('typing:user', { user_id, username });
        });

        socket.on('typing:stop', (data) => {
            const { match_id, user_id } = data;
            socket.to(`match_${match_id}`).emit('typing:stop', { user_id });
        });

        // Load chat history
        socket.on('messages:load', async (matchId) => {
            try {
                const [messages] = await pool.query(
                    `SELECT m.*, u.username as sender_name
                     FROM messages m
                     JOIN users u ON m.sender_id = u.id
                     WHERE m.match_id = ?
                     ORDER BY m.created_at ASC`,
                    [matchId]
                );

                socket.emit('messages:loaded', messages);
            } catch (error) {
                console.error('Error loading messages:', error);
                socket.emit('messages:error', { error: 'ไม่สามารถโหลดข้อความได้' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const userId = userSockets.get(socket.id);
            if (userId) {
                activeUsers.delete(userId);
                userSockets.delete(socket.id);
                console.log(`👋 User ${userId} disconnected (socket ${socket.id})`);
            } else {
                console.log('🔌 Socket disconnected:', socket.id);
            }
        });

        // Error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
}

module.exports = { initializeSocketHandlers, activeUsers };
