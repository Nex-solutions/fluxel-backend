let express = require('express');
let router = express.Router();
const { getAccountBalanceHandler, getBanksListHandler, createRecipientHandler, getUserNairaAccountsHandler, createTransactionHandler, createVirtualAccountHandler, handleWebhook, getTempAccount } = require('../controller/lenco');
const { tokenRequired, transactionTokenRequired } = require('../middleware/auth'); // Assuming you have an authentication middleware
const { validateWebhook } = require('../middleware/lenco');
const { onlyDev } = require('../middleware/onlyDev');

// Define webhook route
router.post("/",
    validateWebhook,
    handleWebhook);

module.exports = router;
