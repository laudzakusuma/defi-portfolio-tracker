const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    portfolioValue: {
        type: Number,
        default: 0
    },
    lastSync: {
        type: Date,
        default: Date.now
    },
    tokens: [{
        symbol: String,
        balance: Number,
        value: Number,
        contractAddress: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);