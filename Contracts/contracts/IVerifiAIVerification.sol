// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IVeriFlowVerification
 * @dev Interface for the VeriFlow verification system
 */
interface IVerifiAIVerification {
    /// @notice Enumeration for verification status
    enum VerificationStatus {
        PENDING,
        VERIFIED,
        FAILED,
        DISPUTED,
        CANCELLED
    }

    /// @notice Enumeration for AI model types
    enum ModelType {
        CLASSIFICATION,
        REGRESSION,
        NLP,
        COMPUTER_VISION,
        REINFORCEMENT_LEARNING,
        GENERATIVE,
        MULTIMODAL
    }

    /// @notice Structure for performance metrics
    struct PerformanceMetrics {
        uint256 accuracy;      // Accuracy percentage (0-10000)
        uint256 precision;     // Precision percentage (0-10000)
        uint256 recall;        // Recall percentage (0-10000)
        uint256 f1Score;       // F1 score percentage (0-10000)
        uint256 confidence;    // Confidence level (0-10000)
        string customMetrics;  // JSON string for additional metrics
    }

    /// @notice Structure for training session
    struct TrainingSession {
        uint256 id;
        address trainer;
        uint256 datasetId;
        string modelHash;      // IPFS hash of trained model
        string datasetHash;    // IPFS hash of training dataset
        ModelType modelType;
        PerformanceMetrics metrics;
        VerificationStatus status;
        uint256 stakeAmount;
        uint256 submissionTime;
        uint256 verificationTime;
        bytes32 tellorQueryId;
        bool hasReward;
    }

    /**
     * @notice Submit AI training session for verification
     * @param datasetId Dataset used for training
     * @param modelHash IPFS hash of the trained model
     * @param datasetHash IPFS hash of the dataset
     * @param modelType Type of AI model
     * @param metrics Self-reported performance metrics
     */
    function submitTraining(
        uint256 datasetId,
        string memory modelHash,
        string memory datasetHash,
        ModelType modelType,
        PerformanceMetrics memory metrics
    ) external;

    /**
     * @notice Get verification result from Tellor oracle
     * @param trainingId Training session ID
     */
    function getVerificationResult(uint256 trainingId) external;

    /**
     * @notice Get training session details
     * @param trainingId Training session ID
     * @return Training session details
     */
    function getTrainingSession(uint256 trainingId) 
        external 
        view 
        returns (TrainingSession memory);

    /**
     * @notice Get verified training sessions for a dataset
     * @param datasetId Dataset ID
     * @return Array of verified training session IDs
     */
    function getVerifiedTrainingSessions(uint256 datasetId) 
        external 
        view 
        returns (uint256[] memory);

    /**
     * @notice Calculate average performance metrics for a dataset
     * @param datasetId Dataset ID
     * @return avgAccuracy Average accuracy
     * @return avgPrecision Average precision
     * @return avgRecall Average recall
     * @return avgF1Score Average F1 score
     * @return sessionCount Number of verified sessions
     */
    function getDatasetPerformanceStats(uint256 datasetId) 
        external 
        view 
        returns (
            uint256 avgAccuracy,
            uint256 avgPrecision,
            uint256 avgRecall,
            uint256 avgF1Score,
            uint256 sessionCount
        );
} 