// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VerifiAIMarketplace
 * @notice Verifiable AI Training Data Marketplace for Protocol Labs Genesis Hackathon 2025
 * @dev Minimized core version to avoid Yul stack depth issues
 */
contract VerifiAIMarketplace is Ownable, ReentrancyGuard {
    
    /// @notice USDFC token contract for payments
    IERC20 public immutable usdfc;
    
    /// @notice Treasury address for fees
    address public treasury;
    
    /// @notice Minimum stake amount for providers
    uint256 public providerStakeAmount;
    
    /// @notice Current dataset ID counter
    uint256 public datasetCounter;
    
    /// @notice Dataset information
    struct Dataset {
        uint256 id;
        address provider;
        string metadataUri;
        uint256 pricePerBatch;
        uint64 filecoinDealId;
        bool isActive;
        uint256 totalSales;
    }
    
    /// @notice Purchase information
    struct Purchase {
        uint256 id;
        uint256 datasetId;
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bool isVerified;
    }
    
    /// @notice Mapping from dataset ID to dataset info
    mapping(uint256 => Dataset) public datasets;
    
    /// @notice Mapping from purchase ID to purchase info
    mapping(uint256 => Purchase) public purchases;
    
    /// @notice Provider stakes
    mapping(address => uint256) public providerStakes;
    
    /// @notice Purchase counter
    uint256 public purchaseCounter;
    
    /// @notice Platform fee (in basis points, 250 = 2.5%)
    uint256 public platformFeeRate = 250;
    
    // Events
    event DatasetListed(
        uint256 indexed datasetId, 
        address indexed provider, 
        uint256 pricePerBatch
    );
    
    event DatasetPurchased(
        uint256 indexed purchaseId,
        uint256 indexed datasetId,
        address indexed buyer,
        uint256 amount
    );
    
    event ProviderStaked(address indexed provider, uint256 amount);
    event ProviderUnstaked(address indexed provider, uint256 amount);
    
    /**
     * @notice Constructor
     * @param _usdfc USDFC token address
     * @param _treasury Treasury address
     * @param _providerStakeAmount Minimum provider stake amount
     */
    constructor(
        address _usdfc,
        address _treasury,
        uint256 _providerStakeAmount
    ) Ownable(msg.sender) {
        require(_usdfc != address(0), "Invalid USDFC address");
        require(_treasury != address(0), "Invalid treasury address");
        
        usdfc = IERC20(_usdfc);
        treasury = _treasury;
        providerStakeAmount = _providerStakeAmount;
    }
    
    /// @notice Modifier to check if provider has sufficient stake
    modifier onlyStakedProvider() {
        require(providerStakes[msg.sender] >= providerStakeAmount, "Insufficient stake");
        _;
    }
    
    /// @notice Modifier to check valid dataset
    modifier validDataset(uint256 datasetId) {
        require(datasetId > 0 && datasetId <= datasetCounter, "Invalid dataset ID");
        require(datasets[datasetId].isActive, "Dataset not active");
        _;
    }
    
    /**
     * @notice Stake USDFC to become a data provider
     * @param amount Amount to stake
     */
    function stakeAsProvider(uint256 amount) external nonReentrant {
        require(amount >= providerStakeAmount, "Insufficient stake amount");
        
        usdfc.transferFrom(msg.sender, address(this), amount);
        providerStakes[msg.sender] += amount;
        
        emit ProviderStaked(msg.sender, amount);
    }
    
    /**
     * @notice List a new dataset for sale
     * @param metadataUri IPFS URI for dataset metadata
     * @param pricePerBatch Price per training batch in USDFC
     * @param filecoinDealId Associated Filecoin deal ID (optional)
     */
    function listDataset(
        string calldata metadataUri,
        uint256 pricePerBatch,
        uint64 filecoinDealId
    ) external onlyStakedProvider {
        require(bytes(metadataUri).length > 0, "Invalid metadata URI");
        require(pricePerBatch > 0, "Invalid price");
        
        datasetCounter++;
        
        datasets[datasetCounter] = Dataset({
            id: datasetCounter,
            provider: msg.sender,
            metadataUri: metadataUri,
            pricePerBatch: pricePerBatch,
            filecoinDealId: filecoinDealId,
            isActive: true,
            totalSales: 0
        });
        
        emit DatasetListed(datasetCounter, msg.sender, pricePerBatch);
    }
    
    /**
     * @notice Purchase training data
     * @param datasetId Dataset to purchase
     * @param batchCount Number of batches to purchase
     */
    function purchaseData(
        uint256 datasetId,
        uint256 batchCount
    ) external validDataset(datasetId) nonReentrant {
        require(batchCount > 0, "Invalid batch count");
        
        Dataset storage dataset = datasets[datasetId];
        uint256 totalAmount = dataset.pricePerBatch * batchCount;
        
        // Calculate platform fee
        uint256 platformFee = (totalAmount * platformFeeRate) / 10000;
        uint256 providerAmount = totalAmount - platformFee;
        
        // Transfer payment
        usdfc.transferFrom(msg.sender, treasury, platformFee);
        usdfc.transferFrom(msg.sender, dataset.provider, providerAmount);
        
        // Record purchase
        purchaseCounter++;
        purchases[purchaseCounter] = Purchase({
            id: purchaseCounter,
            datasetId: datasetId,
            buyer: msg.sender,
            amount: totalAmount,
            timestamp: block.timestamp,
            isVerified: false
        });
        
        // Update dataset stats
        dataset.totalSales += totalAmount;
        
        emit DatasetPurchased(purchaseCounter, datasetId, msg.sender, totalAmount);
    }
    
    /**
     * @notice Get dataset information
     * @param datasetId Dataset ID
     * @return Dataset information
     */
    function getDataset(uint256 datasetId) external view returns (Dataset memory) {
        require(datasetId > 0 && datasetId <= datasetCounter, "Invalid dataset ID");
        return datasets[datasetId];
    }
    
    /**
     * @notice Get purchase information
     * @param purchaseId Purchase ID
     * @return Purchase information
     */
    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        require(purchaseId > 0 && purchaseId <= purchaseCounter, "Invalid purchase ID");
        return purchases[purchaseId];
    }
    
    /**
     * @notice Check if a dataset has an active Filecoin deal
     * @param datasetId Dataset ID
     * @return isActive Whether the deal is active (basic check: deal ID exists)
     * @return dealId The Filecoin deal ID (0 if no deal)
     */
    function isDatasetDealActive(uint256 datasetId) 
        external 
        view
        validDataset(datasetId) 
        returns (bool isActive, uint64 dealId) 
    {
        dealId = datasets[datasetId].filecoinDealId;
        isActive = dealId > 0;
    }
    
    /**
     * @notice Update platform fee rate (owner only)
     * @param newFeeRate New fee rate in basis points
     */
    function updatePlatformFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 1000, "Fee rate too high"); // Max 10%
        platformFeeRate = newFeeRate;
    }
    
    /**
     * @notice Update provider stake requirement (owner only)
     * @param newStakeAmount New minimum stake amount
     */
    function updateProviderStakeAmount(uint256 newStakeAmount) external onlyOwner {
        providerStakeAmount = newStakeAmount;
    }
} 