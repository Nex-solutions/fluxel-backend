// controller/chartController.js

const chartData = [
    { month: "MAR", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
    { month: "APR", ETH: 1000, BTC: 4000, USDT: 6000, USDC: 2000 },
    { month: "MAY", ETH: 6000, BTC: 4000, USDT: 3000, USDC: 4000 },
    { month: "JUN", ETH: 1000, BTC: 4000, USDT: 5000, USDC: 3000 },
    { month: "JUL", ETH: 4000, BTC: 0, USDT: 5000, USDC: 2000 },
    { month: "AUG", ETH: 1000, BTC: 4000, USDT: 7000, USDC: 5000 },
    { month: "SEPT", ETH: 3000, BTC: 2000, USDT: 3000, USDC: 4000 },
    { month: "OCT", ETH: 0, BTC: 6000, USDT: 5000, USDC: 3000 },
    { month: "NOV", ETH: 5000, BTC: 4000, USDT: 5000, USDC: 2000 },
    { month: "DEC", ETH: 2000, BTC: 2000, USDT: 3000, USDC: 4000 },
];

const fullData = {
    Daily: [
        { day: "01", ETH: 500, BTC: 300, USDT: 1000, USDC: 700 },
        { day: "02", ETH: 390, BTC: 4783, USDT: 2637, USDC: 1000 },
        { day: "03", ETH: 600, BTC: 500, USDT: 1100, USDC: 900 },
        { day: "04", ETH: 800, BTC: 600, USDT: 1300, USDC: 1000 },
        { day: "05", ETH: 900, BTC: 700, USDT: 1400, USDC: 1100 },
        { day: "06", ETH: 1000, BTC: 800, USDT: 1500, USDC: 1200 },
        { day: "07", ETH: 1100, BTC: 900, USDT: 1600, USDC: 1300 },
        { day: "08", ETH: 1200, BTC: 1000, USDT: 1700, USDC: 1400 },
        { day: "09", ETH: 1300, BTC: 1100, USDT: 1800, USDC: 1500 },
        { day: "10", ETH: 1400, BTC: 1200, USDT: 1900, USDC: 1600 },
    ],
    Weekly: [
        { week: "Week 1", ETH: 2000, BTC: 1500, USDT: 4000, USDC: 3000 },
        { week: "Week 2", ETH: 2500, BTC: 1800, USDT: 4500, USDC: 3200 },
        { week: "Week 3", ETH: 3000, BTC: 2000, USDT: 5000, USDC: 3500 },
        { week: "Week 3", ETH: 3000, BTC: 2000, USDT: 5000, USDC: 3500 },
        { week: "Week 3", ETH: 3000, BTC: 2000, USDT: 5000, USDC: 3500 },
    ],
    Monthly: [
        { month: "JAN", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "FEB", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "MAR", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "APR", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "MAY", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "JUN", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "JUL", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "AUG", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "SEP", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "OCT", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "NOV", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
        { month: "DEC", ETH: 2000, BTC: 2000, USDT: 4000, USDC: 3000 },
    ],
};

async function getChartData(req, res) {
    try {
        const { timeRange = "Monthly" } = req.query; // Default to "Monthly" if no range is provided

        // Get data based on the selected time range
        const data = fullData[timeRange] || [];
        const totalCommission = data.reduce((sum, item) => sum + item.ETH + item.BTC + item.USDT + item.USDC, 0);
        const currentMonthCommission = data[data.length - 1]?.ETH + data[data.length - 1]?.BTC + data[data.length - 1]?.USDT + data[data.length - 1]?.USDC || 0;

        // Send the chart data as a response
        res.status(200).json({
            success: true,
            data,
            totalCommission,
            currentMonthCommission,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch chart data",
        });
    }
}

module.exports = {
    getChartData,
};