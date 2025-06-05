const User = require('../models/User');
const Transaction = require('../models/Transaction');
const web3Service = require('../services/web3Service');

exports.getPortfolio = async (req, res) => {
    try {
        const { address } = req.params;
        
        let user = await User.findOne({ walletAddress: address.toLowerCase() });
        if (!user) {
            user = new User({ walletAddress: address.toLowerCase() });
            await user.save();
        }
        
        const ethBalance = await web3Service.getETHBalance(address);
        const tokenBalance = await web3Service.getTokenBalance(address);
        
        // Update user data
        user.tokens = [
            { symbol: 'ETH', balance: parseFloat(ethBalance), value: parseFloat(ethBalance) * 2000 }, // Mock ETH price
            { symbol: 'PFT', balance: parseFloat(tokenBalance), value: parseFloat(tokenBalance) * 1 }
        ];
        user.portfolioValue = user.tokens.reduce((sum, token) => sum + token.value, 0);
        user.lastSync = new Date();
        await user.save();
        
        res.json({
            success: true,
            data: {
                address: user.walletAddress,
                portfolioValue: user.portfolioValue,
                tokens: user.tokens,
                lastSync: user.lastSync
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const { address } = req.params;
        
        const transactions = await Transaction.find({ 
            userAddress: address.toLowerCase() 
        }).sort({ createdAt: -1 }).limit(50);
        
        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.syncPortfolio = async (req, res) => {
    try {
        const { address } = req.body;
        
        // Sync with blockchain
        const blockchainTransactions = await web3Service.getTransactionHistory(address);
        
        // Save new transactions
        for (const tx of blockchainTransactions) {
            await Transaction.findOneAndUpdate(
                { txHash: tx.hash },
                {
                    userAddress: address.toLowerCase(),
                    ...tx,
                    status: 'confirmed'
                },
                { upsert: true }
            );
        }
        
        res.json({
            success: true,
            message: 'Portfolio synced successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};