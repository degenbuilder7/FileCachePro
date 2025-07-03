// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IVeriFlowMarketApiHelper
 * @dev Interface for MarketAPI helper contract
 * @notice Clean interface without MarketAPI imports to avoid stack depth issues
 */
interface IVerifiAIMarketApiHelper {
    
    /// @notice Simple struct for deal activation info
    struct DealActivationInfo {
        bool isActivated;
        bool isTerminated;
        int64 activatedEpoch;
        int64 terminatedEpoch;
    }

    /// @notice Simple struct for deal data info
    struct DealDataInfo {
        bool isValid;
        uint64 dataSize;
        bytes32 dataCommitment;
    }

    /**
     * @notice Get deal activation information
     * @param dealId Deal ID to check
     * @return info Deal activation information
     */
    function getDealActivationInfo(uint64 dealId) 
        external 
        returns (DealActivationInfo memory info);

    /**
     * @notice Get deal data information
     * @param dealId Deal ID to check
     * @return info Deal data information
     */
    function getDealDataInfo(uint64 dealId) 
        external 
        returns (DealDataInfo memory info);

    /**
     * @notice Simple check if deal is active and valid
     * @param dealId Deal ID to check
     * @return isActive Whether deal is active
     */
    function isDealActive(uint64 dealId) external returns (bool isActive);

    /**
     * @notice Get deal client ID
     * @param dealId Deal ID
     * @return clientId Client ID
     */
    function getDealClient(uint64 dealId) external returns (uint64 clientId);

    /**
     * @notice Get deal provider ID  
     * @param dealId Deal ID
     * @return providerId Provider ID
     */
    function getDealProvider(uint64 dealId) external returns (uint64 providerId);
} 