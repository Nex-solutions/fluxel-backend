// Import the necessary functions from utils/ccpayment.js
const { v4: uuidv4 } = require('uuid');
const {
    getCoinList,
    getFiatList,
    checkWithdrawalAddressValidity,
    getWithdrawFee,
    getSwapCoinList,
    getChainList,
    getAppCoinAssetList,
    getAppCoinAsset,
    getOrCreateAppDepositAddress,
    getAppDepositRecordList,
    applyAppWithdrawToNetwork,
    getWithdrawRecord,
    applyAppWithdrawToCwallet,
    swapCoins,
    getSwapRecord,
    getSwapRecordList,
    getAllBalances,
    updateBalance,
    getNairaInUsd,
    updateBlc_NTR,
} = require('../utils/ccpayment');
const { addNotifications } = require('../utils/notification')
const { Address } = require('../model/address'); // Import the Address model
const { CryptoWithdrawalHistory } = require('../model/cryptoWithdrawalHistory');
const Balance = require('../model/balance');
const { WithdrawalSession } = require('../model/withdrawalSession');
let { Mail } = require("../middleware/mail");
let mail = new Mail();
let crypto = require('crypto');

// Route handler for getting coin list
async function getCoinListHandler(req, res) {
    try {
        const coinList = await getCoinList();
        res.json({ success: true, data: JSON.parse(coinList) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getFiatListHandler(req, res) {
    try {
        const fiatList = await getFiatList();
        res.json({ success: true, data: JSON.parse(fiatList) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function checkWithdrawalAddressValidityHandler(req, res) {
    try {
        const { chain, address } = req.body;
        const result = await checkWithdrawalAddressValidity(chain, address);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getWithdrawFeeHandler(req, res) {
    try {
        const { coinId, chain } = req.body;
        const result = await getWithdrawFee(coinId, chain);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getSwapCoinListHandler(req, res) {
    try {
        // Get list of all coins with prices
        const coinListResponse = await getCoinList();
        const { code: coinCode, msg: coinMsg, data: coinData } = JSON.parse(coinListResponse);

        if (coinCode !== 10000 || coinMsg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin list",
            });
        }

        // Create map of coin prices
        const coinPriceMap = {};
        for (const coin of coinData.coins) {
            coinPriceMap[coin.coinId] = parseFloat(coin.price);
        }

        // Get swappable coins
        const swapListResponse = await getSwapCoinList();
        const { code, msg, data } = JSON.parse(swapListResponse);

        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve swap coin list"
            });
        }

        // Add price to each swappable coin
        const swapCoinsWithPrices = data.coins.map(coin => ({
            ...coin,
            price: coinPriceMap[coin.coinId] || 0
        }));

        return res.status(200).json({
            status: true,
            message: "Swap coin list retrieved successfully",
            data: {
                ...data,
                coins: swapCoinsWithPrices
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function getChainListHandler(req, res) {
    try {
        const { chains } = req.body;
        const result = await getChainList(chains);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAppCoinAssetListHandler(req, res) {
    try {
        const result = await getAppCoinAssetList();
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAppCoinAssetHandler(req, res) {
    try {
        const { coinId } = req.body;
        const result = await getAppCoinAsset(coinId);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getOrCreateAppDepositAddressHandler(req, res) {
    try {
        const { chain } = req.body;
        const user = req.user; // Assuming user is attached to request

        // Check if user already has an address for this chain
        const existingAddress = await Address.findOne({
            user: user._id,
            chain: chain
        });

        if (existingAddress) {
            return res.json({
                success: true,
                data: {
                    address: existingAddress.address,
                    memo: existingAddress.memo,
                    chain: existingAddress.chain
                }
            });
        }

        // If no existing address, create new one
        const referenceId = `${user._id.toString()}${uuidv4()}`;
        const response = await getOrCreateAppDepositAddress(chain, referenceId);
        const { code, msg, data } = JSON.parse(response);
        if (code === 10000 && msg === "success") {
            const { address, memo } = data;
            try {
                // Save the new address to the database
                const newAddress = new Address({
                    user: user._id,
                    chain: chain,
                    address: address,
                    memo: memo
                });
                await newAddress.save();
                return res.json({ success: true, data: { address, memo, chain } });
            } catch (saveError) {
                // If there's a duplicate key error, we can ignore it since we already have the compound index
                if (saveError.code !== 11000) {
                    throw saveError;
                }
                console.log(`Address already exists for user and chain combination, continuing...`);
            }
        } else {
            console.error(`Failed to generate address for chain: ${chain}`);
            return res.status(500).json({ success: false, error: msg });
        }

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAppDepositRecordListHandler(req, res) {
    try {
        const result = await getAppDepositRecordList();
        console.log("result::", result);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function applyAppWithdrawToNetworkHandler(req, res) {
    try {
        const user = req.user; // Assuming user is attached to the request
        const { coinId, address, amount, chain, memo, sessionId, otp } = req.body;

        // IF OTP AND SESSION ID WAS NOT PRESENT. GENERATE ONE (ELSE VERIFY)
        if (!otp || !sessionId) {
            let otp = crypto.randomBytes(3).toString('hex').toUpperCase();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

            await mail.sendWithdrawalOTPEmail({ email: user.email, otp: otp, createdAt: now });

            const newSession = await WithdrawalSession.create({
                user: user._id,
                otp: otp,
                expiresAt: expiresAt,
                isActive: true,
                verifyCode: false,
                reason: 'CRYPTO'
            });

            return res.status(200).json({
                success: true,
                message: 'Withdrawal Session initiated',
                sessionId: newSession._id
            });
        } else {
            const session = await WithdrawalSession.findOne({
                _id: sessionId,
                isActive: true
            });

            const now = new Date();
            if (!session || now > session.expiresAt) {
                return res.status(403).json({
                    message: "No session found or session expired, please initiate another session"
                });
            }

            if (session.otp !== otp) {
                return res.status(402).json({ message: 'Invalid OTP Code' });
            }

            await WithdrawalSession.findByIdAndUpdate(session._id, {
                verifyCode: true,
                isActive: false
            });
        }

        // Check user's balance
        const userBalance = await Balance.findOne({ user: user._id, coinId });
        const newBalance = userBalance - amount;

        if (!userBalance || userBalance.balance < amount || newBalance <= 0) {
            return res.status(400).json({
                status: false,
                message: "Insufficient balance",
            });
        }

        // Prepare withdrawal details
        const orderId = `${user._id.toString()}${uuidv4()}`;
        const withdrawalDetails = {
            coinId,
            address,
            orderId,
            chain,
            amount: amount.toString(),
            merchantPayNetworkFee: true,
            memo
        };

        // Call the applyAppWithdrawToNetwork function from utils
        const response = await applyAppWithdrawToNetwork(withdrawalDetails);

        // Parse the response
        const { code, msg, data } = JSON.parse(response);
        if (code === 10000 && msg === "success") {
            // Deduct the amount from user's balance
            userBalance.balance -= amount;
            await userBalance.save();

            // Record the withdrawal in history
            const withdrawalHistory = new CryptoWithdrawalHistory({
                user: user._id,
                coinId,
                amount,
                address,
                chain,
                memo,
                orderId,
                status: 'Processing'
            });

            await withdrawalHistory.save();

            const notifications = [
                { user: user, content: `${amount} ${chain} withdrawal to ${address} was successful`, type: 'CRYPTO_WITHDRAWAL' },
            ];

            const notification_object = await addNotifications(notifications);
            if (notification_object) {
                console.log("Notifications added successfully:", notification_object);
            } else {
                console.error("Failed to add notifications.");
            }

            return res.status(200).json({
                status: true,
                message: "Withdrawal applied successfully",
                data: data
            });
        } else {
            return res.status(400).json({
                status: false,
                message: "Failed to apply withdrawal",
                error: msg
            });
        }
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function getWithdrawRecordHandler(req, res) {
    try {
        const { orderId } = req.body;
        const result = await getWithdrawRecord(orderId);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function applyAppWithdrawToCwalletHandler(req, res) {
    try {
        const { coinId, cwalletUser, amount } = req.body;
        const withdrawalDetails = {
            coinId,
            cwalletUser,
            amount
        };
        const result = await applyAppWithdrawToCwallet(withdrawalDetails);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function swapCoinsHandler(req, res) {
    try {
        let user = req.user;
        const { coinIdIn, amountIn, coinIdOut } = req.body;
        const orderId = `${user._id.toString()}${uuidv4()}`;

        const hasCoinIn = await Balance.findOne({ user: user._id, coinId: coinIdIn });

        if (!hasCoinIn) {
            return res.status(400).json({
                status: false,
                message: "Insufficient balance",
            });
        }

        if (hasCoinIn.balance < amountIn) {
            return res.status(400).json({
                status: false,
                message: "Insufficient balance to swap" + hasCoinIn.coinName,
            });
        }

        // Get coin information
        const coinListResponse = await getCoinList();
        const { code: coinListCode, msg: coinListMsg, data: coinListData } = JSON.parse(coinListResponse);

        if (coinListCode !== 10000 || coinListMsg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin information",
            });
        }

        const coinOutInfo = coinListData.coins.find(coin => coin.coinId === coinIdOut);
        const coinInInfo = coinListData.coins.find(coin => coin.coinId === coinIdIn);

        if (!coinOutInfo || !coinInInfo) {
            return res.status(400).json({
                status: false,
                message: "Invalid coin IDs",
            });
        }

        // Call the swapCoins function from utils
        const response = await swapCoins(orderId, coinIdIn, amountIn, coinIdOut);

        // {
        //      "code": 10000, 
        //      "msg": "success", 
        //      "data": 
        //      { 
        //         "recordId": "20250303182320248341967631716352", 
        //         "orderId": "67c5963306b694669adcfd44ba9ade02-90c4-4fc1-ab81-960c48aa44eb", 
        //         "coinIdIn": 1280, 
        //         "coinIdOut": 1282, 
        //         "amountOut": "0.9955520015992803", 
        //         "amountIn": "1", 
        //         "swapRate": "0.9955520015992803", 
        //         "fee": "0.0999550202408916", 
        //         "feeRate": "0.1004016064257028", 
        //         "netAmountOut": "0.8955969813583887" 
        //     } }

        // Parse the response
        const { code, msg, data } = JSON.parse(response);
        if (code === 10000 && msg === "success") {
            // Deduct the amount from coinIn balance
            await updateBalance(
                user._id,
                coinIdIn,
                coinInInfo.symbol,
                -amountIn,
                data.recordId,
                coinInInfo.logoUrl
            );

            console.log("coinOutInfo::", coinOutInfo);

            // Add the netAmountOut to coinOut balance
            await updateBlc_NTR(
                user._id,
                coinIdOut,
                coinOutInfo.symbol,
                parseFloat(data.netAmountOut),
                coinOutInfo.logoUrl
            );

            return res.status(200).json({
                status: true,
                message: "Coins swapped successfully",
                data: data
            });
        } else {
            return res.status(500).json({
                status: false,
                message: "Failed to swap coins",
                error: msg
            });
        }
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function getSwapRecordHandler(req, res) {
    try {
        const { recordId } = req.body;
        const result = await getSwapRecord(recordId);
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getSwapRecordListHandler(req, res) {
    try {
        let user = req.user;

        const result = await getSwapRecordList();
        const coinListResponse = await getCoinList();
        const { code: coinListCode, msg: coinListMsg, data: coinListData } = JSON.parse(coinListResponse);

        const { code, msg, data } = JSON.parse(result);

        const filteredData = {
            ...data,
            records: data.records.filter(record => record.orderId.startsWith(user._id.toString())).map(record => {
                const coinInInfo = coinListData.coins.find(coin => coin.coinId === record.coinIdIn);
                const coinOutInfo = coinListData.coins.find(coin => coin.coinId === record.coinIdOut);

                return {
                    ...record,
                    coinInLogo: coinInInfo?.logoUrl || '',
                    coinOutLogo: coinOutInfo?.logoUrl || ''
                };
            })
        };

        res.json({ success: true, data: { code, msg, data: filteredData } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function createWallets(req, res) {
    try {
        let user = req.user;
        const referenceId = `${user._id.toString()}${uuidv4()}`;

        // Fetch the list of coins
        const coinListResponse = await getCoinList();
        const { code, msg, data } = JSON.parse(coinListResponse);

        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin list",
            });
        }

        const coins = data.coins;
        let chains = [];

        // Iterate over each coin and its networks to collect chains
        for (const coin of coins) {
            const { networks } = coin;

            for (const networkKey in networks) {
                const network = networks[networkKey];
                if (network.canDeposit) {
                    chains.push(network.chain);
                }
            }
        }

        // Remove duplicates by converting the array to a Set and back to an array
        chains = [...new Set(chains)];

        // Log the chains
        console.log("Unique chains that support deposits:", chains);

        let createdAddresses = [];

        // Loop through the unique chains and create addresses
        for (const chain of chains) {
            // Check if the address already exists for this user and chain combination
            const existingAddress = await Address.findOne({ user: user._id, chain: chain });
            if (!existingAddress) {
                const response = await getOrCreateAppDepositAddress(chain, referenceId);
                // Parse the response
                const { code, msg, data } = JSON.parse(response);
                if (code === 10000 && msg === "success") {
                    const { address, memo } = data;
                    try {
                        // Save the new address to the database
                        const newAddress = new Address({
                            user: user._id,
                            chain: chain,
                            address: address,
                            memo: memo
                        });
                        await newAddress.save();
                        createdAddresses.push({ chain, address, memo });
                    } catch (saveError) {
                        // If there's a duplicate key error, we can ignore it since we already have the compound index
                        if (saveError.code !== 11000) {
                            throw saveError;
                        }
                        console.log(`Address already exists for user and chain combination, continuing...`);
                    }
                } else {
                    console.error(`Failed to generate address for chain: ${chain}`);
                }
            } else {
                createdAddresses.push({ chain, address: existingAddress.address, memo: existingAddress.memo });
            }
        }

        return res.status(200).json({
            status: true,
            message: "Addresses created or retrieved successfully",
            data: createdAddresses
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function getUserDeposits(req, res) {
    try {
        const user = req.user;

        // Find all deposit addresses for the user
        const depositRecordList = await getAppDepositRecordList();
        const { code, msg, data } = JSON.parse(depositRecordList);

        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve deposit record list",
            });
        }

        // Filter records where referenceId matches user._id
        const userDeposits = data.records.filter(record =>
            record.referenceId.startsWith(user._id.toString())
        );

        // Find all withdrawals
        let withdraws = await CryptoWithdrawalHistory.find({ user: user._id });

        let newWithdrawals = [];

        console.log('111111111111')

        if (withdraws.length > 0) {
            // Fetch all withdrawal transactions in parallel using promises
            const withdrawPromises = withdraws.map(async (withdraw) => {
                try {
                    const _withdrawTx = await getWithdrawRecord(withdraw.orderId);

                    const { code, msg, data } = JSON.parse(_withdrawTx)

                    console.log("_----------___", code, msg, data)

                    if (code === 10000 && data?.record) {
                        const record = _withdrawTx.data.record;
                        return {
                            ...withdraw.toObject(),
                            amount: `-${record.amount}`,
                            txId: record.txId,
                            status: record.status,
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching withdrawal record for orderId ${withdraw.orderId}:`, error);
                }
                return withdraw.toObject();
            });
            newWithdrawals = await Promise.all(withdrawPromises);
        } else {
            withdraws = [];
        }
        // Send the response with both deposits and withdrawals
        return res.status(200).json({
            status: true,
            message: "User deposits and withdrawals retrieved successfully",
            data: userDeposits
            // {
            //     deposits: userDeposits,
            //     withdrawals: newWithdrawals,
            // },
        });
    } catch (error) {
        console.error("Error in getUserDeposits:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}


async function handleDepositWebhook(req, res) {
    try {
        // Log the incoming webhook data to a file
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../logs/deposit-webhooks.log');

        const logEntry = {
            timestamp: new Date().toISOString(),
            payload: req.body
        };

        fs.appendFileSync(
            logPath,
            JSON.stringify(logEntry) + '\n',
            'utf8'
        );


        // Respond to the webhook
        return res.status(200).json({
            status: true,
            message: "Deposit processed successfully",
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function getUserBalances(req, res) {
    try {
        const user = req.user;

        // Retrieve all balances for the user
        const balances = await getAllBalances(user._id);
        const result = await getNairaInUsd();
        const dollarPerNaira = result.rates["USD"] || 0;

        // Fetch the list of coins to get current prices
        const coinListResponse = await getCoinList();
        const { code, msg, data } = JSON.parse(coinListResponse);

        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin list",
            });
        }

        const coins = data.coins;
        const coinPriceMap = {};
        const coinNetworks = {};
        const coinLogo = {};

        // Create a map of coinId to price
        for (const coin of coins) {
            coinPriceMap[coin.coinId] = parseFloat(coin.price);
            coinNetworks[coin.coinId] = coin.networks;
            coinLogo[coin.coinId] = coin.logoUrl;
        }

        // Calculate USD equivalent for each balance
        const balancesWithUsd = balances.map(balance => {
            let usdEquivalent = 0;
            if (balance.coinId === 1111) {
                usdEquivalent = balance.balance * dollarPerNaira;
            } else {
                usdEquivalent = (balance.balance * (coinPriceMap[balance.coinId] || 0)).toFixed(2);
            }

            return {
                ...balance.toObject(),
                usdEquivalent,
                networks: coinNetworks[balance.coinId],
                logo: balance.coinId === 1111 ? balance.logoUrl : coinLogo[balance.coinId],
            };
        });

        return res.status(200).json({
            status: true,
            message: "User balances retrieved successfully",
            data: balancesWithUsd
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function assignDummyBalance(req, res) {
    try {
        const user = req.user; // Assuming user is attached to the request

        // Check if the user has any balances
        const balances = await getAllBalances(user._id);

        if (balances.length === 0) {
            // Fetch the list of coins
            const coinListResponse = await getCoinList();
            const { code, msg, data } = JSON.parse(coinListResponse);

            if (code !== 10000 || msg !== "success") {
                return res.status(500).json({
                    status: false,
                    message: "Failed to retrieve coin list",
                });
            }

            const coins = data.coins;
            let dummyBalances = [];

            // Assign a 0 balance for each coin
            for (const coin of coins) {
                const { coinId, symbol: coinName, logoUrl } = coin;
                await updateBalance(user._id, coinId, coinName, 0, "dummyrecordid", logoUrl);
                dummyBalances.push({ coinId, coinName, amount: 0, logoUrl });
            }

            return res.status(200).json({
                status: true,
                message: "Dummy balances assigned successfully",
                data: dummyBalances
            });
        } else {
            return res.status(200).json({
                status: true,
                message: "User already has balances",
                data: balances
            });
        }
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function getTotalBalanceInUsd(req, res) {
    try {
        let user = req.user;

        // Retrieve all balances for the user
        const balances = await getAllBalances(user._id);
        const result = await getNairaInUsd();
        const dollarPerNaira = result.rates["USD"] || 0;

        // Fetch the list of coins to get current prices
        const coinListResponse = await getCoinList();
        const { code, msg, data } = JSON.parse(coinListResponse);

        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin list",
            });
        }

        const coins = data.coins;
        const coinPriceMap = {};

        // Create a map of coinId to price
        for (const coin of coins) {
            coinPriceMap[coin.coinId] = parseFloat(coin.price);
        }

        let totalUsdBalance = 0;

        balances.forEach(balance => {

            // for naira coin
            if (balance.coinId === 1111) {
                const usdEquivalent = balance.balance * dollarPerNaira;
                totalUsdBalance += usdEquivalent;

                // for crypto coins
            } else {
                const coinPrice = coinPriceMap[balance.coinId] || 0;
                const usdEquivalent = balance.balance * coinPrice;
                totalUsdBalance += usdEquivalent;
            }
        });

        return res.status(200).json({
            status: true,
            message: "Total balance in USD retrieved successfully",
            data: { totalUsdBalance }
        });
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function getUserTopCryptoHoldingsHandler(req, res) {
    try {
        const user = req.user;

        // Retrieve all balances for the user
        const balances = await getAllBalances(user._id);

        // Fetch the list of coins to get current prices
        const coinListResponse = await getCoinList();
        const { code, msg, data } = JSON.parse(coinListResponse);

        if (code !== 10000 || msg !== "success") {
            return res.status(500).json({
                status: false,
                message: "Failed to retrieve coin list",
            });
        }

        const coins = data.coins;
        const coinPriceMap = {};
        const coinLogoMap = {};

        // Create maps for coin prices and logos
        for (const coin of coins) {
            coinPriceMap[coin.coinId] = parseFloat(coin.price);
            coinLogoMap[coin.symbol] = coin?.logoUrl || '';
        }

        // Step 1: Identify user-held cryptos (only those with balance > 0)
        let userHoldings = [];
        balances.forEach(balance => {
            const coinPrice = coinPriceMap[balance.coinId] || 0;
            const usdEquivalent = (balance.balance * coinPrice).toFixed(2);
            if (parseFloat(usdEquivalent) > 0) {
                userHoldings.push({
                    symbol: balance.coinName,
                    balance: balance.balance,
                    usdEquivalent,
                    logo: balance.logoUrl || coinLogoMap[balance.coinName] || ''
                });
            }
        });

        // Step 2: If the user has 7 or more holdings, return them
        if (userHoldings.length >= 7) {
            return res.status(200).json({
                status: true,
                message: "Cryptocurrency holdings retrieved successfully",
                data: userHoldings.slice(0, 7) // Ensure exactly 7
            });
        }

        // Step 3: Select additional cryptos to complete 7 holdings
        const allAvailableSymbols = coins.map(coin => coin.symbol);
        const userHeldSymbols = userHoldings.map(holding => holding.symbol);

        // Get random coins not already in user's holdings
        const randomCoins = allAvailableSymbols
            .filter(symbol => !userHeldSymbols.includes(symbol)) // Avoid duplicates
            .sort(() => Math.random() - 0.5) // Shuffle randomly
            .slice(0, 7 - userHoldings.length); // Pick only needed amount

        const additionalHoldings = randomCoins.map(symbol => ({
            symbol,
            balance: 0,
            usdEquivalent: 0,
            logo: coinLogoMap[symbol] || ''
        }));

        // Step 4: Merge user holdings and additional holdings (ensuring exactly 7)
        const finalHoldings = [...userHoldings, ...additionalHoldings].slice(0, 7);


        return res.status(200).json({
            status: true,
            message: "Cryptocurrency holdings retrieved successfully",
            data: finalHoldings
        });

    } catch (error) {
        console.error("Error fetching cryptocurrency holdings:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}


module.exports = {
    getCoinListHandler,
    getFiatListHandler,
    checkWithdrawalAddressValidityHandler,
    getWithdrawFeeHandler,
    getSwapCoinListHandler,
    getChainListHandler,
    getAppCoinAssetListHandler,
    getAppCoinAssetHandler,
    getOrCreateAppDepositAddressHandler,
    getAppDepositRecordListHandler,
    applyAppWithdrawToNetworkHandler,
    getWithdrawRecordHandler,
    applyAppWithdrawToCwalletHandler,
    swapCoinsHandler,
    getSwapRecordHandler,
    getSwapRecordListHandler,
    createWallets,
    getUserDeposits,
    handleDepositWebhook,
    getUserBalances,
    assignDummyBalance,
    getTotalBalanceInUsd,
    getUserTopCryptoHoldingsHandler,
};
