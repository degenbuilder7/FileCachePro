const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { 
  toFIL, 
  toUSDFC, 
  deployVeriFlowContracts, 
  setupBasicTestScenario,
  expectEvent 
} = require("./VeriFlowTestUtils");

describe("VerifiAI Verification Contract", function () {

  describe("Deployment", function () {
    it("Should deploy with correct owner", async function () {
      const { verification, deployer } = await loadFixture(deployVeriFlowContracts);
      
      expect(await verification.owner()).to.equal(deployer.address);
    });

    it("Should set correct initial verification fee", async function () {
      const { verification } = await loadFixture(deployVeriFlowContracts);
      
      expect(await verification.verificationFee()).to.equal(toUSDFC(10)); // 10 USDFC default
    });
  });

  describe("Data Quality Verification", function () {
    it("Should allow data quality verification submission", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const qualityScore = 85;
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_report_data"));
      
      await expect(verification.connect(user1).submitQualityVerification(
        datasetId,
        qualityScore,
        verificationHash
      )).to.emit(verification, "QualityVerificationSubmitted")
        .withArgs(datasetId, user1.address, qualityScore, verificationHash);
      
      const verificationInfo = await verification.getQualityVerification(datasetId);
      expect(verificationInfo.verifier).to.equal(user1.address);
      expect(verificationInfo.qualityScore).to.equal(qualityScore);
      expect(verificationInfo.verificationHash).to.equal(verificationHash);
      expect(verificationInfo.isVerified).to.be.true;
    });

    it("Should validate quality score range", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_report_data"));
      
      // Test invalid quality score > 100
      await expect(verification.connect(user1).submitQualityVerification(
        datasetId,
        150,
        verificationHash
      )).to.be.revertedWith("Quality score must be between 0 and 100");
      
      // Test boundary values
      await verification.connect(user1).submitQualityVerification(datasetId, 0, verificationHash);
      await verification.connect(user1).submitQualityVerification(datasetId, 100, verificationHash);
    });

    it("Should allow quality verification updates", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const initialScore = 75;
      const updatedScore = 90;
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_report_data"));
      
      // Initial verification
      await verification.connect(user1).submitQualityVerification(
        datasetId,
        initialScore,
        verificationHash
      );
      
      // Update verification
      await expect(verification.connect(user1).submitQualityVerification(
        datasetId,
        updatedScore,
        verificationHash
      )).to.emit(verification, "QualityVerificationUpdated")
        .withArgs(datasetId, user1.address, updatedScore);
      
      const verificationInfo = await verification.getQualityVerification(datasetId);
      expect(verificationInfo.qualityScore).to.equal(updatedScore);
    });
  });

  describe("Training Verification", function () {
    it("Should allow training verification submission", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("trained_model_data"));
      const trainingMetrics = "accuracy:0.95,loss:0.05";
      const verificationProof = ethers.keccak256(ethers.toUtf8Bytes("training_proof"));
      
      await expect(verification.connect(user1).submitTrainingVerification(
        datasetId,
        modelHash,
        trainingMetrics,
        verificationProof
      )).to.emit(verification, "TrainingVerificationSubmitted")
        .withArgs(datasetId, user1.address, modelHash);
      
      const trainingInfo = await verification.getTrainingVerification(datasetId, user1.address);
      expect(trainingInfo.modelHash).to.equal(modelHash);
      expect(trainingInfo.trainingMetrics).to.equal(trainingMetrics);
      expect(trainingInfo.verificationProof).to.equal(verificationProof);
      expect(trainingInfo.isVerified).to.be.true;
    });

    it("Should validate training verification parameters", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("trained_model_data"));
      const trainingMetrics = "accuracy:0.95,loss:0.05";
      const verificationProof = ethers.keccak256(ethers.toUtf8Bytes("training_proof"));
      
      // Test with zero model hash
      await expect(verification.connect(user1).submitTrainingVerification(
        datasetId,
        ethers.ZeroHash,
        trainingMetrics,
        verificationProof
      )).to.be.revertedWith("Model hash cannot be empty");
      
      // Test with empty training metrics
      await expect(verification.connect(user1).submitTrainingVerification(
        datasetId,
        modelHash,
        "",
        verificationProof
      )).to.be.revertedWith("Training metrics cannot be empty");
    });

    it("Should allow multiple training verifications per dataset", async function () {
      const { verification, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const modelHash1 = ethers.keccak256(ethers.toUtf8Bytes("model_1"));
      const modelHash2 = ethers.keccak256(ethers.toUtf8Bytes("model_2"));
      const trainingMetrics = "accuracy:0.95,loss:0.05";
      const verificationProof = ethers.keccak256(ethers.toUtf8Bytes("training_proof"));
      
      // user1 submits training verification
      await verification.connect(user1).submitTrainingVerification(
        datasetId,
        modelHash1,
        trainingMetrics,
        verificationProof
      );
      
      // user2 submits different training verification for same dataset
      await verification.connect(user2).submitTrainingVerification(
        datasetId,
        modelHash2,
        trainingMetrics,
        verificationProof
      );
      
      const training1 = await verification.getTrainingVerification(datasetId, user1.address);
      const training2 = await verification.getTrainingVerification(datasetId, user2.address);
      
      expect(training1.modelHash).to.equal(modelHash1);
      expect(training2.modelHash).to.equal(modelHash2);
      expect(training1.isVerified).to.be.true;
      expect(training2.isVerified).to.be.true;
    });
  });

  describe("Oracle Integration", function () {
    it("Should allow oracle verification requests", async function () {
      const { verification, usdfc, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const queryData = ethers.toUtf8Bytes("model_performance_query");
      
      // Pay verification fee
      const fee = await verification.verificationFee();
      await usdfc.connect(user1).approve(await verification.getAddress(), fee);
      
      await expect(verification.connect(user1).requestOracleVerification(datasetId, queryData))
        .to.emit(verification, "OracleVerificationRequested")
        .withArgs(datasetId, user1.address, queryData);
      
      const request = await verification.getOracleRequest(1);
      expect(request.requester).to.equal(user1.address);
      expect(request.datasetId).to.equal(datasetId);
      expect(request.isPaid).to.be.true;
      expect(request.isCompleted).to.be.false;
    });

    it("Should reject oracle requests without payment", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const queryData = ethers.toUtf8Bytes("model_performance_query");
      
      // Don't pay fee
      await expect(verification.connect(user1).requestOracleVerification(datasetId, queryData))
        .to.be.revertedWithCustomError(verification, "ERC20InsufficientAllowance");
    });

    it("Should allow owner to submit oracle responses", async function () {
      const { verification, usdfc, user1, deployer } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const queryData = ethers.toUtf8Bytes("model_performance_query");
      const response = ethers.toUtf8Bytes("verification_result");
      
      // Request oracle verification
      const fee = await verification.verificationFee();
      await usdfc.connect(user1).approve(await verification.getAddress(), fee);
      await verification.connect(user1).requestOracleVerification(datasetId, queryData);
      
      // Owner submits response
      await expect(verification.connect(deployer).submitOracleResponse(1, response))
        .to.emit(verification, "OracleResponseSubmitted")
        .withArgs(1, response);
      
      const request = await verification.getOracleRequest(1);
      expect(request.isCompleted).to.be.true;
      expect(request.response).to.equal(ethers.hexlify(response));
    });

    it("Should reject oracle responses from non-owner", async function () {
      const { verification, usdfc, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const queryData = ethers.toUtf8Bytes("model_performance_query");
      const response = ethers.toUtf8Bytes("verification_result");
      
      // Request oracle verification
      const fee = await verification.verificationFee();
      await usdfc.connect(user1).approve(await verification.getAddress(), fee);
      await verification.connect(user1).requestOracleVerification(datasetId, queryData);
      
      // Non-owner tries to submit response
      await expect(verification.connect(user2).submitOracleResponse(1, response))
        .to.be.revertedWithCustomError(verification, "OwnableUnauthorizedAccount");
    });
  });

  describe("Verification Fee Management", function () {
    it("Should allow owner to update verification fee", async function () {
      const { verification, deployer } = await loadFixture(deployVeriFlowContracts);
      
      const newFee = toUSDFC(25);
      
      await expect(verification.connect(deployer).updateVerificationFee(newFee))
        .to.emit(verification, "VerificationFeeUpdated")
        .withArgs(newFee);
      
      expect(await verification.verificationFee()).to.equal(newFee);
    });

    it("Should reject verification fee updates from non-owner", async function () {
      const { verification, user1 } = await loadFixture(deployVeriFlowContracts);
      
      await expect(verification.connect(user1).updateVerificationFee(toUSDFC(25)))
        .to.be.revertedWithCustomError(verification, "OwnableUnauthorizedAccount");
    });

    it("Should validate verification fee amount", async function () {
      const { verification, deployer } = await loadFixture(deployVeriFlowContracts);
      
      // Test with zero fee (should be allowed for promotional periods)
      await verification.connect(deployer).updateVerificationFee(0);
      expect(await verification.verificationFee()).to.equal(0);
      
      // Test with very high fee
      const highFee = toUSDFC(1000);
      await verification.connect(deployer).updateVerificationFee(highFee);
      expect(await verification.verificationFee()).to.equal(highFee);
    });
  });

  describe("Verification Queries", function () {
    it("Should track verification counts correctly", async function () {
      const { verification, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      expect(await verification.totalQualityVerifications()).to.equal(0);
      expect(await verification.totalTrainingVerifications()).to.equal(0);
      
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_data"));
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("model_data"));
      
      // Submit quality verification
      await verification.connect(user1).submitQualityVerification(1, 85, verificationHash);
      expect(await verification.totalQualityVerifications()).to.equal(1);
      
      // Submit training verification
      await verification.connect(user2).submitTrainingVerification(
        1,
        modelHash,
        "metrics",
        ethers.keccak256(ethers.toUtf8Bytes("proof"))
      );
      expect(await verification.totalTrainingVerifications()).to.equal(1);
    });

    it("Should return correct verification status", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      
      // Initially no verifications
      expect(await verification.isQualityVerified(datasetId)).to.be.false;
      expect(await verification.isTrainingVerified(datasetId, user1.address)).to.be.false;
      
      // Submit verifications
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_data"));
      await verification.connect(user1).submitQualityVerification(datasetId, 85, verificationHash);
      
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("model_data"));
      await verification.connect(user1).submitTrainingVerification(
        datasetId,
        modelHash,
        "metrics",
        ethers.keccak256(ethers.toUtf8Bytes("proof"))
      );
      
      // Check verification status
      expect(await verification.isQualityVerified(datasetId)).to.be.true;
      expect(await verification.isTrainingVerified(datasetId, user1.address)).to.be.true;
    });
  });

  describe("Reputation System", function () {
    it("Should track verifier reputation", async function () {
      const { verification, user1 } = await loadFixture(setupBasicTestScenario);
      
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_data"));
      
      // Initial reputation should be 0
      expect(await verification.getVerifierReputation(user1.address)).to.equal(0);
      
      // Submit multiple quality verifications
      await verification.connect(user1).submitQualityVerification(1, 85, verificationHash);
      await verification.connect(user1).submitQualityVerification(2, 90, verificationHash);
      
      // Reputation should increase
      expect(await verification.getVerifierReputation(user1.address)).to.equal(2);
    });

    it("Should allow reputation rewards for good verifications", async function () {
      const { verification, user1, deployer } = await loadFixture(setupBasicTestScenario);
      
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_data"));
      await verification.connect(user1).submitQualityVerification(1, 85, verificationHash);
      
      // Owner can reward good verification
      await expect(verification.connect(deployer).rewardVerifier(user1.address, 10))
        .to.emit(verification, "VerifierRewarded")
        .withArgs(user1.address, 10);
      
      expect(await verification.getVerifierReputation(user1.address)).to.equal(11); // 1 + 10
    });

    it("Should allow reputation penalties for bad verifications", async function () {
      const { verification, user1, deployer } = await loadFixture(setupBasicTestScenario);
      
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_data"));
      await verification.connect(user1).submitQualityVerification(1, 85, verificationHash);
      
      // Build up some reputation first
      await verification.connect(deployer).rewardVerifier(user1.address, 10);
      expect(await verification.getVerifierReputation(user1.address)).to.equal(11);
      
      // Owner can penalize bad verification
      await expect(verification.connect(deployer).penalizeVerifier(user1.address, 5))
        .to.emit(verification, "VerifierPenalized")
        .withArgs(user1.address, 5);
      
      expect(await verification.getVerifierReputation(user1.address)).to.equal(6); // 11 - 5
    });

    it("Should not allow reputation to go below zero", async function () {
      const { verification, user1, deployer } = await loadFixture(setupBasicTestScenario);
      
      // Try to penalize when reputation is 0
      await expect(verification.connect(deployer).penalizeVerifier(user1.address, 5))
        .to.be.revertedWith("Cannot reduce reputation below zero");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete verification workflow", async function () {
      const { verification, usdfc, user1, user2, deployer } = await loadFixture(setupBasicTestScenario);
      
      const datasetId = 1;
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_report"));
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("trained_model"));
      
      // 1. Submit quality verification
      await verification.connect(user1).submitQualityVerification(datasetId, 92, verificationHash);
      
      // 2. Submit training verification
      await verification.connect(user2).submitTrainingVerification(
        datasetId,
        modelHash,
        "accuracy:0.95,precision:0.93",
        ethers.keccak256(ethers.toUtf8Bytes("training_proof"))
      );
      
      // 3. Request oracle verification
      const fee = await verification.verificationFee();
      await usdfc.connect(user1).approve(await verification.getAddress(), fee);
      await verification.connect(user1).requestOracleVerification(
        datasetId,
        ethers.toUtf8Bytes("performance_query")
      );
      
      // 4. Submit oracle response
      await verification.connect(deployer).submitOracleResponse(
        1,
        ethers.toUtf8Bytes("verified_performance_data")
      );
      
      // 5. Reward verifiers
      await verification.connect(deployer).rewardVerifier(user1.address, 5);
      await verification.connect(deployer).rewardVerifier(user2.address, 3);
      
      // 6. Verify final state
      expect(await verification.isQualityVerified(datasetId)).to.be.true;
      expect(await verification.isTrainingVerified(datasetId, user2.address)).to.be.true;
      expect(await verification.totalQualityVerifications()).to.equal(1);
      expect(await verification.totalTrainingVerifications()).to.equal(1);
      expect(await verification.getVerifierReputation(user1.address)).to.equal(6); // 1 + 5
      expect(await verification.getVerifierReputation(user2.address)).to.equal(4); // 1 + 3
      
      const oracleRequest = await verification.getOracleRequest(1);
      expect(oracleRequest.isCompleted).to.be.true;
    });
  });
}); 