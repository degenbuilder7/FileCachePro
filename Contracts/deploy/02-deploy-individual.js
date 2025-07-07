const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments, ethers }) => {
    const { deploy, log, get, save } = deployments;
    const { deployer } = await getNamedAccounts();

    log("🚀 Starting individual contract deployment on Filecoin Calibration...");
    log("----------------------------------------------------");

    // Contract addresses for Calibration testnet
    const TELLOR_ADDRESS = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444"; 
    const TREASURY_ADDRESS = deployer; 
    const PROVIDER_STAKE_AMOUNT = "100000000000000000000"; // 100 USDFC

    // Try to get existing USDFC deployment or deploy new one
    let usdfc;
    try {
        usdfc = await get("USDFC");
        log(`✅ Using existing USDFC at: ${usdfc.address}`);
    } catch (error) {
        log("💰 Deploying new USDFC Token...");
        usdfc = await deploy("USDFC", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: 1,
        });
    }

    // Try to get existing MarketApiHelper or deploy new one
    let marketApiHelper;
    try {
        marketApiHelper = await get("VeriFlowMarketApiHelper");
        log(`✅ Using existing VeriFlowMarketApiHelper at: ${marketApiHelper.address}`);
    } catch (error) {
        log("📋 Deploying new VeriFlowMarketApiHelper...");
        marketApiHelper = await deploy("VeriFlowMarketApiHelper", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: 1,
        });
    }

    // Deploy VerifiAIMarketplace
    log("🏪 Deploying VerifiAIMarketplace...");
    let marketplace;
    try {
        marketplace = await get("VerifiAIMarketplace");
        log(`✅ VerifiAIMarketplace already deployed at: ${marketplace.address}`);
    } catch (error) {
        marketplace = await deploy("VerifiAIMarketplace", {
            from: deployer,
            args: [usdfc.address, TREASURY_ADDRESS, PROVIDER_STAKE_AMOUNT],
            log: true,
            waitConfirmations: 1,
        });
    }

    // Deploy VerifiAIPayments
    log("💳 Deploying VerifiAIPayments...");
    let payments;
    try {
        payments = await get("VerifiAIPayments");
        log(`✅ VerifiAIPayments already deployed at: ${payments.address}`);
    } catch (error) {
        payments = await deploy("VerifiAIPayments", {
            from: deployer,
            args: [usdfc.address, TREASURY_ADDRESS],
            log: true,
            waitConfirmations: 1,
        });
    }

    // Deploy VerifiAIVerification
    log("🔬 Deploying VerifiAIVerification...");
    let verification;
    try {
        verification = await get("VerifiAIVerification");
        log(`✅ VerifiAIVerification already deployed at: ${verification.address}`);
    } catch (error) {
        verification = await deploy("VerifiAIVerification", {
            from: deployer,
            args: [TELLOR_ADDRESS, usdfc.address],
            log: true,
            waitConfirmations: 1,
        });
    }

    log("✅ Individual contract deployment completed!");
    log("----------------------------------------------------");
    log("📄 Final Contract Addresses:");
    log(`   USDFC Token: ${usdfc.address}`);
    log(`   MarketApiHelper: ${marketApiHelper.address}`);
    log(`   Marketplace: ${marketplace.address}`);
    log(`   Payments: ${payments.address}`);
    log(`   Verification: ${verification.address}`);
    log("----------------------------------------------------");

    // Save addresses to a JSON file for frontend
    const contractAddresses = {
        USDFC: usdfc.address,
        VeriFlowMarketApiHelper: marketApiHelper.address,
        VerifiAIMarketplace: marketplace.address,
        VerifiAIPayments: payments.address,
        VerifiAIVerification: verification.address,
        TellorOracle: TELLOR_ADDRESS,
        Treasury: TREASURY_ADDRESS
    };

    const fs = require('fs');
    const path = require('path');
    
    // Save to deployments directory
    fs.writeFileSync(
        path.join(__dirname, '../deployments/calibration/contract-addresses.json'),
        JSON.stringify(contractAddresses, null, 2)
    );

    log("💾 Contract addresses saved to deployments/calibration/contract-addresses.json");
    log("🔗 Ready for frontend integration!");
};

module.exports.tags = ["individual", "contracts"]; 