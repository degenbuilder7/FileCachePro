// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VerifiAIPayments
 * @dev USDFC payment processor with escrow and subscription management
 * @notice Handles all payment operations for the VerifiAI marketplace
 */
contract VerifiAIPayments is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Platform fee in basis points (100 = 1%)
    uint256 public constant PLATFORM_FEE = 250; // 2.5%
    
    /// @notice Maximum subscription duration (1 year)
    uint256 public constant MAX_SUBSCRIPTION_DURATION = 365 days;
    
    /// @notice Minimum escrow duration (1 hour)
    uint256 public constant MIN_ESCROW_DURATION = 1 hours;

    /// @notice USDFC stablecoin contract
    IERC20 public immutable usdfc;
    
    /// @notice Platform treasury address
    address public treasury;
    
    /// @notice VerifiAI marketplace contract address
    address public marketplace;

    /// @notice Current escrow ID counter
    uint256 public currentEscrowId;
    
    /// @notice Current subscription ID counter
    uint256 public currentSubscriptionId;

    /// @notice Enumeration for payment types
    enum PaymentType {
        ONE_TIME,
        SUBSCRIPTION,
        ESCROW,
        STAKE
    }

    /// @notice Enumeration for escrow status
    enum EscrowStatus {
        ACTIVE,
        COMPLETED,
        DISPUTED,
        REFUNDED,
        CANCELLED
    }

    /// @notice Enumeration for subscription status
    enum SubscriptionStatus {
        ACTIVE,
        PAUSED,
        CANCELLED,
        EXPIRED
    }

    /// @notice Structure for escrow details
    struct EscrowDetails {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        uint256 createdAt;
        uint256 releaseTime;
        EscrowStatus status;
        string description;
        uint256 datasetId;
    }

    /// @notice Structure for subscription details
    struct Subscription {
        uint256 id;
        address subscriber;
        address provider;
        uint256 amountPerPeriod;
        uint256 periodDuration;
        uint256 startTime;
        uint256 endTime;
        uint256 lastPayment;
        SubscriptionStatus status;
        uint256 datasetId;
        string accessLevel;
    }

    /// @notice Structure for payment record
    struct PaymentRecord {
        uint256 id;
        address payer;
        address recipient;
        uint256 amount;
        uint256 platformFee;
        PaymentType paymentType;
        uint256 timestamp;
        uint256 relatedId; // escrow ID, subscription ID, etc.
        string description;
    }

    /// @notice Mapping of escrow ID to escrow details
    mapping(uint256 => EscrowDetails) public escrows;
    
    /// @notice Mapping of subscription ID to subscription details
    mapping(uint256 => Subscription) public subscriptions;
    
    /// @notice Mapping of payment ID to payment record
    mapping(uint256 => PaymentRecord) public payments;
    
    /// @notice Mapping of user to their subscription IDs
    mapping(address => uint256[]) public userSubscriptions;
    
    /// @notice Mapping of user to their escrow IDs (as buyer)
    mapping(address => uint256[]) public userEscrows;
    
    /// @notice Current payment ID counter
    uint256 public currentPaymentId;

    /// @notice Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 datasetId
    );

    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 amount
    );

    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed provider,
        uint256 amountPerPeriod,
        uint256 duration
    );

    event SubscriptionPayment(
        uint256 indexed subscriptionId,
        uint256 amount,
        uint256 nextPaymentDue
    );

    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address indexed canceller
    );

    event PaymentProcessed(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        PaymentType paymentType
    );

    /// @notice Modifiers
    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "Only marketplace");
        _;
    }

    modifier validEscrow(uint256 escrowId) {
        require(escrowId > 0 && escrowId <= currentEscrowId, "Invalid escrow ID");
        _;
    }

    modifier validSubscription(uint256 subscriptionId) {
        require(subscriptionId > 0 && subscriptionId <= currentSubscriptionId, "Invalid subscription ID");
        _;
    }

    /**
     * @dev Constructor
     * @param _usdfc USDFC token contract address
     * @param _treasury Platform treasury address
     */
    constructor(
        address _usdfc,
        address _treasury
    ) Ownable(msg.sender) {
        require(_usdfc != address(0), "Invalid USDFC address");
        require(_treasury != address(0), "Invalid treasury address");
        
        usdfc = IERC20(_usdfc);
        treasury = _treasury;
    }

    /**
     * @notice Set marketplace contract address (admin only)
     * @param _marketplace Marketplace contract address
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid marketplace address");
        marketplace = _marketplace;
    }

    /**
     * @notice Process one-time payment
     * @param recipient Payment recipient
     * @param amount Payment amount
     * @param datasetId Related dataset ID
     * @param description Payment description
     */
    function processPayment(
        address recipient,
        uint256 amount,
        uint256 datasetId,
        string memory description
    ) external onlyMarketplace nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");

        uint256 platformFee = (amount * PLATFORM_FEE) / 10000;
        uint256 recipientAmount = amount - platformFee;

        // Transfer tokens
        usdfc.safeTransferFrom(msg.sender, treasury, platformFee);
        usdfc.safeTransferFrom(msg.sender, recipient, recipientAmount);

        // Record payment
        currentPaymentId++;
        payments[currentPaymentId] = PaymentRecord({
            id: currentPaymentId,
            payer: msg.sender,
            recipient: recipient,
            amount: amount,
            platformFee: platformFee,
            paymentType: PaymentType.ONE_TIME,
            timestamp: block.timestamp,
            relatedId: datasetId,
            description: description
        });

        emit PaymentProcessed(
            currentPaymentId,
            msg.sender,
            recipient,
            amount,
            PaymentType.ONE_TIME
        );
    }

    /**
     * @notice Create escrow for secure transactions
     * @param seller Seller address
     * @param amount Escrow amount
     * @param releaseTime When funds can be released
     * @param datasetId Related dataset ID
     * @param description Escrow description
     */
    function createEscrow(
        address seller,
        uint256 amount,
        uint256 releaseTime,
        uint256 datasetId,
        string memory description
    ) external nonReentrant whenNotPaused {
        require(seller != address(0), "Invalid seller");
        require(amount > 0, "Amount must be positive");
        require(releaseTime > block.timestamp + MIN_ESCROW_DURATION, "Invalid release time");

        // Transfer tokens to escrow
        usdfc.safeTransferFrom(msg.sender, address(this), amount);

        currentEscrowId++;
        escrows[currentEscrowId] = EscrowDetails({
            id: currentEscrowId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            createdAt: block.timestamp,
            releaseTime: releaseTime,
            status: EscrowStatus.ACTIVE,
            description: description,
            datasetId: datasetId
        });

        userEscrows[msg.sender].push(currentEscrowId);

        emit EscrowCreated(currentEscrowId, msg.sender, seller, amount, datasetId);
    }

    /**
     * @notice Release escrow funds to seller
     * @param escrowId Escrow ID to release
     */
    function releaseEscrow(uint256 escrowId) 
        external 
        validEscrow(escrowId) 
        nonReentrant 
    {
        EscrowDetails storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.ACTIVE, "Escrow not active");
        require(
            msg.sender == escrow.buyer || 
            msg.sender == escrow.seller || 
            msg.sender == owner() ||
            block.timestamp >= escrow.releaseTime,
            "Not authorized to release"
        );

        escrow.status = EscrowStatus.COMPLETED;

        uint256 platformFee = (escrow.amount * PLATFORM_FEE) / 10000;
        uint256 sellerAmount = escrow.amount - platformFee;

        // Transfer funds
        usdfc.safeTransfer(treasury, platformFee);
        usdfc.safeTransfer(escrow.seller, sellerAmount);

        emit EscrowReleased(escrowId, escrow.seller, sellerAmount);
    }

    /**
     * @notice Refund escrow to buyer (only before release time or by admin)
     * @param escrowId Escrow ID to refund
     */
    function refundEscrow(uint256 escrowId) 
        external 
        validEscrow(escrowId) 
        nonReentrant 
    {
        EscrowDetails storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.ACTIVE, "Escrow not active");
        require(
            msg.sender == escrow.buyer || 
            msg.sender == owner(),
            "Not authorized to refund"
        );

        escrow.status = EscrowStatus.REFUNDED;

        // Return full amount to buyer (no platform fee on refund)
        usdfc.safeTransfer(escrow.buyer, escrow.amount);

        emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
    }

    /**
     * @notice Create subscription for recurring payments
     * @param provider Service provider address
     * @param amountPerPeriod Amount to pay per period
     * @param periodDuration Duration of each period in seconds
     * @param totalPeriods Total number of periods
     * @param datasetId Related dataset ID
     * @param accessLevel Access level description
     */
    function createSubscription(
        address provider,
        uint256 amountPerPeriod,
        uint256 periodDuration,
        uint256 totalPeriods,
        uint256 datasetId,
        string memory accessLevel
    ) external nonReentrant whenNotPaused {
        require(provider != address(0), "Invalid provider");
        require(amountPerPeriod > 0, "Amount must be positive");
        require(periodDuration > 0, "Period duration must be positive");
        require(totalPeriods > 0, "Total periods must be positive");
        require(
            periodDuration * totalPeriods <= MAX_SUBSCRIPTION_DURATION,
            "Subscription too long"
        );

        currentSubscriptionId++;
        uint256 endTime = block.timestamp + (periodDuration * totalPeriods);
        
        subscriptions[currentSubscriptionId] = Subscription({
            id: currentSubscriptionId,
            subscriber: msg.sender,
            provider: provider,
            amountPerPeriod: amountPerPeriod,
            periodDuration: periodDuration,
            startTime: block.timestamp,
            endTime: endTime,
            lastPayment: 0,
            status: SubscriptionStatus.ACTIVE,
            datasetId: datasetId,
            accessLevel: accessLevel
        });

        userSubscriptions[msg.sender].push(currentSubscriptionId);

        emit SubscriptionCreated(
            currentSubscriptionId,
            msg.sender,
            provider,
            amountPerPeriod,
            endTime
        );

        // Process first payment
        _processSubscriptionPayment(currentSubscriptionId);
    }

    /**
     * @notice Process subscription payment
     * @param subscriptionId Subscription ID
     */
    function processSubscriptionPayment(uint256 subscriptionId) 
        external 
        validSubscription(subscriptionId) 
        nonReentrant 
        whenNotPaused 
    {
        _processSubscriptionPayment(subscriptionId);
    }

    /**
     * @notice Internal function to process subscription payment
     * @param subscriptionId Subscription ID
     */
    function _processSubscriptionPayment(uint256 subscriptionId) internal {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.status == SubscriptionStatus.ACTIVE, "Subscription not active");
        require(block.timestamp < sub.endTime, "Subscription expired");
        
        uint256 nextPaymentDue = sub.lastPayment + sub.periodDuration;
        require(block.timestamp >= nextPaymentDue, "Payment not due yet");

        uint256 platformFee = (sub.amountPerPeriod * PLATFORM_FEE) / 10000;
        uint256 providerAmount = sub.amountPerPeriod - platformFee;

        // Transfer tokens
        usdfc.safeTransferFrom(sub.subscriber, treasury, platformFee);
        usdfc.safeTransferFrom(sub.subscriber, sub.provider, providerAmount);

        sub.lastPayment = block.timestamp;

        // Record payment
        currentPaymentId++;
        payments[currentPaymentId] = PaymentRecord({
            id: currentPaymentId,
            payer: sub.subscriber,
            recipient: sub.provider,
            amount: sub.amountPerPeriod,
            platformFee: platformFee,
            paymentType: PaymentType.SUBSCRIPTION,
            timestamp: block.timestamp,
            relatedId: subscriptionId,
            description: "Subscription payment"
        });

        uint256 nextDue = sub.lastPayment + sub.periodDuration;
        emit SubscriptionPayment(subscriptionId, sub.amountPerPeriod, nextDue);
    }

    /**
     * @notice Cancel subscription
     * @param subscriptionId Subscription ID to cancel
     */
    function cancelSubscription(uint256 subscriptionId) 
        external 
        validSubscription(subscriptionId) 
    {
        Subscription storage sub = subscriptions[subscriptionId];
        require(
            msg.sender == sub.subscriber || 
            msg.sender == sub.provider || 
            msg.sender == owner(),
            "Not authorized to cancel"
        );
        require(sub.status == SubscriptionStatus.ACTIVE, "Subscription not active");

        sub.status = SubscriptionStatus.CANCELLED;

        emit SubscriptionCancelled(subscriptionId, msg.sender);
    }

    /**
     * @notice Get user's subscriptions
     * @param user User address
     * @return Array of subscription IDs
     */
    function getUserSubscriptions(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userSubscriptions[user];
    }

    /**
     * @notice Get user's escrows
     * @param user User address
     * @return Array of escrow IDs
     */
    function getUserEscrows(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userEscrows[user];
    }

    /**
     * @notice Check if subscription payment is due
     * @param subscriptionId Subscription ID
     * @return Whether payment is due
     */
    function isPaymentDue(uint256 subscriptionId) 
        external 
        view 
        validSubscription(subscriptionId)
        returns (bool) 
    {
        Subscription storage sub = subscriptions[subscriptionId];
        if (sub.status != SubscriptionStatus.ACTIVE) return false;
        if (block.timestamp >= sub.endTime) return false;
        
        uint256 nextPaymentDue = sub.lastPayment + sub.periodDuration;
        return block.timestamp >= nextPaymentDue;
    }

    /**
     * @notice Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
    }

    /**
     * @notice Emergency withdrawal (admin only)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        usdfc.safeTransfer(owner(), amount);
    }
} 