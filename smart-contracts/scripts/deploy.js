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