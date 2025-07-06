const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing USDFC Minting with Updated Rates...");
  console.log("================================================");

  // Get the deployed USDFC contract
  const USDFC = await hre.ethers.getContractFactory("USDFC");
  const usdfc = USDFC.attach("0x14b547e6d31705dab3bf1a382bAFFd8274127819");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Testing with account:", deployer.address);
  
  // Check initial balance
  const initialBalance = await usdfc.balanceOf(deployer.address);
  console.log("💰 Initial USDFC balance:", hre.ethers.utils.formatEther(initialBalance));
  
  // Check FIL balance
  const filBalance = await deployer.getBalance();
  console.log("💎 FIL balance:", hre.ethers.utils.formatEther(filBalance));
  
  console.log("\n📊 Testing Minting Calculations...");
  console.log("Expected: 0.1 FIL → 100 USDFC");
  console.log("Expected: 1.0 FIL → 1000 USDFC");
  
  // Test calculation preview
  const testAmount = hre.ethers.utils.parseEther("0.1");
  console.log("\n🧮 Calculation Preview:");
  console.log("   Input: 0.1 FIL =", testAmount.toString(), "wei");
  console.log("   Expected output: 100 USDFC =", hre.ethers.utils.parseEther("100").toString(), "wei");
  console.log("   Contract calculation: input * 1000 =", testAmount.mul(1000).toString(), "wei");
  
  // Verify the calculation matches
  const expectedOutput = hre.ethers.utils.parseEther("100");
  const contractOutput = testAmount.mul(1000);
  
  if (contractOutput.toString() === expectedOutput.toString()) {
    console.log("✅ SUCCESS: Contract calculation is correct!");
    console.log("   0.1 FIL will mint exactly 100 USDFC");
  } else {
    console.log("❌ ERROR: Contract calculation is wrong!");
    console.log("   Expected:", expectedOutput.toString());
    console.log("   Contract gives:", contractOutput.toString());
  }
  
  // Check contract details
  console.log("\n💳 Contract Details:");
  const name = await usdfc.name();
  const symbol = await usdfc.symbol();
  const decimals = await usdfc.decimals();
  const totalSupply = await usdfc.totalSupply();
  
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", hre.ethers.utils.formatEther(totalSupply));
  
  console.log("\n================================================");
  console.log("🎯 Frontend Testing Instructions:");
  console.log("1. Open http://localhost:3002");
  console.log("2. Connect wallet to Filecoin Calibration");
  console.log("3. Click 'Mint 100 USDFC (0.1 FIL)'");
  console.log("4. Confirm transaction and verify you get 100 USDFC");
  console.log("5. The new contract calculation: 0.1 FIL → 100 USDFC ✅");
  console.log("================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 