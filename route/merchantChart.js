// routes/chartRoutes.js

const express = require('express');
const { getChartData } = require('../controller/merchantChart');

const router = express.Router();

// Define the route
router.get('/chart-data', getChartData);

module.exports = router;