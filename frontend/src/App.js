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