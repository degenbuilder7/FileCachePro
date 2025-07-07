const fs = require('fs');
const path = require('path');

async function main() {
  console.log("📋 Updating frontend ABIs...");
  
  // Contract files to extract ABIs from
  const contractFiles = [
    'USDFC.json',
    'VeriFlowMarketApiHelper.json',
    'VerifiAIMarketplace.json',
    'VerifiAIPayments.json',
    'VerifiAIVerification.json'
  ];
  
  const deploymentDir = path.join(__dirname, '..', 'deployments', 'calibration');
  const frontendDir = path.join(__dirname, '..', '..', 'frontend', 'constants');
  
  // Extract ABIs from deployment files
  const abis = {};
  
  for (const file of contractFiles) {
    const filePath = path.join(deploymentDir, file);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      try {
        const contractData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const contractName = file.replace('.json', '');
        abis[contractName] = contractData.abi;
        console.log(`✅ Extracted ABI for ${contractName}`);
      } catch (error) {
        console.error(`❌ Error reading ${file}:`, error.message);
      }
    } else {
      console.log(`⚠️  ${file} not found, skipping...`);
    }
  }
  
  // Check if we have any ABIs
  if (Object.keys(abis).length === 0) {
    console.error("❌ No ABIs found to update!");
    process.exit(1);
  }
  
  // Write updated ABIs to frontend
  const frontendAbiPath = path.join(frontendDir, 'abi.json');
  
  try {
    fs.writeFileSync(frontendAbiPath, JSON.stringify(abis, null, 2));
    console.log(`✅ Updated frontend ABIs at ${frontendAbiPath}`);
    console.log(`📋 Updated contracts: ${Object.keys(abis).join(', ')}`);
  } catch (error) {
    console.error("❌ Error writing frontend ABIs:", error.message);
    process.exit(1);
  }
  
  console.log("🎉 Frontend ABIs updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 