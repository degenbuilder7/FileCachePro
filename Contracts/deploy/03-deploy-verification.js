module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("🔬 Deploying VerifiAIVerification...");
  
  // Contract addresses
  const USDFC_ADDRESS = "0x0f703F65596731cFc036cE4eb2acEF37B9169a6e";
  const TELLOR_ADDRESS = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444";
  
  log("📋 Using:");
  log("💰 USDFC:", USDFC_ADDRESS);
  log("🔮 Tellor:", TELLOR_ADDRESS);
  log("👤 Deployer:", deployer);
  
  // Deploy VerifiAIVerification
  const verificationDeployment = await deploy("VerifiAIVerification", {
    from: deployer,
    args: [TELLOR_ADDRESS, USDFC_ADDRESS],
    log: true,
    waitConfirmations: 1,
  });
  
  log("✅ VerifiAIVerification deployed to:", verificationDeployment.address);
};

module.exports.tags = ["VerifiAIVerification"];
module.exports.dependencies = []; 