const { ethers } = require('ethers');
const contractABI = require('../contracts/PortfolioToken.json');
const contractAddress = require('../contracts/contractAddress.json');

class Web3Service {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(
            contractAddress.PortfolioToken,
            contractABI.abi,
            this.wallet
        );
    }
    
    async getETHBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            throw new Error(`Failed to get ETH balance: ${error.message}`);
        }
    }
    
    async getTokenBalance(address) {
        try {
            const balance = await this.contract.balanceOf(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }
    
    async getTransactionHistory(address) {
        try {
            const transactions = await this.contract.getUserTransactions(address);
            return transactions.map(tx => ({
                from: tx.from,
                to: tx.to,
                amount: ethers.utils.formatEther(tx.amount),
                timestamp: new Date(tx.timestamp.toNumber() * 1000),
                txType: tx.txType
            }));
        } catch (error) {
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }
    
    async listenToEvents() {
        this.contract.on("PortfolioUpdated", (user, newValue) => {
            console.log(`Portfolio updated for ${user}: ${ethers.utils.formatEther(newValue)}`);
        });
        
        this.contract.on("TransactionRecorded", (user, txType, amount) => {
            console.log(`Transaction recorded for ${user}: ${txType} ${ethers.utils.formatEther(amount)}`);
        });
    }
}

module.exports = new Web3Service();