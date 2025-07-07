module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, get, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("🚀 Deploying remaining VerifiAI contracts...");
  
  // Contract addresses already deployed
  const USDFC_ADDRESS = "0x0f703F65596731cFc036cE4eb2acEF37B9169a6e";
  const TELLOR_ADDRESS = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444";
  const TREASURY_ADDRESS = "0x268d62aba7C42fCB4D72A83137DB503935f764fF";
  
  log("📋 Using existing contracts:");
  log("💰 USDFC:", USDFC_ADDRESS);
  log("🔮 Tellor:", TELLOR_ADDRESS);
  log("🏛️  Treasury:", TREASURY_ADDRESS);
  log("👤 Deployer:", deployer);
  
  // Deploy VerifiAIPayments
  log("\n💳 Deploying VerifiAIPayments...");
  const paymentsDeployment = await deploy("VerifiAIPayments", {
    from: deployer,
    args: [USDFC_ADDRESS, TREASURY_ADDRESS],
    log: true,
    waitConfirmations: 1,
  });
  
  // Deploy VerifiAIVerification
  log("\n🔬 Deploying VerifiAIVerification...");
  const verificationDeployment = await deploy("VerifiAIVerification", {
    from: deployer,
    args: [TELLOR_ADDRESS, USDFC_ADDRESS],
    log: true,
    waitConfirmations: 1,
  });
  
  log("\n🎉 All contracts deployed successfully!");
  log("📋 Contract Addresses:");
  log("├── USDFC:", USDFC_ADDRESS);
  log("├── VeriFlowMarketApiHelper: 0x6aEf0883c246435A60AD5921582b22c9a7132175");
  log("├── VerifiAIMarketplace: 0xb994dFecA893A8248e37a33ABdC9bC67f7f0322d");
  log("├── VerifiAIPayments:", paymentsDeployment.address);
  log("└── VerifiAIVerification:", verificationDeployment.address);
};

module.exports.tags = ["VerifiAIRemaining"];
module.exports.dependencies = ["VerifiAICore"]; 