let mongoose = require('mongoose');

let ninVerificationDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    success: {
        type: Boolean,
        required: true
    },
    message: {
        type: String
    },
    data: {
        id: {
            type: Number
        },
        applicant: {
            firstname: String,
            lastname: String
        },
        summary: {
            nin_check: {
                status: String,
                fieldMatches: {
                    firstname: Boolean,
                    lastname: Boolean,
                    gender: Boolean,
                    emailAddress: Boolean
                }
            }
        },
        status: {
            state: String,
            status: String
        },
        nin: {
            nin: String,
            firstname: String,
            lastname: String,
            middlename: String,
            phone: String,
            gender: String,
            birthdate: String,
            photo: String
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('NINVerificationData', ninVerificationDataSchema);
