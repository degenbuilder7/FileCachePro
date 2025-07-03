# VeriFlow AI Data Marketplace Contracts

## 🎯 Architecture Overview

VeriFlow uses a **two-contract architecture** to handle Yul stack depth limitations while maintaining full Filecoin integration:

### Core Contracts

1. **`VeriFlowMarketplace.sol`** - Main marketplace contract (compiled ✅)
   - Dataset listing and purchasing
   - Provider staking system
   - USDFC payment processing
   - Basic Filecoin deal validation

2. **`VeriFlowMarketApiHelper.sol`** - MarketAPI operations (compiled ✅)
   - Complex Filecoin MarketAPI calls
   - Deal activation verification
   - Deal data validation
   - Participant verification

### Supporting Contracts

3. **`VeriFlowPayments.sol`** - Payment processing
4. **`VeriFlowVerification.sol`** - AI verification with Tellor oracles

## 🚀 Deployment Strategy

### Quick Deploy
```bash
npx hardhat ignition deploy ignition/modules/VeriFlow.js --network calibration
```

### Production Deployment (Filecoin Mainnet)
```bash
USDFC=0x2421db204968A367CC2C866CD057FA754Cb84EdF \
TREASURY=your_treasury_address \
npx hardhat ignition deploy ignition/modules/VeriFlow.js --network mainnet
```

## 🔧 Integration Pattern

### Option 1: Separate Deployment
Deploy contracts separately and connect them via external transactions:

```solidity
// Deploy both contracts
VeriFlowMarketplace marketplace = new VeriFlowMarketplace(usdfc, treasury, stake);
VeriFlowMarketApiHelper helper = new VeriFlowMarketApiHelper();

// Connect via external calls
bool isActive = helper.isDealActive(dealId);
```

### Option 2: Marketplace + Helper Integration
Update marketplace to accept helper contract address and use it for advanced verification:

```solidity
// In marketplace contract
function setMarketApiHelper(address _helper) external onlyOwner {
    marketApiHelper = IVeriFlowMarketApiHelper(_helper);
}

function verifyDealWithHelper(uint64 dealId) external view returns (bool) {
    if (address(marketApiHelper) != address(0)) {
        return marketApiHelper.isDealActive(dealId);
    }
    return dealId > 0; // Basic fallback
}
```

## 📝 Smart Contract Details

### VeriFlowMarketplace Features
- ✅ USDFC payments with real contract addresses
- ✅ Provider staking system
- ✅ Dataset listing and purchasing
- ✅ Platform fee collection (2.5% default)
- ✅ Basic Filecoin deal ID validation
- ✅ Upgradeable admin functions

### VeriFlowMarketApiHelper Features
- ✅ Full MarketAPI integration
- ✅ Deal activation status verification
- ✅ Deal data commitment validation
- ✅ Client/provider verification
- ✅ Stack-optimized data structures

## 🌍 Network Configuration

### Filecoin Calibration (Testnet)
- **Chain ID**: 314159
- **RPC**: https://api.calibration.node.glif.io/rpc/v1
- **USDFC**: `0x2421db204968A367CC2C866CD057FA754Cb84EdF`

### Filecoin Mainnet
- **Chain ID**: 314
- **RPC**: https://api.node.glif.io/rpc/v1
- **USDFC**: `0x2421db204968A367CC2C866CD057FA754Cb84EdF`

## 🎯 Protocol Labs Genesis Hackathon Integration

### Key Features for Judging
1. **F3 Fast Finality**: Leverages 450x faster transaction speeds
2. **USDFC Integration**: Production-ready stablecoin payments
3. **MarketAPI Verification**: Cryptographic proof of Filecoin deals
4. **AI Data Provenance**: Immutable training data lineage
5. **Tellor Oracle Integration**: Decentralized AI model verification

### Demo Flow
1. **Data Provider**: Stakes USDFC → Lists AI dataset → Links Filecoin deal
2. **AI Developer**: Browses data → Purchases with USDFC → Trains model
3. **Verification**: Helper contract verifies Filecoin deal authenticity
4. **Oracle**: Tellor validates model performance post-training

## 🔍 Testing

```bash
# Compile all contracts
npx hardhat compile

# Run tests
npx hardhat test

# Gas reporting
REPORT_GAS=true npx hardhat test
```

## 🛠️ Development

### Adding MarketAPI Integration to Marketplace

If you want to integrate the helper contract directly into the marketplace:

1. **Add Helper Interface Import**:
```solidity
import {IVeriFlowMarketApiHelper} from "./IVeriFlowMarketApiHelper.sol";
```

2. **Add Helper Contract Storage**:
```solidity
IVeriFlowMarketApiHelper public marketApiHelper;
```

3. **Update Constructor**:
```solidity
constructor(/* existing params */, address _marketApiHelper) {
    // existing code
    marketApiHelper = IVeriFlowMarketApiHelper(_marketApiHelper);
}
```

4. **Use Helper in Verification**:
```solidity
function _verifyFilecoinDeal(uint64 dealId) internal {
    if (address(marketApiHelper) != address(0)) {
        require(marketApiHelper.isDealActive(dealId), "Deal not active");
    }
}
```

## 📊 Gas Optimization

Current settings in `hardhat.config.js`:
- **Optimizer**: Enabled with 1000 runs
- **Via IR**: Enabled for better optimization
- **Yul Optimizer**: Custom stack allocation settings

This configuration resolves Yul stack depth issues while maintaining gas efficiency.

---

**Built for Protocol Labs Genesis Hackathon 2025** 🚀
*Transforming the $9T AI market with verifiable data provenance*
