// VerifiAI Contract Configuration for Filecoin Calibration
// Updated with deployed contract addresses

import contractAddresses from '../../constants/contractAddresses.json'
import contractABIs from '../../constants/abi.json'

// Get contract address for current network
export const getContractAddress = (contractName, chainId = 314159) => {
  const addresses = contractAddresses[chainId?.toString()]
  if (!addresses) {
    throw new Error(`Unsupported network: ${chainId}`)
  }
  
  const address = addresses[contractName]
  if (!address) {
    throw new Error(`Contract ${contractName} not found on network ${chainId}`)
  }
  
  return address
}

// Get contract ABI
export const getContractABI = (contractName) => {
  const abi = contractABIs[contractName]
  if (!abi) {
    throw new Error(`ABI for ${contractName} not found`)
  }
  return abi
}

// Contract configurations - restructured for useContracts hook
export const contracts = {
  314159: { // Filecoin Calibration chain ID
    VerifiAIMarketplace: {
      address: getContractAddress('VerifiAIMarketplace', 314159),
      abi: getContractABI('VerifiAIMarketplace'),
    },
    
    VerifiAIPayments: {
      address: getContractAddress('VerifiAIPayments', 314159),
      abi: getContractABI('VerifiAIPayments'),
    },
    
    VerifiAIVerification: {
      address: getContractAddress('VerifiAIVerification', 314159),
      abi: getContractABI('VerifiAIVerification'),
    },
    
    VeriFlowMarketApiHelper: {
      address: getContractAddress('VeriFlowMarketApiHelper', 314159),
      abi: getContractABI('VeriFlowMarketApiHelper'),
    },
    
    USDFC: {
      address: getContractAddress('USDFC', 314159),
      abi: getContractABI('USDFC'),
    },
  }
}

// Legacy contract configurations (for backwards compatibility)
export const contractsLegacy = {
  VerifiAIMarketplace: {
    name: 'VerifiAIMarketplace',
    getAddress: (chainId) => getContractAddress('VerifiAIMarketplace', chainId),
    abi: getContractABI('VerifiAIMarketplace'),
  },
  
  VerifiAIPayments: {
    name: 'VerifiAIPayments', 
    getAddress: (chainId) => getContractAddress('VerifiAIPayments', chainId),
    abi: getContractABI('VerifiAIPayments'),
  },
  
  VerifiAIVerification: {
    name: 'VerifiAIVerification',
    getAddress: (chainId) => getContractAddress('VerifiAIVerification', chainId),
    abi: getContractABI('VerifiAIVerification'),
  },
  
  VeriFlowMarketApiHelper: {
    name: 'VeriFlowMarketApiHelper',
    getAddress: (chainId) => getContractAddress('VeriFlowMarketApiHelper', chainId),
    abi: getContractABI('VeriFlowMarketApiHelper'),
  },
  
  USDFC: {
    name: 'USDFC',
    getAddress: (chainId) => getContractAddress('USDFC', chainId),
    abi: getContractABI('USDFC'),
  },
}

// Helper to get all contracts for current network
export const getAllContracts = (chainId = 314159) => {
  return contracts[chainId] || {}
}

// Supported networks
export const SUPPORTED_CHAINS = contractAddresses.supportedChainIds
export const FILECOIN_CALIBRATION_CHAIN_ID = 314159

// Network helpers
export const isNetworkSupported = (chainId) => {
  return SUPPORTED_CHAINS.includes(chainId)
}

export const getNetworkName = (chainId) => {
  return contractAddresses.chainNames[chainId?.toString()] || 'Unknown Network'
}

export const FILECOIN_CALIBRATION_CONFIG = {
  chainId: 314159,
  name: "Filecoin Calibration",
  rpcUrl: "https://api.calibration.node.glif.io/rpc/v1",
  blockExplorer: "https://calibration.filfox.info/en",
  
  // Token addresses
  tokens: {
    USDFC: "0x14b547e6d31705dab3bf1a382bAFFd8274127819", // ✅ DEPLOYED - NEW ADDRESS
    TELLOR: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444", // Tellor Oracle
  },
  
  // VerifiAI contract addresses - UPDATED WITH CORRECT DEPLOYED ADDRESSES
  contracts: {
    VerifiAIMarketplace: "0xc2BA3241E24314a3d2738B2e9767cc332AFdaD24", // ✅ DEPLOYED - FIXED USDFC ADDRESS
    VerifiAIPayments: "0x1B4d1eDE4F7F22BE0Ce596203765291BBb59E9dC",    // ✅ DEPLOYED - CORRECTED
    VerifiAIVerification: "0xA4643b8582C4751457030b3c980B2aACcA660CC5", // ✅ DEPLOYED - CORRECTED
    VeriFlowMarketApiHelper: "0x6aEf0883c246435A60AD5921582b22c9a7132175", // ✅ DEPLOYED
  },
  
  // Deployment configuration
  deployment: {
    deployerAddress: "0x268d62aba7C42fCB4D72A83137DB503935f764fF",
    treasuryAddress: "0x268d62aba7C42fCB4D72A83137DB503935f764fF",
    providerStakeAmount: "100000000000000000000", // 100 USDFC
  },

  // Network status - ALL DEPLOYED SUCCESSFULLY
  status: {
    usdfc: "deployed",
    marketApiHelper: "deployed", 
    marketplace: "deployed",
    payments: "deployed",
    verification: "deployed"
  }
};

// Contract ABIs (simplified for key functions)
export const CONTRACT_ABIS = {
  VerifiAIMarketplace: [
    "function stakeAsProvider(uint256 amount) external",
    "function listDataset(string calldata metadataUri, uint256 pricePerBatch, uint64 filecoinDealId) external",
    "function purchaseData(uint256 datasetId, uint256 batchCount) external",
    "function getDataset(uint256 datasetId) external view returns (tuple(uint256 id, address provider, string metadataUri, uint256 pricePerBatch, uint64 filecoinDealId, bool isActive, uint256 totalSales))",
    "function datasetCounter() external view returns (uint256)",
    "function providerStakes(address) external view returns (uint256)",
    "event DatasetListed(uint256 indexed datasetId, address indexed provider, uint256 pricePerBatch)",
    "event DatasetPurchased(uint256 indexed purchaseId, uint256 indexed datasetId, address indexed buyer, uint256 amount)"
  ],
  
  VerifiAIVerification: [
    "function submitTraining(uint256 datasetId, string memory modelHash, string memory datasetHash, uint8 modelType, tuple(uint256 accuracy, uint256 precision, uint256 recall, uint256 f1Score, uint256 confidence, string customMetrics) memory metrics) external",
    "function getTrainingSession(uint256 trainingId) external view returns (tuple(uint256 id, address trainer, uint256 datasetId, string modelHash, string datasetHash, uint8 modelType, tuple(uint256 accuracy, uint256 precision, uint256 recall, uint256 f1Score, uint256 confidence, string customMetrics) metrics, uint8 status, uint256 stakeAmount, uint256 submissionTime, uint256 verificationTime, bytes32 tellorQueryId, bool hasReward))",
    "function currentTrainingId() external view returns (uint256)",
    "event TrainingSubmitted(uint256 indexed trainingId, address indexed trainer, uint256 indexed datasetId, string modelHash)"
  ],
  
  USDFC: [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function mintWithCollateral() external payable",
    "function redeem(uint256 amount) external",
    "function getCollateralInfo(address user) external view returns (uint256, uint256)",
    "function mint(address to, uint256 amount) external"
  ],

  VeriFlowMarketApiHelper: [
    "function getDealActivationInfo(uint64 dealId) external returns (tuple(bool isActivated, bool isTerminated, int64 activatedEpoch, int64 terminatedEpoch))",
    "function getDealDataInfo(uint64 dealId) external returns (tuple(bool isValid, uint64 dataSize, bytes32 dataCommitment))",
    "function isDealActive(uint64 dealId) external returns (bool)",
    "function getDealClient(uint64 dealId) external returns (uint64)",
    "function getDealProvider(uint64 dealId) external returns (uint64)"
  ]
};

export default FILECOIN_CALIBRATION_CONFIG; 