const cron = require('node-cron');
const Balance = require('../model/balance');
const User = require('../model/user');
const { getAppDepositRecordList, updateBalance } = require('../utils/ccpayment');

// Function to fetch and log deposits
async function logUserDeposits() {
    try {
        // Find all deposit addresses for the user
        const depositRecordList = await getAppDepositRecordList();
        const { code, msg, data } = JSON.parse(depositRecordList);

        if (code !== 10000 || msg !== "success") {
            console.log("Failed to retrieve deposit record list")
            return;
        }

        const userDeposits = data.records;

        // Process each deposit record
        userDeposits.forEach(async deposit => {
            const referenceId = deposit.referenceId;
            const userId = referenceId.substring(0, 24);
            const recordId = deposit.recordId;
            const amount = parseFloat(deposit.amount);
            const coinId = deposit.coinId;
            const coinName = deposit.coinSymbol;

            await updateBalance(userId, coinId, coinName, amount, recordId);

        });

    } catch (error) {
        console.log("error::", error);
    }
}

// Schedule the cron job to run every minute
cron.schedule('* * * * *', () => {
    console.log('Running deposit logger...');
    logUserDeposits();
});
