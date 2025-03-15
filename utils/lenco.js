const http = require('https');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const axios = require("axios")

// Environment Variables
const { LENCO_HOSTNAME, LENCO_API_KEY, LENCO_ACCOUNT_UUID, LENCO_API_BASE_URL } = process.env;

// Function to retrieve account balance of a specific bank account
const getAccountBalance = () => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            hostname: LENCO_HOSTNAME,
            port: null,
            path: `/access/v1/account/${LENCO_ACCOUNT_UUID}/balance`,
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${LENCO_API_KEY}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const returns = JSON.parse(data)

                    if (returns && returns.status) {
                        resolve(Number(returns.data.availableBalance))
                    }
                    resolve(0);
                } catch (error) {
                    resolve(0)
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
};

// Function to get the list of banks and financial institutions
const getBanksList = () => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            hostname: LENCO_HOSTNAME,
            port: null,
            path: '/access/v1/banks',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${LENCO_API_KEY}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error('Failed to parse response data'));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
};

// Function to create a new recipient
const createRecipient = (accountNumber, bankCode) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            hostname: LENCO_HOSTNAME,
            port: null,
            path: '/access/v1/recipients',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Bearer ${LENCO_API_KEY}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error('Failed to parse response data'));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(JSON.stringify({ accountNumber, bankCode }));
        req.end();
    });
};

// Function to create a new transaction
const createTransaction = ({ recipientId, accountNumber, bankCode, amount }) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            hostname: LENCO_HOSTNAME,
            port: null,
            path: '/access/v1/transactions',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Bearer ${LENCO_API_KEY}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error('Failed to parse response data'));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(JSON.stringify({
            accountId: LENCO_ACCOUNT_UUID,
            recipientId,
            accountNumber,
            bankCode,
            amount,
            narration: "Fluxel Withdrawal",
            reference: uuidv4(),
            senderName: "Fluxel"
        }));

        req.end();
    });
};

const createVirtualAccount = async ({ accountName, userId, bvn }) => {
    try {
        const response = await axios.post(
            `${LENCO_API_BASE_URL}/virtual-accounts`,
            {
                isStatic: bvn ? true : false,
                createNewAccount: true,
                accountName: accountName + `-${process.env.APP_NAME || "Fluxel"}`,
                // minAmount: 1000,
                transactionReference: `${userId}${uuidv4()}`,
                bvn: bvn ? bvn : null,
            },
            {
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    Authorization: `Bearer ${LENCO_API_KEY}`
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Failed to create virtual account");
    }
};

module.exports = {
    getAccountBalance,
    getBanksList,
    createRecipient,
    createTransaction,
    createVirtualAccount,
};