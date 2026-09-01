const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'https://ping-talk-rho.vercel.app',
    credentials: true,
  },
});

// Track online users: { userId: socketId }
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        onlineUsers.set(userId, socket.id);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    }

    socket.on('markAsRead', ({ senderId, receiverId }) => {
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit('messagesRead', { readBy: receiverId });
        }
    });

    socket.on('typing', ({ receiverId, senderId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', { senderId });
        }
    });

    socket.on('stopTyping', ({ receiverId, senderId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userStoppedTyping', { senderId });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        onlineUsers.delete(userId);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });
});

// Helper to get a user's socket id (used in messageController)
function getReceiverSocketId(receiverId) {
    return onlineUsers.get(receiverId);
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'https://ping-talk-rho.vercel.app',
  credentials: true,
}));

app.get('/', (req, res) => {
    res.send('PingTalk backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { io, getReceiverSocketId };