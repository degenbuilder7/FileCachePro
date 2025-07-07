# VeriFlow AI Marketplace Deployment Status
## Filecoin Calibration Testnet (Chain ID: 314159)

**Deployment Date**: Latest attempt on 2025

### ✅ Successfully Deployed Contracts

| Contract | Address | Status | Transaction Hash |
|----------|---------|--------|------------------|
| **USDFC Token** | `0x0f703F65596731cFc036cE4eb2acEF37B9169a6e` | ✅ Deployed | - |
| **VeriFlowMarketApiHelper** | `0x6aEf0883c246435A60AD5921582b22c9a7132175` | ✅ Deployed | `0x4adb7f3282d32a663a54fa79c9918752bc10cc882962aa5b7ee95dbb7f02b8e6` |

### ⏳ Pending Deployment

| Contract | Status | Issue |
|----------|--------|-------|
| **VerifiAIMarketplace** | ❌ Failed | Nonce conflicts during deployment |
| **VerifiAIPayments** | ❌ Failed | Nonce conflicts during deployment |
| **VerifiAIVerification** | ❌ Failed | Nonce conflicts during deployment |

### 🔧 Configuration Constants

```javascript
const NETWORK_CONFIG = {
  chainId: 314159,
  networkName: "calibration",
  rpcUrl: "https://api.calibration.node.glif.io/rpc/v1",
  tellorOracle: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444",
  treasury: "0x268d62aba7C42fCB4D72A83137DB503935f764fF",
  providerStakeAmount: "100000000000000000000" // 100 USDFC
}
```

### 📋 Next Steps

1. **Wait for Network Stabilization**: Allow current transactions to be fully processed (5+ confirmations)
2. **Deploy Remaining Contracts**: Complete deployment of VerifiAIMarketplace, VerifiAIPayments, and VerifiAIVerification
3. **Update Frontend**: Update contract addresses and ABIs in frontend configuration
4. **Test Integration**: Verify end-to-end functionality between contracts and frontend
5. **Contract Verification**: Submit contracts for verification on Filecoin block explorer

### 🚨 Known Issues

- **Nonce Management**: Filecoin Calibration network experiencing transaction congestion causing nonce conflicts
- **Gas Estimation**: Some contracts require manual gas limit setting due to complex MarketAPI calls
- **Transaction Finality**: F3 fast finality should reduce confirmation times to ~2 minutes

### 🔗 Useful Links

- [Filecoin Calibration Explorer](https://calibration.filfox.info/)
- [USDFC Token on Explorer](https://calibration.filfox.info/en/address/0x0f703F65596731cFc036cE4eb2acEF37B9169a6e)
- [VeriFlowMarketApiHelper on Explorer](https://calibration.filfox.info/en/address/0x6aEf0883c246435A60AD5921582b22c9a7132175)

### 💡 Deployment Commands

**To complete remaining deployments when network stabilizes:**

```bash
# Individual contract deployment approach
cd Contracts
npx hardhat deploy --network calibration --tags individual

# Alternative: Manual script deployment
npx hardhat run scripts/deploy-marketplace.js --network calibration
npx hardhat run scripts/deploy-payments.js --network calibration  
npx hardhat run scripts/deploy-verification.js --network calibration
``` 