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