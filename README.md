Kita akan membuat aplikasi DeFi Portfolio Tracker yang memungkinkan user untuk:

Connect wallet (MetaMask)
Melihat balance ETH dan token ERC-20
Melakukan transfer token
Melihat history transaksi
Dashboard dengan grafik portfolio
Teknologi yang Digunakan
Frontend:

React.js
Vanilla CSS (tanpa Tailwind)
Web3.js/Ethers.js
Chart.js untuk grafik
Backend:

Node.js dengan Express
MongoDB untuk database
Web3.js untuk interaksi blockchain
Socket.io untuk real-time updates
Blockchain:

Ethereum Testnet (Sepolia)
Smart Contract sederhana (ERC-20 token)
STEP 1: Setup Environment & Prerequisites
1.1 Install Prerequisites
bash
# Install Node.js (versi 18+)
# Download dari https://nodejs.org

# Install Git
# Download dari https://git-scm.com

# Install MongoDB
# Download dari https://www.mongodb.com/try/download/community
1.2 Setup MetaMask
Install MetaMask browser extension
Create wallet baru atau import existing
Add Sepolia Testnet:
Network Name: Sepolia
RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
1.3 Get Test ETH
Kunjungi https://sepoliafaucet.com
Masukkan alamat wallet Anda
Request test ETH
STEP 2: Setup Project Structure
2.1 Create Project Directory
bash
mkdir defi-portfolio-tracker
cd defi-portfolio-tracker

# Create folder structure
mkdir frontend backend smart-contracts
mkdir frontend/src frontend/src/components frontend/src/styles frontend/src/utils
mkdir backend/src backend/src/controllers backend/src/models backend/src/routes backend/src/middleware
mkdir smart-contracts/contracts smart-contracts/scripts
2.2 Initialize Projects
bash
# Frontend setup
cd frontend
npm init -y
npm install react react-dom react-scripts web3 ethers axios socket.io-client chart.js react-chartjs-2

# Backend setup
cd ../backend
npm init -y
npm install express mongoose cors dotenv socket.io web3 ethers axios helmet rate-limiter-flexible

# Smart contracts setup
cd ../smart-contracts
npm init -y
npm install hardhat @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle ethereum-waffle chai ethers
STEP 3: Smart Contract Development
3.1 Setup Hardhat
bash
cd smart-contracts
npx hardhat init
# Pilih "Create a JavaScript project"
3.2 Create Smart Contract
File: smart-contracts/contracts/PortfolioToken.sol

solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PortfolioToken is ERC20, Ownable {
    mapping(address => uint256) public portfolioValues;
    mapping(address => Transaction[]) public userTransactions;
    
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string txType;
    }
    
    event PortfolioUpdated(address indexed user, uint256 newValue);
    event TransactionRecorded(address indexed user, string txType, uint256 amount);
    
    constructor() ERC20("PortfolioToken", "PFT") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    function updatePortfolioValue(uint256 _value) external {
        portfolioValues[msg.sender] = _value;
        emit PortfolioUpdated(msg.sender, _value);
    }
    
    function recordTransaction(
        address _to,
        uint256 _amount,
        string memory _txType
    ) external {
        userTransactions[msg.sender].push(Transaction({
            from: msg.sender,
            to: _to,
            amount: _amount,
            timestamp: block.timestamp,
            txType: _txType
        }));
        
        emit TransactionRecorded(msg.sender, _txType, _amount);
    }
    
    function getPortfolioValue(address _user) external view returns (uint256) {
        return portfolioValues[_user];
    }
    
    function getUserTransactions(address _user) external view returns (Transaction[] memory) {
        return userTransactions[_user];
    }
    
    function mintTokens(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
}
3.3 Deploy Script
File: smart-contracts/scripts/deploy.js

javascript
async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    const PortfolioToken = await ethers.getContractFactory("PortfolioToken");
    const portfolioToken = await PortfolioToken.deploy();
    
    await portfolioToken.deployed();
    
    console.log("PortfolioToken deployed to:", portfolioToken.address);
    
    // Save contract address and ABI
    const fs = require('fs');
    const contractAddress = {
        PortfolioToken: portfolioToken.address
    };
    
    fs.writeFileSync(
        '../frontend/src/contracts/contractAddress.json',
        JSON.stringify(contractAddress, null, 2)
    );
    
    fs.writeFileSync(
        '../backend/src/contracts/contractAddress.json',
        JSON.stringify(contractAddress, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
3.4 Hardhat Config
File: smart-contracts/hardhat.config.js

javascript
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
    solidity: "0.8.19",
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            accounts: [process.env.PRIVATE_KEY]
        }
    }
};
3.5 Deploy Contract
bash
# Create .env file
echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY" >> .env
echo "PRIVATE_KEY=YOUR_PRIVATE_KEY" >> .env

# Install OpenZeppelin
npm install @openzeppelin/contracts

# Deploy
npx hardhat run scripts/deploy.js --network sepolia
STEP 4: Backend Development
4.1 Environment Setup
File: backend/.env

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/defi-portfolio
JWT_SECRET=your-jwt-secret-here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
PRIVATE_KEY=YOUR_PRIVATE_KEY
4.2 Database Models
File: backend/src/models/User.js

javascript
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
File: backend/src/models/Transaction.js

javascript
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
4.3 Web3 Service
File: backend/src/services/web3Service.js

javascript
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
4.4 Controllers
File: backend/src/controllers/portfolioController.js

javascript
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
4.5 Routes
File: backend/src/routes/portfolio.js

javascript
const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

router.get('/:address', portfolioController.getPortfolio);
router.get('/:address/transactions', portfolioController.getTransactions);
router.post('/sync', portfolioController.syncPortfolio);

module.exports = router;
4.6 Main Server File
File: backend/src/server.js

javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const portfolioRoutes = require('./routes/portfolio');
const web3Service = require('./services/web3Service');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/portfolio', portfolioRoutes);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join-room', (address) => {
        socket.join(address);
        console.log(`Client joined room: ${address}`);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    // Start listening to blockchain events
    web3Service.listenToEvents();
})
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
STEP 5: Frontend Development
5.1 Setup React App
File: frontend/package.json (update scripts)

json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
5.2 Main App Component
File: frontend/src/App.js

javascript
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';
import WalletConnect from './components/WalletConnect';
import TransactionHistory from './components/TransactionHistory';
import './styles/App.css';

const socket = io('http://localhost:5000');

function App() {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
    const [connected, setConnected] = useState(false);
    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        checkWalletConnection();
    }, []);

    useEffect(() => {
        if (account) {
            socket.emit('join-room', account);
            fetchPortfolioData();
        }
    }, [account]);

    const checkWalletConnection = async () => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
            
            const accounts = await web3Instance.eth.getAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setConnected(true);
            }
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        try {
            setLoading(true);
            const web3Instance = new Web3(window.ethereum);
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            const accounts = await web3Instance.eth.getAccounts();
            const networkId = await web3Instance.eth.net.getId();
            
            if (networkId !== 11155111) {
                alert('Please switch to Sepolia Testnet');
                return;
            }
            
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            setConnected(true);
        } catch (error) {
            console.error('Connection failed:', error);
            alert('Failed to connect wallet');
        } finally {
            setLoading(false);
        }
    };

    const fetchPortfolioData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/portfolio/${account}`);
            const data = await response.json();
            
            if (data.success) {
                setPortfolioData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const disconnectWallet = () => {
        setAccount('');
        setConnected(false);
        setPortfolioData(null);
        socket.emit('leave-room', account);
    };

    if (!connected) {
        return (
            <div className="app">
                <WalletConnect 
                    onConnect={connectWallet} 
                    loading={loading}
                />
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1>DeFi Portfolio Tracker</h1>
                    <div className="wallet-info">
                        <span className="wallet-address">
                            {`${account.slice(0, 6)}...${account.slice(-4)}`}
                        </span>
                        <button onClick={disconnectWallet} className="disconnect-btn">
                            Disconnect
                        </button>
                    </div>
                </div>
                <nav className="nav-tabs">
                    <button 
                        className={activeTab === 'dashboard' ? 'active' : ''}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button 
                        className={activeTab === 'transactions' ? 'active' : ''}
                        onClick={() => setActiveTab('transactions')}
                    >
                        Transactions
                    </button>
                </nav>
            </header>

            <main className="app-main">
                {loading && <div className="loading">Loading...</div>}
                
                {activeTab === 'dashboard' && (
                    <Dashboard 
                        portfolioData={portfolioData}
                        account={account}
                        web3={web3}
                        onRefresh={fetchPortfolioData}
                    />
                )}
                
                {activeTab === 'transactions' && (
                    <TransactionHistory 
                        account={account}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
5.3 Wallet Connect Component
File: frontend/src/components/WalletConnect.js

javascript
import React from 'react';
import '../styles/WalletConnect.css';

function WalletConnect({ onConnect, loading }) {
    return (
        <div className="wallet-connect">
            <div className="connect-card">
                <div className="connect-header">
                    <h1>DeFi Portfolio Tracker</h1>
                    <p>Connect your wallet to start tracking your DeFi portfolio</p>
                </div>
                
                <div className="connect-content">
                    <div className="wallet-icon">
                        <img src="/metamask-logo.png" alt="MetaMask" />
                    </div>
                    
                    <button 
                        onClick={onConnect}
                        disabled={loading}
                        className="connect-button"
                    >
                        {loading ? 'Connecting...' : 'Connect MetaMask'}
                    </button>
                    
                    <div className="connect-info">
                        <p>Make sure you're connected to Sepolia Testnet</p>
                        <p>Need test ETH? Visit <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">Sepolia Faucet</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WalletConnect;
5.4 Dashboard Component
File: frontend/src/components/Dashboard.js

javascript
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import '../styles/Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function Dashboard({ portfolioData, account, web3, onRefresh }) {
    const [transferAmount, setTransferAmount] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferring, setTransferring] = useState(false);

    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Portfolio Value (USD)',
                data: [100, 150, 120, 180, 200, portfolioData?.portfolioValue || 0],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Portfolio Performance'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const handleTransfer = async () => {
        if (!transferAmount || !transferTo) {
            alert('Please fill in all fields');
            return;
        }

        try {
            setTransferring(true);
            
            // Send ETH transfer
            const transaction = await web3.eth.sendTransaction({
                from: account,
                to: transferTo,
                value: web3.utils.toWei(transferAmount, 'ether')
            });
            
            alert(`Transaction sent: ${transaction.transactionHash}`);
            setTransferAmount('');
            setTransferTo('');
            
            // Refresh portfolio after transfer
            setTimeout(() => {
                onRefresh();
            }, 3000);
            
        } catch (error) {
            console.error('Transfer failed:', error);
            alert('Transfer failed: ' + error.message);
        } finally {
            setTransferring(false);
        }
    };

    if (!portfolioData) {
        return <div className="loading">Loading portfolio data...</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="portfolio-summary">
                    <h2>Portfolio Overview</h2>
                    <div className="portfolio-value">
                        <span className="value">${portfolioData.portfolioValue.toFixed(2)}</span>
                        <span className="change positive">+5.2%</span>
                    </div>
                    <p className="last-sync">
                        Last updated: {new Date(portfolioData.lastSync).toLocaleString()}
                    </p>
                </div>
                
                <button onClick={onRefresh} className="refresh-btn">
                    Refresh
                </button>
            </div>

            <div className="dashboard-grid">
                <div className="card tokens-card">
                    <h3>Token Balances</h3>
                    <div className="tokens-list">
                        {portfolioData.tokens.map((token, index) => (
                            <div key={index} className="token-item">
                                <div className="token-info">
                                    <span className="token-symbol">{token.symbol}</span>
                                    <span className="token-balance">{token.balance.toFixed(4)}</span>
                                </div>
                                <div className="token-value">
                                    ${token.value.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card chart-card">
                    <h3>Portfolio Performance</h3>
                    <div className="chart-container">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                <div className="card transfer-card">
                    <h3>Quick Transfer</h3>
                    <div className="transfer-form">
                        <input
                            type="text"
                            placeholder="Recipient Address"
                            value={transferTo}
                            onChange={(e) => setTransferTo(e.target.value)}
                            className="transfer-input"
                        />
                        <input
                            type="number"
                            placeholder="Amount (ETH)"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="transfer-input"
                            step="0.001"
                        />
                        <button
                            onClick={handleTransfer}
                            disabled={transferring}
                            className="transfer-btn"
                        >
                            {transferring ? 'Sending...' : 'Send ETH'}
                        </button>
                    </div>
                </div>

                <div className="card stats-card">
                    <h3>Quick Stats</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Total Assets</span>
                            <span className="stat-value">{portfolioData.tokens.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">24h Change</span>
                            <span className="stat-value positive">+5.2%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Volume</span>
                            <span className="stat-value">${(portfolioData.portfolioValue * 1.2).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
5.5 Transaction History Component
File: frontend/src/components/TransactionHistory.js

javascript
import React, { useState, useEffect } from 'react';
import '../styles/TransactionHistory.css';

function TransactionHistory({ account }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, [account]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/portfolio/${account}/transactions`);
            const data = await response.json();
            
            if (data.success) {
                setTransactions(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.txType === filter;
    });

    const getTransactionIcon = (txType) => {
        switch (txType) {
            case 'send': return '↗';
            case 'receive': return '↙';
            case 'swap': return '↔';
            default: return '•';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'green';
            case 'pending': return 'orange';
            case 'failed': return 'red';
            default: return 'gray';
        }
    };

    return (
        <div className="transaction-history">
            <div className="history-header">
                <h2>Transaction History</h2>
                <div className="filter-buttons">
                    <button 
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button 
                        className={filter === 'send' ? 'active' : ''}
                        onClick={() => setFilter('send')}
                    >
                        Sent
                    </button>
                    <button 
                        className={filter === 'receive' ? 'active' : ''}
                        onClick={() => setFilter('receive')}
                    >
                        Received
                    </button>
                    <button 
                        className={filter === 'swap' ? 'active' : ''}
                        onClick={() => setFilter('swap')}
                    >
                        Swapped
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading transactions...</div>
            ) : (
                <div className="transactions-list">
                    {filteredTransactions.length === 0 ? (
                        <div className="no-transactions">
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        filteredTransactions.map((tx, index) => (
                            <div key={index} className="transaction-item">
                                <div className="tx-icon">
                                    {getTransactionIcon(tx.txType)}
                                </div>
                                <div className="tx-details">
                                    <div className="tx-type">
                                        {tx.txType.charAt(0).toUpperCase() + tx.txType.slice(1)}
                                    </div>
                                    <div className="tx-addresses">
                                        <span>From: {tx.from?.slice(0, 8)}...{tx.from?.slice(-6)}</span>
                                        <span>To: {tx.to?.slice(0, 8)}...{tx.to?.slice(-6)}</span>
                                    </div>
                                    <div className="tx-timestamp">
                                        {new Date(tx.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div className="tx-amount">
                                    <span className={`amount ${tx.txType}`}>
                                        {tx.txType === 'send' ? '-' : '+'}{tx.value} ETH
                                    </span>
                                    <span 
                                        className="status"
                                        style={{ color: getStatusColor(tx.status) }}
                                    >
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

---

## STEP 6: CSS Styling (Tanpa Tailwind)

### 6.1 Main App Styles
**File: frontend/src/styles/App.css**
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem 2rem;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.header-content h1 {
    color: #2d3748;
    font-size: 1.8rem;
    font-weight: 700;
}

.wallet-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.wallet-address {
    background: #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    color: #2d3748;
}

.disconnect-btn {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
}

.disconnect-btn:hover {
    background: #c53030;
}

.nav-tabs {
    display: flex;
    gap: 0.5rem;
    max-width: 1200px;
    margin: 1rem auto 0;
}

.nav-tabs button {
    background: transparent;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    color: #4a5568;
    transition: all 0.2s;
}

.nav-tabs button:hover {
    background: rgba(255, 255, 255, 0.5);
}

.nav-tabs button.active {
    background: white;
    color: #2d3748;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    font-size: 1.1rem;
    color: #4a5568;
}

@media (max-width: 768px) {
    .app-header {
        padding: 1rem;
    }
    
    .header-content {
        flex-direction: column;
        gap: 1rem;
    }
    
    .wallet-info {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .app-main {
        padding: 1rem;
    }
}
6.2 Wallet Connect Styles
File: frontend/src/styles/WalletConnect.css

css
.wallet-connect {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
}

.connect-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
    width: 100%;
    animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.connect-header h1 {
    color: #2d3748;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.connect-header p {
    color: #4a5568;
    font-size: 1.1rem;
    margin-bottom: 2rem;
    line-height: 1.6;
}

.connect-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
}

.wallet-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

.wallet-icon img {
    width: 50px;
    height: 50px;
}

.connect-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    min-width: 200px;
}

.connect-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.connect-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.connect-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: #718096;
    font-size: 0.9rem;
}

.connect-info a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
}

.connect-info a:hover {
    text-decoration: underline;
}

@media (max-width: 768px) {
    .connect-card {
        padding: 2rem;
        margin: 1rem;
    }
    
    .connect-header h1 {
        font-size: 2rem;
    }
}
6.3 Dashboard Styles
File: frontend/src/styles/Dashboard.css

css
.dashboard {
    animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.portfolio-summary h2 {
    color: #2d3748;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.portfolio-value {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.portfolio-value .value {
    font-size: 3rem;
    font-weight: 700;
    color: #2d3748;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.portfolio-value .change {
    font-size: 1.2rem;
    font-weight: 600;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
}

.portfolio-value .change.positive {
    background: #c6f6d5;
    color: #22543d;
}

.portfolio-value .change.negative {
    background: #fed7d7;
    color: #742a2a;
}

.last-sync {
    color: #718096;
    font-size: 0.9rem;
}

.refresh-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.refresh-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.card h3 {
    color: #2d3748;
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    font-weight: 600;
}

.tokens-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.token-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.token-item:hover {
    background: #edf2f7;
    transform: translateX(5px);
}

.token-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.token-symbol {
    font-weight: 700;
    color: #2d3748;
    font-size: 1.1rem;
}

.token-balance {
    color: #718096;
    font-size: 0.9rem;
}

.token-value {
    font-weight: 600;
    color: #2d3748;
    font-size: 1.1rem;
}

.chart-container {
    height: 300px;
    width: 100%;
}

.transfer-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.transfer-input {
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: #f7fafc;
}

.transfer-input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.transfer-btn {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(72, 187, 120, 0.3);
}

.transfer-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
}

.transfer-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 12px;
}

.stat-label {
    color: #718096;
    font-size: 0.9rem;
}

.stat-value {
    font-weight: 700;
    color: #2d3748;
    font-size: 1.1rem;
}

.stat-value.positive {
    color: #22543d;
}

@media (max-width: 768px) {
    .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .portfolio-value .value {
        font-size: 2rem;
    }
    
    .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .card {
        padding: 1.5rem;
    }
}
6.4 Transaction History Styles
File: frontend/src/styles/TransactionHistory.css

css
.transaction-history {
    animation: fadeIn 0.6s ease-out;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.history-header h2 {
    color: #2d3748;
    font-size: 1.5rem;
    font-weight: 600;
}

.filter-buttons {
    display: flex;
    gap: 0.5rem;
    background: #f7fafc;
    padding: 0.3rem;
    border-radius: 12px;
}

.filter-buttons button {
    background: transparent;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    color: #718096;
    transition: all 0.2s ease;
}

.filter-buttons button:hover {
    background: rgba(255, 255, 255, 0.8);
}

.filter-buttons button.active {
    background: white;
    color: #2d3748;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transactions-list {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.no-transactions {
    text-align: center;
    padding: 3rem;
    color: #718096;
}

.no-transactions p {
    font-size: 1.1rem;
}

.transaction-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    transition: all 0.2s ease;
}

.transaction-item:last-child {
    border-bottom: none;
}

.transaction-item:hover {
    background: #f7fafc;
    border-radius: 12px;
    transform: translateX(5px);
}

.tx-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
}

.tx-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.tx-type {
    font-weight: 600;
    color: #2d3748;
    font-size: 1.1rem;
}

.tx-addresses {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.9rem;
    color: #718096;
    font-family: 'Courier New', monospace;
}

.tx-timestamp {
    font-size: 0.8rem;
    color: #a0aec0;
}

.tx-amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
}

.amount {
    font-size: 1.1rem;
    font-weight: 700;
    font-family: 'Courier New', monospace;
}

.amount.send {
    color: #e53e3e;
}

.amount.receive {
    color: #38a169;
}

.amount.swap {
    color: #3182ce;
}

.status {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

@media (max-width: 768px) {
    .history-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .filter-buttons {
        width: 100%;
        justify-content: center;
    }
    
    .transaction-item {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .tx-details {
        align-items: center;
    }
    
    .tx-addresses {
        align-items: center;
    }
    
    .tx-amount {
        align-items: center;
    }
}
STEP 7: Running the Application
7.1 Start MongoDB
bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# atau
brew services start mongodb-community
7.2 Deploy Smart Contract
bash
cd smart-contracts
npm install @openzeppelin/contracts
npx hardhat run scripts/deploy.js --network sepolia
7.3 Start Backend Server
bash
cd backend
npm start
# atau gunakan nodemon untuk development
npm install -g nodemon
nodemon src/server.js
7.4 Start Frontend Application
bash
cd frontend
npm start
7.5 Access Application
Frontend: http://localhost:3000
Backend API: http://localhost:5000
STEP 8: Testing & Deployment
8.1 Testing Checklist
Wallet Connection:
✅ MetaMask connects successfully
✅ Correct network detection (Sepolia)
✅ Account switching works
Portfolio Features:
✅ Portfolio data loads correctly
✅ Token balances display accurately
✅ Charts render properly
✅ Real-time updates work
Transaction Features:
✅ ETH transfers work
✅ Transaction history displays
✅ Status updates correctly
✅ Error handling works
UI/UX:
✅ Responsive design
✅ Loading states
✅ Error messages
✅ Smooth animations
8.2 Production Deployment
Frontend (Vercel/Netlify):
bash
# Build production version
cd frontend
npm run build

# Deploy to Vercel
npm install -g vercel
vercel --prod

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=build
Backend (Heroku/Railway):
bash
cd backend
# Create Procfile
echo "web: node src/server.js" > Procfile

# Deploy to Heroku
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set SEPOLIA_RPC_URL=your-infura-url
git add .
git commit -m "Deploy to production"
git push heroku main
Smart Contract (Mainnet):
bash
cd smart-contracts
# Update hardhat.config.js with mainnet config
npx hardhat run scripts/deploy.js --network mainnet
STEP 9: Advanced Features & Optimizations
9.1 Additional Features to Implement
Multi-chain Support (BSC, Polygon, Arbitrum)
DeFi Protocol Integration (Uniswap, Aave, Compound)
NFT Portfolio Tracking
Price Alerts & Notifications
Advanced Analytics & Reports
Mobile App (React Native)
9.2 Performance Optimizations
Caching Strategy (Redis)
Database Indexing (MongoDB)
API Rate Limiting
Image Optimization
Code Splitting (React.lazy)
Service Workers (PWA)
9.3 Security Best Practices
Input Validation (Frontend & Backend)
CORS Configuration
Environment Variables
API Authentication (JWT)
Smart Contract Auditing
Rate Limiting
STEP 10: Troubleshooting Guide
10.1 Common Issues
MetaMask Connection Issues:

javascript
// Check if MetaMask is installed
if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask');
    return;
}

// Handle network changes
window.ethereum.on('chainChanged', () => {
    window.location.reload();
});

// Handle account changes
window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
        // User disconnected
        setConnected(false);
    } else {
        setAccount(accounts[0]);
    }
});
Web3 Connection Errors:

javascript
// Add retry logic
const connectWithRetry = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const web3 = new Web3(window.ethereum);
            return web3;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};
Database Connection Issues:

javascript
// MongoDB connection with retry
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
10.2 Debug Tips
Browser DevTools - Check Console, Network, Application tabs
MetaMask Logs - Enable developer mode in MetaMask
Backend Logs - Use proper logging (Winston/Morgan)
Blockchain Explorer - Verify transactions on Etherscan
Network Monitoring - Check RPC endpoint status
Kesimpulan
Tutorial ini memberikan panduan lengkap untuk membuat aplikasi Web3 DeFi Portfolio Tracker yang terintegrasi frontend-backend. Aplikasi ini mencakup:

✅ Smart Contract - ERC-20 token dengan portfolio tracking ✅ Backend API - Express.js dengan MongoDB dan Web3 integration ✅ Frontend React - Modern UI tanpa Tailwind, menggunakan vanilla CSS ✅ Real-time Updates - Socket.io untuk live data ✅ Wallet Integration - MetaMask connection dan transaction handling ✅ Charts & Analytics - Portfolio visualization dengan Chart.js

Next Steps:

Test semua fitur di Sepolia testnet
Deploy ke production
Tambahkan fitur advanced sesuai kebutuhan
Optimalkan performance dan security
Audit smart contract sebelum mainnet deployment

