const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("🚀 Starting VerifiAI deployment on Filecoin Calibration...");
    log("----------------------------------------------------");

    // Contract addresses for Calibration testnet
    const TELLOR_ADDRESS = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444"; // Tellor Oracle on Calibration  
    const TREASURY_ADDRESS = deployer; // Use deployer as treasury for now
    const PROVIDER_STAKE_AMOUNT = "100000000000000000000"; // 100 USDFC

    // 1. Deploy USDFC Token for Calibration testnet first
    log("💰 Deploying USDFC Token for Calibration Testnet...");
    const usdfc = await deploy("USDFC", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });

    log(`💰 USDFC Address: ${usdfc.address}`);
    log(`🔮 Tellor Oracle: ${TELLOR_ADDRESS}`);
    log(`🏛️  Treasury Address: ${TREASURY_ADDRESS}`);
    log(`📊 Provider Stake: ${PROVIDER_STAKE_AMOUNT} wei (100 USDFC)`);
    log("----------------------------------------------------");

    // 2. Deploy VeriFlowMarketApiHelper
    log("📋 Deploying VeriFlowMarketApiHelper...");
    const marketApiHelper = await deploy("VeriFlowMarketApiHelper", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });

    // 3. Deploy VerifiAIMarketplace
    log("🏪 Deploying VerifiAIMarketplace...");
    const marketplace = await deploy("VerifiAIMarketplace", {
        from: deployer,
        args: [usdfc.address, TREASURY_ADDRESS, PROVIDER_STAKE_AMOUNT],
        log: true,
        waitConfirmations: 1,
    });

    // 4. Deploy VerifiAIPayments
    log("💳 Deploying VerifiAIPayments...");
    const payments = await deploy("VerifiAIPayments", {
        from: deployer,
        args: [usdfc.address, TREASURY_ADDRESS],
        log: true,
        waitConfirmations: 1,
    });

    // 5. Deploy VerifiAIVerification
    log("🔬 Deploying VerifiAIVerification...");
    const verification = await deploy("VerifiAIVerification", {
        from: deployer,
        args: [TELLOR_ADDRESS, usdfc.address],
        log: true,
        waitConfirmations: 1,
    });

    log("✅ VerifiAI deployment completed successfully!");
    log("----------------------------------------------------");
    log("📄 Deployed Contract Addresses:");
    log(`   USDFC Token: ${usdfc.address}`);
    log(`   MarketApiHelper: ${marketApiHelper.address}`);
    log(`   Marketplace: ${marketplace.address}`);
    log(`   Payments: ${payments.address}`);
    log(`   Verification: ${verification.address}`);
    log("----------------------------------------------------");
    log("🔗 Next Steps:");
    log("   1. Update frontend config with deployed addresses");
    log("   2. Mint USDFC tokens for testing (or deposit FIL to mint)");
    log("   3. Test marketplace functionality with real USD-stable payments");
    log("----------------------------------------------------");

    // Verify contracts on explorer if not on development chain
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("🔍 Verifying contracts...");
        await verify(usdfc.address, []);
        await verify(marketplace.address, [usdfc.address, TREASURY_ADDRESS, PROVIDER_STAKE_AMOUNT]);
        await verify(payments.address, [usdfc.address, TREASURY_ADDRESS]);
        await verify(verification.address, [TELLOR_ADDRESS, usdfc.address]);
        await verify(marketApiHelper.address, []);
    }
};

module.exports.tags = ["all", "verifiAI"]; 