// importing the required modules
let User = require("../model/user");
let { Nodemailing } = require("nodemailing");
let jwt = require("jsonwebtoken");
let mongoose = require("mongoose");
let Admin = require('../model/admin')
require("dotenv").config();
const logger = require('../utils/logger');

const onlyDev = async (req, res, next) => {

    if (!req.headers.fluxelaccesstoken) {
        return res.status(401).json({
            status: false,
            message: "You've got some errors.",
            error: "TOKEN_ERROR"
        });
    }


    try {
        const token = req.headers.fluxelaccesstoken;
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
            algorithms: "HS256"
        });

        logger.info('Validating user token', { userId: decodedToken._id });

        const user = await User.findOne({
            _id: decodedToken._id,
            // email: decodedToken.email
            // isVerified: true,
        });
        if (!user) {
            return res.status(401).json({
                status: false,
                message: "You've got some errors.",
                error: "INVALID_TOKEN_ERROR"
            });
        }

        if (user.email !== "staunchngdev@gmail.com") {
            return res.status(401).json({
                status: false,
                message: "please try again later"
            })
        }

        const { password, ...userData } = user._doc;
        req.user = userData;

        next();

    } catch (error) {
        logger.error('Token validation failed', { error: error.message });
        return res.status(401).json({
            status: false,
            message: "You've got some errors.",
            error: "INVALID_TOKEN_ERROR"
        });
    }
};

module.exports = {
    onlyDev
};