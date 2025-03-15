const { getAccountBalance, getBanksList, createRecipient, createTransaction, createVirtualAccount } = require('../utils/lenco');
const { NairaAccount } = require('../model/nairaAccount');
const { NairaTxHistory } = require('../model/nairaTxHistory');
const { LencoFundAccount } = require('../model/lencoFundAccount');
const { updateBalance } = require('../utils/ccpayment');
const { addNotifications } = require('../utils/notification');
const { WithdrawalSession } = require('../model/withdrawalSession');
let { Mail } = require("../middleware/mail");
let mail = new Mail();
let crypto = require('crypto');

const { v4: uuidv4 } = require('uuid');

async function getAccountBalanceHandler(req, res) {
    try {
        const balance = await getAccountBalance();
        return res.status(200).json({
            status: true,
            message: "Account balance retrieved successfully",
            data: { balance }
        });
    } catch (error) {
        console.error("Error fetching account balance:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function getBanksListHandler(req, res) {
    try {
        const banksList = await getBanksList();
        return res.status(200).json({
            status: true,
            message: "Banks list retrieved successfully",
            data: banksList
        });
    } catch (error) {
        console.error("Error fetching banks list:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function createRecipientHandler(req, res) {
    try {
        const { accountNumber, bankCode } = req.body;
        const user = req.user;

        if (!accountNumber || !bankCode) {
            return res.status(400).json({
                status: false,
                message: "Account number and bank code are required"
            });
        }

        // Check if the recipient already exists
        const existingAccount = await NairaAccount.findOne({ accountNumber, bankCode, user: user._id });
        if (existingAccount) {
            return res.status(200).json({
                status: true,
                message: "Recipient already exists",
                data: existingAccount
            });
        }

        const recipient = await createRecipient(accountNumber, bankCode);

        if (recipient.status) {
            const recipientData = recipient.data;
            const bankAccount = recipientData.bankAccount;

            // Save the recipient details to the database
            const nairaAccount = new NairaAccount({
                user: user._id,
                recipientId: recipientData.id,
                accountName: bankAccount.accountName,
                accountNumber: bankAccount.accountNumber,
                bankCode: bankAccount.bank.code,
                bankName: bankAccount.bank.name
            });

            const newAccount = await nairaAccount.save();

            return res.status(201).json({
                status: true,
                message: "Recipient created successfully",
                data: newAccount
            });
        }

        return res.status(400).json({
            status: false,
            message: "Error creating the recipient account",
            data: {},
        });

    } catch (error) {
        console.error("Error creating recipient:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function getUserNairaAccountsHandler(req, res) {
    try {
        const user = req.user; // Assuming user is attached to the request

        // Retrieve all Naira accounts for the user
        const nairaAccounts = await NairaAccount.find({ user: user._id });

        return res.status(200).json({
            status: true,
            message: "Naira accounts retrieved successfully",
            data: nairaAccounts
        });
    } catch (error) {
        console.error("Error fetching Naira accounts:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function createTransactionHandler(req, res) {
    try {
        const { recipientId, amount, sessionId, otp } = req.body;
        const user = req.user; // Assuming user is attached to the request

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
                reason: 'NAIRA'
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


        if (!recipientId || !amount) {
            return res.status(400).json({
                status: false,
                message: "Recipient ID and amount are required"
            });
        }

        // Retrieve the recipient's account details from the database
        const nairaAccount = await NairaAccount.findOne({ recipientId, user: user._id });

        if (!nairaAccount) {
            return res.status(404).json({
                status: false,
                message: "Recipient not found"
            });
        }

        // first remove the balance from the user's balance
        await updateBalance(user._id, 1111, "NGN", -Number(amount), user._id.toString() + uuidv4());

        // Create the transaction
        const transactionResponse = await createTransaction({
            recipientId,
            accountNumber: nairaAccount.accountNumber,
            bankCode: nairaAccount.bankCode,
            amount
        });

        if (transactionResponse.status) {
            const transactionData = transactionResponse.data;

            // Save the transaction details to the database
            const nairaTxHistory = new NairaTxHistory({
                user: user._id,
                transactionId: transactionData.id,
                amount: parseFloat(transactionData.amount),
                fee: parseFloat(transactionData.fee),
                narration: transactionData.narration,
                type: transactionData.type,
                status: transactionData.status,
                accountId: transactionData.accountId,
                accountName: transactionData.details.accountName,
                accountNumber: transactionData.details.accountNumber,
                bankCode: transactionData.details.bank.code,
                bankName: transactionData.details.bank.name,
                clientReference: transactionData.clientReference,
                transactionReference: transactionData.transactionReference,
                initiatedAt: transactionData.initiatedAt,
                completedAt: transactionData.completedAt,
                failedAt: transactionData.failedAt,
                reasonForFailure: transactionData.reasonForFailure
            });

            await nairaTxHistory.save();

            const notifications = [
                { user: user, content: `${amount} Naira withdrawal was initiated successfully`, type: 'NAIRA_WITHDRAWAL' }
            ];

            const notification_object = await addNotifications(notifications);
            if (notification_object) {
                console.log("Notifications added successfully:", notification_object);
            } else {
                console.error("Failed to add notifications.");
            }

            return res.status(200).json({
                status: true,
                message: "Transaction initiated successfully",
                data: transactionData
            });
        }

        return res.status(400).json({
            status: false,
            message: "Error initiating transaction",
            data: transactionResponse
        });
    } catch (error) {
        console.error("Error initiating transaction:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

async function createVirtualAccountHandler(req, res) {
    try {
        const user = req.user;
        let accountName = user.name;
        const { bvn } = req.body;

        if (!accountName) {
            return res.status(400).json({
                status: false,
                message: "accountName is required"
            });
        }

        // Check if the user already has a virtual account
        const existingAccount = await LencoFundAccount.findOne({ user: user._id });

        // if (existingAccount) {
        //     const now = new Date();
        //     const expiryDate = new Date(existingAccount.expiresAt);

        //     if (expiryDate > now) {
        //         return res.status(200).json({
        //             status: true,
        //             message: "Virtual account already exists",
        //             data: existingAccount
        //         });
        //     } else {
        //         // Expired account found, delete it
        //         await LencoFundAccount.deleteOne({ _id: existingAccount._id });
        //         console.log("Expired virtual account deleted");
        //     }
        // }


        // create a naira balance for the user
        const nairaLogo = "https://cdn-icons-png.flaticon.com/512/32/32974.png";
        await updateBalance(user._id, 1111, "NGN", 0, user._id.toString() + uuidv4(), nairaLogo);

        if (existingAccount) {
            return res.status(200).json({
                status: true,
                message: "Virtual account already exists..",
                data: existingAccount
            });
        }

        // Create a new virtual account
        const virtualAccount = await createVirtualAccount({ accountName, userId: user._id, bvn });

        if (virtualAccount.status) {
            const accountData = virtualAccount.data;
            const bankAccount = accountData.bankAccount;

            // Save the new virtual account details to the database
            const lencoFundAccount = new LencoFundAccount({
                user: user._id,
                accountId: accountData.id,
                accountReference: accountData.accountReference,
                accountName: bankAccount.accountName,
                accountNumber: bankAccount.accountNumber,
                bankCode: bankAccount.bank.code,
                bankName: bankAccount.bank.name,
                type: accountData.type,
                status: accountData.status,
                createdAt: accountData.createdAt,
                expiresAt: accountData.expiresAt,
                currency: accountData.currency,
                meta: {
                    transactionReference: accountData.meta.transactionReference,
                    bvn: accountData.meta.bvn,
                    isStatic: accountData.meta.isStatic
                }
            });

            await lencoFundAccount.save();



            return res.status(201).json({
                status: true,
                message: "Virtual account created successfully",
                data: lencoFundAccount
            });
        }

        return res.status(400).json({
            status: false,
            message: "Error creating virtual account",
            data: virtualAccount
        });
    } catch (error) {
        console.error("Error creating virtual account:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}


async function getTempAccount(req, res) {
    try {
        const user = req.user;
        let accountName = user.name;
        if (!accountName) {
            return res.status(400).json({
                status: false,
                message: "accountName is required"
            });
        }


        // const existingAccount = await LencoFundAccount.findOne({ user: user._id });

        // if (existingAccount && existingAccount.meta.isStatic) {
        //     const now = new Date();
        //     const expiryDate = new Date(existingAccount.expiresAt);

        //     // Add 5 minutes buffer time before considering account expired
        //     const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        //     if (expiryDate - now > fiveMinutes) {
        //         return res.status(200).json({
        //             status: true,
        //             message: "Virtual account already exists",
        //             data: existingAccount
        //         });
        //     } else {
        //         // Account expired or will expire in less than 5 minutes, delete it
        //         await LencoFundAccount.deleteOne({ _id: existingAccount._id });
        //         console.log("Expired virtual account deleted");
        //     }
        // }


        // create a naira balance for the user
        const nairaLogo = "https://cdn-icons-png.flaticon.com/512/32/32974.png";
        await updateBalance(user._id, 1111, "NGN", 0, user._id.toString() + uuidv4(), nairaLogo);

        // if (existingAccount) {
        //     return res.status(200).json({
        //         status: true,
        //         message: "Virtual account already exists..",
        //         data: existingAccount
        //     });
        // }

        // Create a new virtual account
        const virtualAccount = await createVirtualAccount({ accountName, userId: user._id });

        if (virtualAccount.status) {
            const accountData = virtualAccount.data;
            const bankAccount = accountData.bankAccount;

            // Save the new virtual account details to the database
            const lencoFundAccount = new LencoFundAccount({
                user: user._id,
                accountId: accountData.id,
                accountReference: accountData.accountReference,
                accountName: bankAccount.accountName,
                accountNumber: bankAccount.accountNumber,
                bankCode: bankAccount.bank.code,
                bankName: bankAccount.bank.name,
                type: accountData.type,
                status: accountData.status,
                createdAt: accountData.createdAt,
                expiresAt: accountData.expiresAt,
                currency: accountData.currency,
                meta: {
                    transactionReference: accountData.meta.transactionReference,
                    bvn: accountData.meta.bvn,
                    isStatic: accountData.meta.isStatic
                }
            });

            await lencoFundAccount.save();



            return res.status(201).json({
                status: true,
                message: "Virtual account created successfully",
                data: lencoFundAccount
            });
        }

        return res.status(400).json({
            status: false,
            message: "Error creating virtual account",
            data: virtualAccount
        });
    } catch (error) {
        console.error("Error creating virtual account:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}


const handleWebhook = (req, res) => {
    try {
        let event = req.event;
        console.log("Received webhook event:", event);

        // {
        //       event: 'transaction.successful',
        //       data: {
        //         id: '3275496a-25e4-4b72-933b-2187ba9aa43f',
        //         amount: '10750.00',
        //         fee: '26.88',
        //         narration: 'To PAYSTACK CHECKOUT / payment / Lenco 25116613f4',
        //         type: 'debit',
        //         initiatedAt: '2025-03-07T23:31:52.000Z',
        //         completedAt: '2025-03-07T23:32:04.000Z',
        //         failedAt: null,
        //         accountId: '4644123b-b4e7-4f68-94a0-91a43d492a18',
        //         details: {
        //           accountName: 'PAYSTACK CHECKOUT',
        //           accountNumber: '9965706135',
        //           bank: [Object]
        //         },
        //         status: 'successful',
        //         reasonForFailure: null,
        //         clientReference: null,
        //         transactionReference: '25116613f4',
        //         nipSessionId: '999999250308003157635761645010'
        //       }
        //     }



        // another transaction event

        // {
        //       event: 'virtual-account.rejected-transaction',
        //       data: {
        //         id: '710a5346-323a-49b3-9f6c-df170699dc94',
        //         transactionAmount: '50.00',
        //         currency: 'NGN',
        //         narration: 'FROM PALMPAY/ KEHINDE PELUMI ADEMOLA-KEHINDE PELUMI ADEMOLA:8108498996/100033250308094306452249161135',
        //         details: {
        //           accountName: 'KEHINDE PELUMI ADEMOLA',
        //           accountNumber: '8108498996',
        //           bank: [Object]
        //         },
        //         virtualAccount: {
        //           id: '37fd31ff-ebf1-4033-8474-08bd51e410af',
        //           accountReference: '82e36a17-816c-44d5-835f-019360f923ff',
        //           bankAccount: [Object],
        //           type: 'Dynamic Virtual Account',
        //           status: 'expired',
        //           createdAt: '2025-03-08T09:22:14.648Z',
        //           expiresAt: '2025-03-08T09:42:13.000Z',
        //           currency: 'NGN',
        //           meta: [Object]
        //         },
        //         accountReference: '82e36a17-816c-44d5-835f-019360f923ff',
        //         datetime: '2025-03-08T09:43:11.000Z',
        //         nipSessionId: '100033250308094306452249161135',
        //         transactionReference: '67cb9f1bef18eee65e757818fba3d0f9-a3f7-44b3-be67-19431f1c54d3',
        //         reason: { code: '11', message: 'Duplicate payment' }
        //       }
        //     }

        return res.sendStatus(200); // HTTP 200 OK
    } catch (error) {
        console.error("Webhook handling error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports = {
    getAccountBalanceHandler,
    getBanksListHandler,
    createRecipientHandler,
    getUserNairaAccountsHandler,
    createTransactionHandler,
    createVirtualAccountHandler,
    handleWebhook,
    getTempAccount,
}; 