const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    txHash: {
        type: String,
        required: true,
        unique: true
    },
    from: String,
    to: String,
    value: Number,
    tokenSymbol: String,
    txType: String, // 'send', 'receive', 'swap'
    blockNumber: Number,
    gasUsed: Number,
    gasPrice: Number,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);