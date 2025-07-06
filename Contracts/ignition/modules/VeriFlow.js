const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VeriFlowModule", (m) => {
  // Production USDFC contract addresses
  const USDFC_MAINNET = "0x80B98d3aa09ffff255c3ba4A241111Ff1262F045"; // Real USDFC on Filecoin
  const USDFC_CALIBRATION = "0x2421db204968A367CC2C866CD057FA754Cb84EdF"; // USDFC testnet
  
  // Use calibration for development
  const usdfc = m.getParameter("usdfc", USDFC_CALIBRATION);
  const treasury = m.getParameter("treasury", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"); // Default treasury
  const providerStakeAmount = m.getParameter("providerStakeAmount", "1000000000000000000"); // 1 USDFC (18 decimals)
  
  // Deploy MarketAPI helper contract first
  const marketApiHelper = m.contract("VeriFlowMarketApiHelper", []);
  
  // Deploy supporting contracts (if needed)
  const verificationContract = m.getParameter("verificationContract", "0x0000000000000000000000000000000000000000");
  const subnetRegistry = m.getParameter("subnetRegistry", "0x0000000000000000000000000000000000000000");
  
  // Deploy main marketplace contract
  const marketplace = m.contract("VeriFlowMarketplace", [
    usdfc,
    treasury,  
    providerStakeAmount
  ]);
  
  // Deploy payments contract
  const payments = m.contract("VeriFlowPayments", [
    usdfc,
    marketplace
  ]);
  
  // Deploy verification contract
  const verification = m.contract("VeriFlowVerification", [
    marketplace
  ]);

  return { 
    marketplace, 
    marketApiHelper,
    payments,
    verification
  };
}); 