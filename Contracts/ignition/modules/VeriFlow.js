const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VeriFlowModule", (m) => {
  // Tellor Oracle addresses (EIP-55 checksummed)
  const TELLOR_MAINNET = "0x8cFc184c877154a8F9ffE0fe75649dbe5e2DBEbf"; // Tellor on Filecoin mainnet
  const TELLOR_CALIBRATION = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444"; // Tellor on Filecoin calibration
  
  // Deploy our own USDFC mock contract for testing
  const usdfc = m.contract("USDFC", []);
  
  // Use parameters for configuration
  const tellorOracle = m.getParameter("tellor", TELLOR_CALIBRATION);
  const treasury = m.getParameter("treasury", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"); // Default treasury
  const providerStakeAmount = m.getParameter("providerStakeAmount", "1000000000000000000000"); // 1000 USDFC (18 decimals)
  
  // Deploy MarketAPI helper contract first
  const marketApiHelper = m.contract("VeriFlowMarketApiHelper", []);
  
  // Deploy main marketplace contract
  const marketplace = m.contract("VerifiAIMarketplace", [
    usdfc,
    treasury,  
    providerStakeAmount
  ]);
  
  // Deploy payments contract (constructor takes usdfc and treasury)
  const payments = m.contract("VerifiAIPayments", [
    usdfc,
    treasury
  ]);
  
  // Deploy verification contract with Tellor oracle
  const verification = m.contract("VerifiAIVerification", [
    tellorOracle,
    usdfc
  ]);

  return { 
    usdfc,
    marketplace, 
    marketApiHelper,
    payments,
    verification
  };
}); 