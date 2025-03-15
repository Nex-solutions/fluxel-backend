var crypto = require('crypto');
require("dotenv").config();

var secret = process.env.LENCO_API_KEY;
var webhookHashKey = crypto.createHash("sha256").update(secret).digest("hex");
// Using Express
const validateWebhook = (req, res, next) => {
    //validate event
    var hash = crypto.createHmac('sha512', webhookHashKey).update(JSON.stringify(req.body)).digest('hex');
    if (hash === req.headers['x-lenco-signature']) {
        req.event = req.body;
        next();
    } else {
        return res.status(401).json({
            status: false,
            message: "Unauthorized",
            error: "UNAUTHORIZED"
        });
    }
};

module.exports = {
    validateWebhook
};
