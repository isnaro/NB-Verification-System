const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    moderatorId: { type: String, required: true },
    verificationDate: { type: Date, required: true },
    assignedRoles: { type: String },
    counts: {
        day: { type: Number, default: 0 },
        week: { type: Number, default: 0 },
        month: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    }
});

module.exports = mongoose.model('Verification', verificationSchema);
