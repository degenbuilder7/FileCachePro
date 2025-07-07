const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VeriFlowDeployModule", (m) => {
  console.log("🚀 Starting VerifiAI deployment on Filecoin Calibration...");
  
  // Use Calibration testnet addresses directly
  const tellorAddress = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444"; // Tellor Oracle on Calibration
  const treasuryAddress = "0x268d62aba7C42fCB4D72A83137DB503935f764fF"; // Treasury address (deployer)
  const providerStakeAmount = "100000000000000000000"; // 100 USDFC stake (100 * 10^18)
  
  console.log(`🔮 Tellor Oracle: ${tellorAddress}`);
  console.log(`🏛️  Treasury Address: ${treasuryAddress}`);
  console.log(`📊 Provider Stake: ${providerStakeAmount} wei`);
  
  // Step 1: Deploy USDFC Token
  console.log("💰 Deploying USDFC Token...");
  const usdfc = m.contract("USDFC", []);
  
  // Step 2: Deploy MarketAPI Helper
  console.log("📋 Deploying VeriFlowMarketApiHelper...");
  const marketApiHelper = m.contract("VeriFlowMarketApiHelper", []);
  
  // Step 3: Deploy main Marketplace contract
  console.log("🏪 Deploying VerifiAIMarketplace...");
  const marketplace = m.contract("VerifiAIMarketplace", [
    usdfc,
    treasuryAddress,
    providerStakeAmount
  ]);
  
  // Step 4: Deploy Payments contract
  console.log("💳 Deploying VerifiAIPayments...");
  const payments = m.contract("VerifiAIPayments", [
    usdfc,
    treasuryAddress
  ]);
  
  // Step 5: Deploy Verification contract
  console.log("🔬 Deploying VerifiAIVerification with Tellor...");
  const verification = m.contract("VerifiAIVerification", [
    tellorAddress,
    usdfc
  ]);
  
  console.log("✅ VerifiAI deployment configuration completed!");
  
  return { 
    usdfc,
    marketApiHelper,
    marketplace, 
    payments,
    verification
  };
}); 