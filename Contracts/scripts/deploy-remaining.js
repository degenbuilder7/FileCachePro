const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying remaining VerifiAI contracts...");
  
  // Contract addresses already deployed
  const USDFC_ADDRESS = "0x0f703F65596731cFc036cE4eb2acEF37B9169a6e";
  const TELLOR_ADDRESS = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444";
  const TREASURY_ADDRESS = "0x268d62aba7C42fCB4D72A83137DB503935f764fF";
  
  console.log("📋 Using existing contracts:");
  console.log("💰 USDFC:", USDFC_ADDRESS);
  console.log("🔮 Tellor:", TELLOR_ADDRESS);
  console.log("🏛️  Treasury:", TREASURY_ADDRESS);
  
  // Deploy VerifiAIPayments
  console.log("\n💳 Deploying VerifiAIPayments...");
  const VerifiAIPayments = await ethers.getContractFactory("VerifiAIPayments");
  const payments = await VerifiAIPayments.deploy(USDFC_ADDRESS, TREASURY_ADDRESS);
  await payments.waitForDeployment();
  const paymentsAddress = await payments.getAddress();
  console.log("✅ VerifiAIPayments deployed to:", paymentsAddress);
  
  // Deploy VerifiAIVerification
  console.log("\n🔬 Deploying VerifiAIVerification...");
  const VerifiAIVerification = await ethers.getContractFactory("VerifiAIVerification");
  const verification = await VerifiAIVerification.deploy(TELLOR_ADDRESS, USDFC_ADDRESS);
  await verification.waitForDeployment();
  const verificationAddress = await verification.getAddress();
  console.log("✅ VerifiAIVerification deployed to:", verificationAddress);
  
  console.log("\n🎉 All contracts deployed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("├── USDFC:", USDFC_ADDRESS);
  console.log("├── VeriFlowMarketApiHelper: 0x6aEf0883c246435A60AD5921582b22c9a7132175");
  console.log("├── VerifiAIMarketplace: 0xb994dFecA893A8248e37a33ABdC9bC67f7f0322d");
  console.log("├── VerifiAIPayments:", paymentsAddress);
  console.log("└── VerifiAIVerification:", verificationAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 