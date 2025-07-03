const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { parseEther } = require("ethers");

module.exports = buildModule("VeriFlowDeployModule", (m) => {
  console.log("🚀 Starting VeriFlow deployment on Filecoin Calibration...");
  
  // Use Calibration testnet addresses directly
  const wfilAddress = "0x422D3812b2C0522b5a48CA7BB01C93dB5aACb6f3"; // WFIL on Calibration
  const tellorAddress = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444"; // Tellor Oracle on Calibration
  const treasuryAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Treasury address
  const providerStakeAmount = parseEther("100"); // 100 WFIL stake
  
  console.log(`💰 WFIL Address: ${wfilAddress}`);
  console.log(`🔮 Tellor Oracle: ${tellorAddress}`);
  console.log(`🏛️  Treasury Address: ${treasuryAddress}`);
  console.log(`📊 Provider Stake: ${providerStakeAmount.toString()} wei`);
  
  // Step 1: Deploy MarketAPI Helper
  console.log("📋 Deploying VeriFlowMarketApiHelper...");
  const marketApiHelper = m.contract("VeriFlowMarketApiHelper", []);
  
  // Step 2: Deploy main Marketplace contract
  console.log("🏪 Deploying VeriFlowMarketplace...");
  const marketplace = m.contract("VeriFlowMarketplace", [
    wfilAddress,
    treasuryAddress,
    providerStakeAmount
  ]);
  
  // Step 3: Deploy Payments contract
  console.log("💳 Deploying VeriFlowPayments...");
  const payments = m.contract("VeriFlowPayments", [
    wfilAddress,
    treasuryAddress
  ]);
  
  // Step 4: Deploy Verification contract
  console.log("🔬 Deploying VeriFlowVerification with Tellor...");
  const verification = m.contract("VeriFlowVerification", [
    tellorAddress,
    wfilAddress
  ]);
  
  console.log("✅ VeriFlow deployment configuration completed!");
  
  return { 
    marketApiHelper,
    marketplace, 
    payments,
    verification
  };
}); 