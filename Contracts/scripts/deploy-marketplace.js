const hre = require("hardhat");

async function main() {
    console.log("🏪 Deploying VerifiAIMarketplace...");

    // Get the signer
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Contract addresses
    const USDFC_ADDRESS = "0x0f703F65596731cFc036cE4eb2acEF37B9169a6e";
    const TREASURY_ADDRESS = deployer.address;
    const PROVIDER_STAKE_AMOUNT = "100000000000000000000"; // 100 USDFC

    // Deploy VerifiAIMarketplace
    const VerifiAIMarketplace = await hre.ethers.getContractFactory("VerifiAIMarketplace");
    console.log("📋 Deploying with parameters:");
    console.log("   USDFC Address:", USDFC_ADDRESS);
    console.log("   Treasury Address:", TREASURY_ADDRESS);
    console.log("   Provider Stake Amount:", PROVIDER_STAKE_AMOUNT);

    const marketplace = await VerifiAIMarketplace.deploy(
        USDFC_ADDRESS,
        TREASURY_ADDRESS,
        PROVIDER_STAKE_AMOUNT
    );

    console.log("⏳ Waiting for deployment...");
    await marketplace.deployed();

    console.log("✅ VerifiAIMarketplace deployed to:", marketplace.address);
    console.log("🔗 Transaction hash:", marketplace.deployTransaction.hash);

    // Save the address
    console.log("💾 Marketplace Address:", marketplace.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 