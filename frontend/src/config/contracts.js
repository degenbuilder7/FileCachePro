// VerifiAI Contract Configuration for Filecoin Calibration
// This file will be updated with actual deployed contract addresses

export const FILECOIN_CALIBRATION_CONFIG = {
  chainId: 314159,
  name: "Filecoin Calibration",
  rpcUrl: "https://calibration.filfox.info/rpc/v1",
  blockExplorer: "https://calibration.filfox.info/en",
  
  // Token addresses
  tokens: {
    USDFC: "0x0000000000000000000000000000000000000000", // USDFC on Calibration (UPDATE AFTER DEPLOYMENT)
    TELLOR: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444", // Tellor Oracle
  },
  
  // VerifiAI contract addresses (to be updated after deployment)
  contracts: {
    VerifiAIMarketplace: "0x0000000000000000000000000000000000000000", // UPDATE AFTER DEPLOYMENT
    VerifiAIPayments: "0x0000000000000000000000000000000000000000",    // UPDATE AFTER DEPLOYMENT
    VerifiAIVerification: "0x0000000000000000000000000000000000000000", // UPDATE AFTER DEPLOYMENT
    VerifiAIMarketApiHelper: "0x0000000000000000000000000000000000000000", // UPDATE AFTER DEPLOYMENT
  },
  
  // Deployment configuration
  deployment: {
    deployerAddress: "0x268d62aba7C42fCB4D72A83137DB503935f764fF",
    treasuryAddress: "0x268d62aba7C42fCB4D72A83137DB503935f764fF",
    providerStakeAmount: "100000000000000000000", // 100 USDFC
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
  ]
};

export default FILECOIN_CALIBRATION_CONFIG; 