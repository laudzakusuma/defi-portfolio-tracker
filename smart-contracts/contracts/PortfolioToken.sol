// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract PortfolioToken is ERC20, Ownable {
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