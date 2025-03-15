const { Server } = require('socket.io');
const { Message } = require('../model/message');
const User = require('../model/user');
const Admin = require('../model/admin');
const { Notification } = require('../model/notifications');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class WebSocketServer {
    constructor(server, options = {}) {
        // console.log('WebSocketServer options:', options);
        this.io = new Server(server, {
            cors: {
                origin: [
                    'http://localhost:5500',
                    'http://localhost:5050',
                    'http://192.168.99.171:5050',
                    'http://localhost:5173',
                    process.env.WEB_BASE_URL || 'http://localhost:5173'
                ],
                methods: ['GET', 'POST'],
                credentials: true
            },
            path: '/ws',
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            ...options
        });

        this.connections = new Map();
        this.initialize();
    }

    initialize() {
        console.log('Initializing WebSocketServer with path:', this.io.path());

        this.io.use(async (socket, next) => {
            console.log('New connection attempt:', socket.id);
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.SECRET_KEY);
                const user = await User.findById(decoded._id) || await Admin.findById(decoded._id);
                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.userId = decoded._id;
                console.log('User authenticated:', socket.userId);
                next();
            } catch (error) {
                console.error('Authentication error:', error.message);
                return next(new Error(`Authentication failed: ${error.message}`));
            }
        });

        this.io.on('connection', this.handleConnection.bind(this));
    }

    handleConnection(socket) {
        console.log('Client connected:', socket.id, 'User:', socket.userId);
        this.connections.set(socket.userId, socket); // Use userId as key for easier lookup

        this.fetchNotifications(socket);

        socket.on('message', this.handleMessage.bind(this, socket));
        socket.on('messages', () => this.fetchMessages(socket));
        socket.on('mark-read', (messageIds) => this.markMessagesRead(socket, messageIds)); // New listener
        socket.on('notify', () => this.fetchNotifications(socket));
        socket.on('disconnect', () => this.handleDisconnection(socket));
        socket.on('error', this.handleError.bind(this, socket));
    }

    async fetchNotifications(socket) {
        try {
            if (!socket.userId) throw new Error('User not authenticated');
            const notifications = await Notification.find({ user: socket.userId })
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(20);
            socket.emit('notifications', notifications.length ? notifications : []);
        } catch (error) {
            console.error('Error fetching notifications:', error.message);
            socket.emit('error', { message: 'Failed to fetch notifications' });
        }
    }

    async handleMessage(socket, message) {
        console.log('Received message from:', socket.id, message);
        try {
            const { recipientId, content } = message;
            if (!socket.userId) throw new Error('User not authenticated');
            if (!mongoose.Types.ObjectId.isValid(recipientId)) throw new Error('Invalid recipient ID');
            if (!content || typeof content !== 'string') throw new Error('Invalid message content');

            const recipient = await User.findById(recipientId);
            if (!recipient) throw new Error('Recipient not found');

            const newMessage = new Message({
                sender: socket.userId,
                recipient: recipientId,
                content
            });
            await newMessage.save();

            const recipientSocket = this.connections.get(recipientId);
            if (recipientSocket) {
                recipientSocket.emit('message', {
                    _id: newMessage._id,
                    senderId: socket.userId,
                    content,
                    timestamp: newMessage.timestamp,
                    isRead: false
                });
                recipientSocket.emit('new_message', newMessage);
            } else {
                console.log(`Recipient ${recipientId} is not connected`);
            }

            socket.emit('message_sent', { messageId: newMessage._id }); // Confirmation to sender
        } catch (error) {
            console.error('Error processing message:', error.message);
            socket.emit('error', { message: error.message });
        }
    }

    async fetchMessages(socket) {
        try {
            if (!socket.userId) throw new Error('User not authenticated');
            const messages = await Message.find({
                $or: [{ recipient: socket.userId }, { sender: socket.userId }]
            })
                .sort({ createdAt: -1 })
                .limit(20);
            socket.emit('messages', messages);
        } catch (error) {
            console.error('Error fetching messages:', error.message);
            socket.emit('error', { message: 'Failed to fetch messages' });
        }
    }

    async markMessagesRead(socket, messageIds) {
        console.log('Marking messages as read:', messageIds);
        try {
            if (!socket.userId) throw new Error('User not authenticated');
            if (!Array.isArray(messageIds) || !messageIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
                throw new Error('Invalid message IDs');
            }

            const result = await Message.updateMany(
                { _id: { $in: messageIds }, recipient: socket.userId },
                { isRead: true }
            );

            if (result.modifiedCount > 0) {
                socket.emit('messages_marked_read', messageIds);
                console.log(`Marked ${result.modifiedCount} messages as read for user ${socket.userId}`);
            } else {
                console.log('No messages updated');
            }
        } catch (error) {
            console.error('Error marking messages as read:', error.message);
            socket.emit('error', { message: 'Failed to mark messages as read' });
        }
    }

    handleDisconnection(socket) {
        console.log('Client disconnected:', socket.id, 'User:', socket.userId);
        this.connections.delete(socket.userId);
    }

    handleError(socket, error) {
        console.error('Socket error for:', socket.id, error);
        socket.emit('error', { message: 'Internal server error' });
    }
}

module.exports = WebSocketServer;
