// controller/websocket.js
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

class WebSocketTestController {
    constructor() {
        this.io = null;
    }

    initializeSocketIOServer(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            },
            path: '/ws'
        });

        this.io.on('connection', (socket) => {
            console.log('New Socket.IO connection:', socket.id);

            socket.on('test', (data) => {
                console.log('Received test message:', data);
                socket.emit('test_response', {
                    status: 'success',
                    message: 'Test message received'
                });
            });

            socket.on('disconnect', () => {
                console.log('Socket.IO connection closed:', socket.id);
            });
        });
    }

    generateWebSocketTestUrl(userId) {
        console.log('Generating Socket.IO test URL');
        console.log('User ID:', userId);
        console.log('JWT Secret:', process.env.SECRET_KEY);

        if (!process.env.SECRET_KEY) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        try {
            const token = jwt.sign(
                { id: userId.toString() },
                process.env.SECRET_KEY,
                { expiresIn: '1h' }
            );

            const port = process.env.PORT || 5050;
            const url = `http://localhost:${port}/ws?token=${token}`;

            console.log('Generated URL:', url);
            return { url, token };
        } catch (error) {
            console.error('Token generation error:', error);
            throw error;
        }
    }

    async testWebSocketConnection(userId) {
        const { io } = require('socket.io-client');

        try {
            console.log('Starting Socket.IO connection test for user:', userId);
            const { url, token } = this.generateWebSocketTestUrl(userId);

            return new Promise((resolve, reject) => {
                console.log('Attempting to connect to:', url);

                const socket = io('http://localhost:5050', {
                    path: '/ws',
                    query: { token },
                    auth: { token },
                    reconnection: false,
                    timeout: 10000,
                    forceNew: true
                });

                const connectionTimeout = setTimeout(() => {
                    socket.disconnect();
                    reject(new Error('Socket.IO connection timeout'));
                }, 10000);

                socket.on('connect', () => {
                    clearTimeout(connectionTimeout);
                    console.log('Socket.IO connection established');

                    // Optionally send test message (for debugging, not required for resolution)
                    socket.emit('test', {
                        type: 'test',
                        message: 'Socket.IO connection test'
                    });

                    // Resolve immediately with token and URL
                    resolve({
                        status: 'success',
                        url,
                        token, // Include the token in the response
                        message: 'Socket.IO connection established'
                    });

                    // Clean up: disconnect after resolving
                    socket.disconnect();
                });

                socket.on('connect_error', (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('Socket.IO connection error:', error);
                    reject({
                        status: 'error',
                        message: 'Failed to establish Socket.IO connection',
                        error: error.toString(),
                        details: JSON.stringify(error, Object.getOwnPropertyNames(error))
                    });
                    socket.disconnect();
                });

                socket.on('error', (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('Socket.IO error:', error);
                    reject({
                        status: 'error',
                        message: 'Socket.IO error occurred',
                        error: error.toString(),
                        details: JSON.stringify(error, Object.getOwnPropertyNames(error))
                    });
                    socket.disconnect();
                });
            });
        } catch (error) {
            console.error('Socket.IO test failed:', error);
            throw {
                status: 'error',
                message: 'Socket.IO connection test failed',
                error: error.toString(),
                details: JSON.stringify(error, Object.getOwnPropertyNames(error))
            };
        }
    }
}

module.exports = new WebSocketTestController();