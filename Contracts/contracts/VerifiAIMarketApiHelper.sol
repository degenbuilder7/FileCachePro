// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// MarketAPI imports isolated to this contract only
import {MarketAPI} from "@zondax/filecoin-solidity/contracts/v0.8/MarketAPI.sol";
import {CommonTypes} from "@zondax/filecoin-solidity/contracts/v0.8/types/CommonTypes.sol";
import {MarketTypes} from "@zondax/filecoin-solidity/contracts/v0.8/types/MarketTypes.sol";
import {FilAddresses} from "@zondax/filecoin-solidity/contracts/v0.8/utils/FilAddresses.sol";

/**
 * @title VeriFlowMarketApiHelper
 * @dev Isolated contract for MarketAPI interactions to avoid stack depth issues
 * @notice This contract handles all complex Filecoin MarketAPI operations
 */
contract VeriFlowMarketApiHelper {
    
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
     * @notice Get deal activation information (stack-optimized)
     * @param dealId Deal ID to check
     * @return info Deal activation information
     */
    function getDealActivationInfo(uint64 dealId) 
        external 
        returns (DealActivationInfo memory info) 
    {
        require(dealId > 0, "Invalid deal ID");
        
        MarketTypes.GetDealActivationReturn memory activation = MarketAPI.getDealActivation(dealId);
        
        info.activatedEpoch = CommonTypes.ChainEpoch.unwrap(activation.activated);
        info.terminatedEpoch = CommonTypes.ChainEpoch.unwrap(activation.terminated);
        info.isActivated = info.activatedEpoch > 0;
        info.isTerminated = info.terminatedEpoch > 0;
    }

    /**
     * @notice Get deal data information (stack-optimized)
     * @param dealId Deal ID to check
     * @return info Deal data information
     */
    function getDealDataInfo(uint64 dealId) 
        external 
        returns (DealDataInfo memory info) 
    {
        require(dealId > 0, "Invalid deal ID");
        
        MarketTypes.GetDealDataCommitmentReturn memory dealData = MarketAPI.getDealDataCommitment(dealId);
        
        info.isValid = dealData.data.length > 0;
        info.dataSize = dealData.size;
        info.dataCommitment = keccak256(dealData.data);
    }

    /**
     * @notice Simple check if deal is active and valid
     * @param dealId Deal ID to check
     * @return isActive Whether deal is active
     */
    function isDealActive(uint64 dealId) external returns (bool isActive) {
        if (dealId == 0) return false;
        
        DealActivationInfo memory info = this.getDealActivationInfo(dealId);
        return info.isActivated && !info.isTerminated;
    }

    /**
     * @notice Get deal client ID
     * @param dealId Deal ID
     * @return clientId Client ID
     */
    function getDealClient(uint64 dealId) external returns (uint64 clientId) {
        require(dealId > 0, "Invalid deal ID");
        clientId = MarketAPI.getDealClient(dealId);
    }

    /**
     * @notice Get deal provider ID  
     * @param dealId Deal ID
     * @return providerId Provider ID
     */
    function getDealProvider(uint64 dealId) external returns (uint64 providerId) {
        require(dealId > 0, "Invalid deal ID");
        providerId = MarketAPI.getDealProvider(dealId);
    }
} 