// Import dependencies
let express = require('express');
let session = require('express-session');
let mongoose = require('mongoose');
let swaggerUi = require('swagger-ui-express');
let cookieParser = require('cookie-parser');
let cors = require("cors");
let passport = require('passport');
require('dotenv').config();
const path = require("path");
const rateLimit = require('express-rate-limit');
let helmet = require('helmet');
let xss = require('xss-clean');

let morgan = require('morgan');
const http = require('http');
let swaggerSpec = require('./utils/swaggerConfig');
let authRoutes = require('./route/auth');
let adminRoutes = require('./route/admin.js');
let webhookRoutes = require('./route/webhook');
let userRoutes = require('./route/user');
let twoFactorAuth = require("./route/twoFactorAuth")
let ccpaymentRoutes = require('./route/ccpayment');
let adRoutes = require('./route/ad');
let transactionRoutes = require('./route/transaction');
let { googleLogin } = require('./controller/auth');
let lencoRoutes = require('./route/lenco');
let internalTransferRoutes = require('./route/internalTransfer');
let merchantChartRoutes = require('./route/merchantChart');
let referrerRoutes = require('./route/referrer');
const WebSocketServer = require('./websocket/index');
const websocketTestRoutes = require('./route/websocketTest');
const AdvertisementRoutes = require('./route/advertisement');
const OrderRoutes = require('./route/order');

const app = express();
const server = http.createServer(app);

// Set default port if not provided
const PORT = process.env.PORT || 5050;
console.log('Server running on port:', PORT);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));
app.use(helmet());
app.use(xss());
app.use(morgan('dev'));

const corsOptions = {
    origin: [
        process.env.WEB_BASE_URL,
        process.env.SERVER_URL,
        `http://localhost:${PORT}`,
        'http://localhost:5173',
        'http://127.0.0.1:5500',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

// Initialize WebSocketServer with /ws path
const wsServer = new WebSocketServer(server, {
    path: '/ws',
    cors: corsOptions
});

// Make WebSocketServer available to routes
app.set('websocketServer', wsServer);

// app.use(cors(corsOptions));
app.use(cors());

app.use(passport.initialize());
require('./utils/googleAuth');

const minutesLimit = process.env.MINUTES_LIMIT || 15;
const maxRequests = process.env.MAX_REQUESTS || 100;

const apiLimiter = rateLimit({
    windowMs: 60 * 1000 * minutesLimit,
    max: maxRequests,
    message: "Too many requests from this IP, please try again later."
});

// app.use('/api/', apiLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/user", userRoutes);
app.use("/api/2fa", twoFactorAuth)
app.use("/api/ccpayment", ccpaymentRoutes);
app.use("/api/ad", adRoutes);
app.use("/api/transaction", transactionRoutes);
app.use('/api/lenco', lencoRoutes);
app.use("/api/internalTransfer", internalTransferRoutes);
app.use("/api/chart", merchantChartRoutes);
app.use("/api/referrer", referrerRoutes);

app.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get('/google/callback', passport.authenticate('google',
    { failureRedirect: `${process.env.WEB_BASE_URL}` }), googleLogin);
app.use('/api/websocket', websocketTestRoutes);
app.use('/api/advertisement', AdvertisementRoutes);
app.use('/api/order', OrderRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Import and start cron jobs
require('./cronJobs');

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
