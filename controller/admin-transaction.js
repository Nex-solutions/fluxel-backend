// let { Transaction } = require('../model/transaction');
const  Balance  = require('../model/balance');
const { CryptoWithdrawalHistory } = require('../model/cryptoWithdrawalHistory');
const { NairaTxHistory } = require('../model/nairaTxHistory');
const User = require('../model/user')
const { getAppCoinAsset } = require('../utils/ccpayment');
const { generateUniqueTransactionId } = require('../utils/helper')
require("dotenv").config();

const GetAllBalances = async (req, res) => {
    try {
        // Extract query parameters
        const { page = 1, limit = 10, coinId, coinName } = req.query;

        // Convert page and limit to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};

        if (coinId) filter.coinId = coinId;
        
        if (coinName) filter.coinName = coinName;


        // Fetch all balance records from the Balance collection.
        const balances = await Balance.find(filter,{
            user: 1,
            coinId: 1,
            coinName: 1,
            balance: 1,
            logoUrl: 1,
            updatedAt: 1
        }).populate('user', 'name email')
        .skip(skip)
        .limit(limitNumber); 

        // Calculate next page
        const totalBalance = await Balance.countDocuments(filter);
        const hasNextPage = skip + balances.length < totalBalance;
        const nextPage = hasNextPage ? pageNumber + 1 : null;
        
        return res.status(200).json({
            success: true,
            message: 'Balances retrieved successfully.',
            balances,
            currentPage: pageNumber,
            nextPage,
            totalPages: Math.ceil(totalBalance / limitNumber)
        });
    } catch (error) {
        console.error('Error retrieving balances:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const GetNairaTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, status, bankCode, bankName } = req.query;

        // Convert page and limit to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};

        if (type) filter.type = type;
        
        if (status) filter.status = status;

        if (bankCode) filter.bankCode = bankCode;

        if (bankName) filter.bankName = bankName;

        // Fetch all naira transactions records from the Balance collection.
        const nairaTrx = await NairaTxHistory.find(filter, 
            {_id: 0}).populate('user', 'name email')
            .skip(skip)
            .limit(limitNumber);

        // Calculate next page
        const totalBalance = await NairaTxHistory.countDocuments(filter);
        const hasNextPage = skip + nairaTrx.length < totalBalance;
        const nextPage = hasNextPage ? pageNumber + 1 : null;

        return res.status(200).json({
            success: true,
            message: 'Naira Transactions retrieved successfully.',
            nairaTrx,
            currentPage: pageNumber,
            nextPage,
            totalPages: Math.ceil(totalBalance / limitNumber)
        });
    } catch (error) {
        console.error('Error retrieving naira transactions:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const GetCryptoTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, coinId, chain } = req.query;

        // Convert page and limit to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};

        if (coinId) filter.coinId = coinId;
        
        if (chain) filter.chain = chain;

        // Fetch all crypto transactions records from the Balance collection.
        const cryptoTrx = await CryptoWithdrawalHistory.find(filter, 
            {_id: 0}).populate('user', 'name email')
            .skip(skip)
            .limit(limitNumber);

        // Calculate next page
        const totalBalance = await CryptoWithdrawalHistory.countDocuments(filter);
        const hasNextPage = skip + CryptoWithdrawalHistory.length < totalBalance;
        const nextPage = hasNextPage ? pageNumber + 1 : null;

        return res.status(200).json({
            success: true,
            message: 'Crypto Transactions retrieved successfully.',
            cryptoTrx,
            currentPage: pageNumber,
            nextPage,
            totalPages: Math.ceil(totalBalance / limitNumber)
        });
    } catch (error) {
        console.error('Error retrieving balances:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const UpdateFunds = async (req, res) => {
    try {
      const { coinId, userId, amount } = req.body;
  
      // Validate required fields
      if (!coinId || !userId || !amount) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
      }
  
      // Retrieve the user using findById
      const user = await User.findOne({_id: userId});
      if (!user) {
        return res.status(404).json({ success: false, message: 'User with given Id does not exist' });
      }
  
      // Check if coinId is valid: it must be either 1111 or 1280.
      if (parseInt(coinId) !== 1111 && parseInt(coinId) !== 1280) {
        return res.status(400).json({ success: false, message: 'Invalid coin Id' });
      }
  
      // Retrieve the user's balance using findOne (and await the query)
      const userBalance = await Balance.findOne({ user: user._id, coinId: coinId });
      if (!userBalance) {
        return res.status(404).json({ success: false, message: 'Balance does not exist. User needs to create a withdrawal wallet address' });
      }
  
      const newAmount = parseFloat(amount);
      const amountDiff = newAmount - userBalance.balance;
  
      // Update the balance and update the updatedAt field
      const updatedBalance = await Balance.findByIdAndUpdate(
        userBalance._id,
        { balance: newAmount, updatedAt: new Date() },
        { new: true }
      );
  
      // Update the balance History for naira wallet if coinId is 1111
      if (parseInt(coinId) === 1111) {
        const now = new Date();
        const nairaTxHistory = new NairaTxHistory({
          user: user._id,
          transactionId: await generateUniqueTransactionId(), 
          amount: amountDiff,
          fee: 0,
          narration: "Admin updated funds",
          type: "ADMIN",
          status: "success",
          accountId: "ADMIN",
          accountName: "ADMIN",
          accountNumber: "ADMIN",
          bankCode: "ADMIN",
          bankName: "ADMIN",
          clientReference: "ADMIN",
          transactionReference: "ADMIN",
          initiatedAt: now,
          completedAt: now,
          failedAt: null,
          reasonForFailure: ""
        });
  
        await nairaTxHistory.save();
      } else if (parseInt(coinId) === 1280) {
        const cryptoTrxHistory = new CryptoWithdrawalHistory({
            user: user._id,
            coinId: coinId,
            amount: amountDiff,
            address: "ADMIN",
            chain: "USDT",
            memo: "",
            orderId: await generateUniqueTransactionId(),
            status: "Completed",
            createdAt: now,
            updatedAt: now
        });

        await cryptoTrxHistory.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Funds updated successfully',
        updatedBalance
      });
    } catch (error) {
      console.error('Error updating funds:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

module.exports = { GetAllBalances, GetNairaTransactions, GetCryptoTransactions, UpdateFunds };
