const https = require('https');
const crypto = require('crypto');
require("dotenv").config();
const Balance = require('../model/balance');
const { SwapFee } = require('../model/swapFee');
const { BalanceTxHistory } = require('../model/balanceTxHistory');
const { default: axios } = require('axios');

const appId = process.env.CCPAYMENT_APP_ID;
const appSecret = process.env.CCPAYMENT_APP_SECRET;

function isTimeoutError(err) {
    return err.code === "ETIMEDOUT";
}

/**
 * Makes a request to CCPayment API with the given path and args
 * @param {string} path - API endpoint path
 * @param {object|string} args - Request body arguments
 * @param {number} retryCount - Number of retry attempts for timeout errors
 * @returns {Promise<string>} - Resolves with API response
 */
function makeRequest(path, args = "", retryCount = 3) {
    return new Promise((resolve, reject) => {
        const timestamp = Math.floor(Date.now() / 1000);
        let signText = appId + timestamp;
        if (args) {
            signText += args;
        }

        const sign = crypto
            .createHmac("sha256", appSecret)
            .update(signText)
            .digest("hex");

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Appid": appId,
                "Sign": sign,
                "Timestamp": timestamp.toString(),
            },
            timeout: 15000,
        };

        const req = https.request(path, options, (res) => {
            let respData = "";

            res.on("data", (chunk) => {
                respData += chunk;
            });

            res.on("end", () => {
                resolve(respData);
            });
        });

        req.on("error", (err) => {
            if (isTimeoutError(err) && retryCount > 0) {
                setTimeout(() => {
                    resolve(makeRequest(path, args, retryCount - 1));
                }, 200);
            } else {
                reject(err);
            }
        });

        req.write(args);
        req.end();
    });
}

/**
 * Function to fetch coin list from CCPayment API
 * @returns {Promise<string>} - Resolves with API response
 */
function getCoinList() {
    return makeRequest("https://ccpayment.com/ccpayment/v2/getCoinList");
}

/**
 * Function to fetch fiat list from CCPayment API
 * @returns {Promise<string>} - Resolves with API response
 */
function getFiatList() {
    return makeRequest("https://ccpayment.com/ccpayment/v2/getFiatList");
}

/**
 * Function to check if a withdrawal address is valid for a given chain
 * @param {string} chain - Blockchain network (e.g. "POLYGON")
 * @param {string} address - Wallet address to validate
 * @returns {Promise<string>} - Resolves with API response
 */
function checkWithdrawalAddressValidity(chain, address) {
    const args = JSON.stringify({
        chain: chain,
        address: address
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/checkWithdrawalAddressValidity", args);
}

/**
 * Function to get withdrawal fee for a given coin and chain
 * @param {number} coinId - ID of the coin
 * @param {string} chain - Blockchain network (e.g. "POLYGON")
 * @returns {Promise<string>} - Resolves with API response
 */
function getWithdrawFee(coinId, chain) {
    const args = JSON.stringify({
        coinId: coinId,
        chain: chain
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/getWithdrawFee", args);
}

/**
 * Function to get swap coin list from CCPayment API
 * @returns {Promise<string>} - Resolves with API response
 */
function getSwapCoinList() {
    return makeRequest("https://ccpayment.com/ccpayment/v2/getSwapCoinList");
}

/**
 * Function to swap coins using CCPayment API
 * @param {string} orderId - Order ID for the swap
 * @param {number} coinIdIn - ID of input coin
 * @param {string} amountIn - Amount of input coin
 * @param {number} coinIdOut - ID of output coin
 * @returns {Promise<string>} - Resolves with API response
 */
function swapCoins(orderId, coinIdIn, amountIn, coinIdOut) {
    const args = JSON.stringify({
        orderId: orderId,
        coinIdIn: coinIdIn,
        amountIn: amountIn,
        coinIdOut: coinIdOut
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/swap", args);
}

/**
 * Function to get swap record details
 * @param {string} recordId - Record ID of the swap
 * @returns {Promise<string>} - Resolves with API response
 */
function getSwapRecord(recordId) {
    const args = JSON.stringify({
        recordId: recordId
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/getSwapRecord", args);
}

/**
 * Function to get list of swap records
 * @returns {Promise<string>} - Resolves with API response containing list of swap records
 */
function getSwapRecordList() {
    return makeRequest("https://ccpayment.com/ccpayment/v2/getSwapRecordList");
}

/**
 * Function to get chain list from CCPayment API
 * @param {string[]} chains - Array of chain names (e.g. ["ETH", "POLYGON"])
 * @returns {Promise<string>} - Resolves with API response
 */
function getChainList(chains) {
    const args = JSON.stringify({
        chains: chains
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/getChainList", args);
}

/**
 * Function to get app coin asset list from CCPayment API
 * @returns {Promise<string>} - Resolves with API response
 */
function getAppCoinAssetList() {
    return makeRequest("https://ccpayment.com/ccpayment/v2/getAppCoinAssetList");
}

/**
 * Function to get app coin asset details from CCPayment API
 * @param {number} coinId - ID of the coin to get details for
 * @returns {Promise<string>} - Resolves with API response
 */
function getAppCoinAsset(coinId) {
    const args = JSON.stringify({
        coinId: coinId
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/getAppCoinAsset", args);
}

/**
 * Function to apply for app withdrawal to network
 * @param {object} withdrawalDetails - Withdrawal details including coinId, address, amount, etc
 * @returns {Promise<string>} - Resolves with API response
 */
function applyAppWithdrawToNetwork(withdrawalDetails) {
    const args = JSON.stringify({
        coinId: withdrawalDetails.coinId,
        address: withdrawalDetails.address,
        orderId: withdrawalDetails.orderId,
        chain: withdrawalDetails.chain,
        amount: withdrawalDetails.amount,
        merchantPayNetworkFee: withdrawalDetails.merchantPayNetworkFee,
        memo: withdrawalDetails.memo
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/applyAppWithdrawToNetwork", args);
}

/**
 * Function to apply for app withdrawal to cwallet
 * @param {object} withdrawalDetails - Withdrawal details including coinId, cwalletUser, amount
 * @returns {Promise<string>} - Resolves with API response
 */
function applyAppWithdrawToCwallet(withdrawalDetails) {
    const args = JSON.stringify({
        coinId: withdrawalDetails.coinId,
        cwalletUser: withdrawalDetails.cwalletUser,
        orderId: withdrawalDetails.orderId,
        amount: withdrawalDetails.amount
    });
    return makeRequest("https://ccpayment.com/ccpayment/v2/applyAppWithdrawToCwallet", args);
}

/**
 * Function to get withdrawal record details
 * @param {string} orderId - Order ID of the withdrawal
 * @returns {Promise<string>} - Resolves with API response
 */
async function getWithdrawRecord(orderId) {
    const args = JSON.stringify({ orderId });
    const res = await makeRequest("https://ccpayment.com/ccpayment/v2/getAppWithdrawRecord", args)
        .then((response) => {
            return response;
        })
        .catch((error) => {
            console.error("Error querying withdrawal record:", error);
            throw error;
        });
    return res;
}

/**
 * Function to get app deposit record from CCPayment API
 * @param {string} recordId - ID of the deposit record to retrieve
 * @returns {Promise<string>} - Resolves with API response
 */
async function getAppDepositRecord(recordId) {
    const args = JSON.stringify({
        recordId: recordId,
    });
    const res = await makeRequest("https://ccpayment.com/ccpayment/v2/getAppDepositRecord", args);
    return res;
}

/**
 * Function to get app deposit record list from CCPayment API
 * @returns {Promise<string>} - Resolves with API response
 */
async function getAppDepositRecordList() {
    const res = await makeRequest("https://ccpayment.com/ccpayment/v2/getAppDepositRecordList");
    return res;
}

/**
 * Function to get or create an app deposit address from CCPayment API
 * @param {string} chain - Blockchain network (e.g. "POLYGON")
 * @returns {Promise<string>} - Resolves with API response
 */
async function getOrCreateAppDepositAddress(chain, referenceId) {
    const args = JSON.stringify({
        referenceId: referenceId,
        chain: chain
    });
    const res = await makeRequest("https://ccpayment.com/ccpayment/v2/getOrCreateAppDepositAddress", args);
    return res;
}

/**
 * Update the balance for a user and coin.
 * @param {ObjectId} userId - The user's ID.
 * @param {Number} coinId - The coin's ID.
 * @param {String} coinName - The coin's name.
 * @param {Number} amount - The amount to add or subtract from the balance.
 * @param {String} logoUrl - The URL of the coin's logo.
 * @param {String} recordId - The record ID of the transaction.
 * @returns {Promise<Object>} - The updated balance document.
 */
async function updateBalance(userId, coinId, coinName, amount, recordId, logoUrl) {
    try {
        // Check if the transaction history already exists
        const existingHistory = await BalanceTxHistory.findOne({ user: userId, recordId });

        if (existingHistory) {
            console.log("Transaction already processed for this record.");
            return false; // Return false if the transaction has already been processed
        }

        // Update the balance
        const balance = await Balance.findOneAndUpdate(
            { user: userId, coinId: coinId },
            { $inc: { balance: amount }, coinName: coinName, updatedAt: new Date(), logoUrl: logoUrl },
            { new: true, upsert: true }
        );

        // Record the transaction in history
        const balanceTxHistory = new BalanceTxHistory({
            user: userId,
            coinId,
            amount,
            recordId
        });

        await balanceTxHistory.save();

        return balance;
    } catch (error) {
        console.error("Error updating balance:", error);
        throw error;
    }
}



/**
 * Update the balance for a user and coin.
 * @param {ObjectId} userId - The user's ID.
 * @param {Number} coinId - The coin's ID.
 * @param {String} coinName - The coin's name.
 * @param {Number} amount - The amount to add or subtract from the balance.
 * @param {String} logoUrl - The URL of the coin's logo.
 * @param {String} recordId - The record ID of the transaction.
 * @returns {Promise<Object>} - The updated balance document.
 */
// NTR - Never Track Recordid
async function updateBlc_NTR(userId, coinId, coinName, amount, logoUrl) {
    try {
        // Update the balance
        const balance = await Balance.findOneAndUpdate(
            { user: userId, coinId: coinId },
            { $inc: { balance: amount }, coinName: coinName, updatedAt: new Date(), logoUrl: logoUrl },
            { new: true, upsert: true }
        );
        return balance;
    } catch (error) {
        console.error("Error updating balance:", error);
        throw error;
    }
}

/**
 * Retrieve the balance for a user and coin.
 * @param {ObjectId} userId - The user's ID.
 * @param {Number} coinId - The coin's ID.
 * @returns {Promise<Object>} - The balance document.
 */
async function getBalance(userId, coinId) {
    try {
        const balance = await Balance.findOne({ user: userId, coinId: coinId });
        return balance;
    } catch (error) {
        console.error("Error retrieving balance:", error);
        throw error;
    }
}

/**
 * Retrieve all balances for a user.
 * @param {ObjectId} userId - The user's ID.
 * @returns {Promise<Array>} - An array of balance documents.
 */
async function getAllBalances(userId) {
    try {
        const balances = await Balance.find({ user: userId });
        return balances;
    } catch (error) {
        console.error("Error retrieving all balances:", error);
        throw error;
    }
}

/**
 * Calculate the swap fee for a given transaction amount.
 * @param {Number} amount - The transaction amount.
 * @returns {Promise<Object>} - An object containing the platform fee, API payment fee, and total fee.
 */
async function calculateSwapFee(amount) {
    try {
        const feeStructure = await SwapFee.findOne();
        if (!feeStructure) {
            throw new Error("Swap fee structure not found");
        }
        const platformFee = (amount * feeStructure.platformFeePercentage) / 100;
        const apiPaymentFee = (amount * feeStructure.apiPaymentFeePercentage) / 100;
        const totalFee = platformFee + apiPaymentFee;
        return {
            platformFee,
            apiPaymentFee,
            totalFee,
            netAmount: amount - totalFee
        };
    } catch (error) {
        console.error("Error calculating swap fee:", error);
        throw error;
    }
}

// maia in usd
async function getNairaInUsd() {
    const res = await axios.get("https://api.exchangerate-api.com/v4/latest/NGN");
    return res.data;
}

module.exports = {
    getCoinList,
    getFiatList,
    checkWithdrawalAddressValidity,
    getWithdrawFee,
    getSwapCoinList,
    getChainList,
    getAppCoinAssetList,
    getAppCoinAsset,
    getOrCreateAppDepositAddress,
    getAppDepositRecord,
    getAppDepositRecordList,
    applyAppWithdrawToNetwork,
    applyAppWithdrawToCwallet,
    getWithdrawRecord,
    swapCoins,
    getSwapRecord,
    getSwapRecordList,
    updateBalance,
    updateBlc_NTR,
    getBalance,
    getAllBalances,
    calculateSwapFee,
    getNairaInUsd
};