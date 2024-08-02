const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    moderatorId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
        unique: true
    },
    verificationDate: {
        type: Date,
        default: Date.now
    },
    counts: {
        day: {
            type: Number,
            default: 0
        },
        week: {
            type: Number,
            default: 0
        },
        month: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    }
});

module.exports = mongoose.model('Verification', verificationSchema);
