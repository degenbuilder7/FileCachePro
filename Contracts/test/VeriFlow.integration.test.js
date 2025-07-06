const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { 
  toFIL, 
  toUSDFC, 
  deployVeriFlowContracts, 
  setupBasicTestScenario,
  createSampleDataset
} = require("./VeriFlowTestUtils");

describe("VeriFlow Integration Tests", function () {

  describe("Complete Marketplace Flow", function () {
    it("Should handle end-to-end data marketplace transaction", async function () {
      const { 
        marketplace, 
        usdfc, 
        verification, 
        payments, 
        dataProvider1, 
        user1, 
        deployer 
      } = await loadFixture(setupBasicTestScenario);
      
      // 1. DataProvider stakes to become provider
      const stakeAmount = toUSDFC(200);
      await usdfc.connect(dataProvider1).mint({ value: toFIL(0.2) }); // Get extra USDFC for staking
      await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);
      
      // Verify provider is active
      const providerInfo = await marketplace.providers(dataProvider1.address);
      expect(providerInfo.isActive).to.be.true;
      expect(providerInfo.stake).to.equal(stakeAmount);
      
      // 2. Provider lists a dataset
      const dataset = createSampleDataset();
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      const datasetInfo = await marketplace.getDataset(1);
      expect(datasetInfo.provider).to.equal(dataProvider1.address);
      expect(datasetInfo.price).to.equal(dataset.price);
      expect(datasetInfo.isActive).to.be.true;
      
      // 3. Submit quality verification for the dataset
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_verification_data"));
      await verification.connect(dataProvider1).submitQualityVerification(
        1, // datasetId
        dataset.qualityScore,
        verificationHash
      );
      
      expect(await verification.isQualityVerified(1)).to.be.true;
      
      // 4. User purchases the dataset through marketplace
      const initialProviderBalance = await usdfc.balanceOf(dataProvider1.address);
      const initialPlatformBalance = await usdfc.balanceOf(deployer.address);
      
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset.price);
      await marketplace.connect(user1).purchaseDataset(1);
      
      // Verify purchase was recorded
      expect(await marketplace.hasPurchased(user1.address, 1)).to.be.true;
      
      // Verify payment was processed (95% to provider, 5% platform fee)
      const finalProviderBalance = await usdfc.balanceOf(dataProvider1.address);
      const finalPlatformBalance = await usdfc.balanceOf(deployer.address);
      
      const expectedProviderAmount = (dataset.price * 95n) / 100n; // 95%
      const expectedPlatformFee = (dataset.price * 5n) / 100n; // 5%
      
      expect(finalProviderBalance - initialProviderBalance).to.equal(expectedProviderAmount);
      expect(finalPlatformBalance - initialPlatformBalance).to.equal(expectedPlatformFee);
      
      // 5. User submits training verification after using the data
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("trained_model_weights"));
      await verification.connect(user1).submitTrainingVerification(
        1, // datasetId
        modelHash,
        "accuracy:0.94,loss:0.06,f1:0.92",
        ethers.keccak256(ethers.toUtf8Bytes("training_proof"))
      );
      
      expect(await verification.isTrainingVerified(1, user1.address)).to.be.true;
      
      // 6. Request oracle verification for model performance
      const verificationFee = await verification.verificationFee();
      await usdfc.connect(user1).approve(await verification.getAddress(), verificationFee);
      await verification.connect(user1).requestOracleVerification(
        1,
        ethers.toUtf8Bytes("model_performance_benchmark")
      );
      
      // 7. Oracle submits verification response
      await verification.connect(deployer).submitOracleResponse(
        1,
        ethers.toUtf8Bytes("performance_verified:true,score:94.2")
      );
      
      const oracleRequest = await verification.getOracleRequest(1);
      expect(oracleRequest.isCompleted).to.be.true;
      
      // 8. Verify final marketplace state
      expect(await marketplace.totalDatasets()).to.equal(1);
      expect(await verification.totalQualityVerifications()).to.equal(1);
      expect(await verification.totalTrainingVerifications()).to.equal(1);
      
      const finalProviderInfo = await marketplace.providers(dataProvider1.address);
      expect(finalProviderInfo.totalDatasets).to.equal(1);
    });

    it("Should handle multiple providers and cross-dataset interactions", async function () {
      const { 
        marketplace, 
        usdfc, 
        verification, 
        payments,
        dataProvider1, 
        dataProvider2,
        user1, 
        user2,
        user3 
      } = await loadFixture(setupBasicTestScenario);
      
      // Setup two providers
      const stakeAmount = toUSDFC(150);
      
      // Provider 1 setup
      await usdfc.connect(dataProvider1).mint({ value: toFIL(0.15) });
      await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);
      
      // Provider 2 setup
      await usdfc.connect(dataProvider2).mint({ value: toFIL(0.15) });
      await usdfc.connect(dataProvider2).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider2).stakeAsProvider(stakeAmount);
      
      // List datasets from both providers
      const dataset1 = createSampleDataset(1, "Computer Vision Dataset");
      const dataset2 = createSampleDataset(2, "NLP Dataset");
      
      await marketplace.connect(dataProvider1).listDataset(
        dataset1.name,
        dataset1.description,
        "computer-vision",
        2000000, // 2MB
        "images",
        toUSDFC(75),
        88
      );
      
      await marketplace.connect(dataProvider2).listDataset(
        dataset2.name,
        dataset2.description,
        "nlp",
        1500000, // 1.5MB
        "text",
        toUSDFC(60),
        85
      );
      
      // Submit quality verifications
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("cv_quality_data"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("nlp_quality_data"));
      
      await verification.connect(dataProvider1).submitQualityVerification(1, 88, hash1);
      await verification.connect(dataProvider2).submitQualityVerification(2, 85, hash2);
      
      // Multiple users purchase different datasets
      await usdfc.connect(user1).approve(await marketplace.getAddress(), toUSDFC(75));
      await marketplace.connect(user1).purchaseDataset(1);
      
      await usdfc.connect(user2).approve(await marketplace.getAddress(), toUSDFC(60));
      await marketplace.connect(user2).purchaseDataset(2);
      
      await usdfc.connect(user3).mint({ value: toFIL(1) }); // Give user3 USDFC
      await usdfc.connect(user3).approve(await marketplace.getAddress(), toUSDFC(75));
      await marketplace.connect(user3).purchaseDataset(1);
      
      // Users submit training verifications
      const model1Hash = ethers.keccak256(ethers.toUtf8Bytes("cv_model"));
      const model2Hash = ethers.keccak256(ethers.toUtf8Bytes("nlp_model"));
      const model3Hash = ethers.keccak256(ethers.toUtf8Bytes("cv_model_v2"));
      
      await verification.connect(user1).submitTrainingVerification(
        1, model1Hash, "accuracy:0.91", ethers.keccak256(ethers.toUtf8Bytes("proof1"))
      );
      
      await verification.connect(user2).submitTrainingVerification(
        2, model2Hash, "bleu:0.87", ethers.keccak256(ethers.toUtf8Bytes("proof2"))
      );
      
      await verification.connect(user3).submitTrainingVerification(
        1, model3Hash, "accuracy:0.93", ethers.keccak256(ethers.toUtf8Bytes("proof3"))
      );
      
      // Verify final state
      expect(await marketplace.totalDatasets()).to.equal(2);
      expect(await verification.totalQualityVerifications()).to.equal(2);
      expect(await verification.totalTrainingVerifications()).to.equal(3);
      
      // Check purchase records
      expect(await marketplace.hasPurchased(user1.address, 1)).to.be.true;
      expect(await marketplace.hasPurchased(user2.address, 2)).to.be.true;
      expect(await marketplace.hasPurchased(user3.address, 1)).to.be.true;
      
      // Check provider datasets
      const provider1Datasets = await marketplace.getProviderDatasets(dataProvider1.address);
      const provider2Datasets = await marketplace.getProviderDatasets(dataProvider2.address);
      
      expect(provider1Datasets.length).to.equal(1);
      expect(provider2Datasets.length).to.equal(1);
    });
  });

  describe("Payment System Integration", function () {
    it("Should handle escrow payments for large transactions", async function () {
      const { 
        marketplace, 
        usdfc, 
        payments,
        dataProvider1, 
        user1 
      } = await loadFixture(setupBasicTestScenario);
      
      // Setup provider
      const stakeAmount = toUSDFC(200);
      await usdfc.connect(dataProvider1).mint({ value: toFIL(0.2) });
      await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);
      
      // List expensive dataset
      const dataset = createSampleDataset();
      const highPrice = toUSDFC(500); // High value dataset
      
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        highPrice,
        dataset.qualityScore
      );
      
      // User creates escrow payment instead of direct purchase
      await usdfc.connect(user1).mint({ value: toFIL(5) }); // Get enough USDFC
      await usdfc.connect(user1).approve(await payments.getAddress(), highPrice);
      
      await payments.connect(user1).createEscrowPayment(
        dataProvider1.address,
        highPrice,
        1 // datasetId
      );
      
      const escrow = await payments.getEscrow(1);
      expect(escrow.buyer).to.equal(user1.address);
      expect(escrow.seller).to.equal(dataProvider1.address);
      expect(escrow.amount).to.equal(highPrice);
      expect(escrow.isCompleted).to.be.false;
      
      // After dataset delivery and verification, buyer releases escrow
      const initialProviderBalance = await usdfc.balanceOf(dataProvider1.address);
      
      await payments.connect(user1).releaseEscrow(1);
      
      const finalProviderBalance = await usdfc.balanceOf(dataProvider1.address);
      const expectedAmount = (highPrice * 95n) / 100n; // After 5% platform fee
      
      expect(finalProviderBalance - initialProviderBalance).to.equal(expectedAmount);
      
      const finalEscrow = await payments.getEscrow(1);
      expect(finalEscrow.isCompleted).to.be.true;
    });

    it("Should handle refund scenarios", async function () {
      const { 
        marketplace, 
        usdfc, 
        payments,
        dataProvider1, 
        user1,
        deployer 
      } = await loadFixture(setupBasicTestScenario);
      
      // Setup provider and dataset
      const stakeAmount = toUSDFC(150);
      await usdfc.connect(dataProvider1).mint({ value: toFIL(0.15) });
      await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);
      
      const dataset = createSampleDataset();
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      // User purchases dataset
      const initialUserBalance = await usdfc.balanceOf(user1.address);
      
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset.price);
      await marketplace.connect(user1).purchaseDataset(1);
      
      // Check payment was processed
      const paymentId = 1;
      const payment = await payments.getPayment(paymentId);
      expect(payment.buyer).to.equal(user1.address);
      expect(payment.isCompleted).to.be.true;
      
      // Admin processes refund due to data quality issues
      await payments.connect(deployer).processRefund(paymentId);
      
      const finalUserBalance = await usdfc.balanceOf(user1.address);
      expect(finalUserBalance).to.equal(initialUserBalance); // Full refund
    });
  });

  describe("Verification System Integration", function () {
    it("Should handle reputation-based verification workflow", async function () {
      const { 
        verification,
        usdfc,
        user1, 
        user2,
        user3,
        deployer 
      } = await loadFixture(setupBasicTestScenario);
      
      // Build reputation for verifiers through multiple verifications
      const datasets = [1, 2, 3, 4, 5];
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("quality_data"));
      
      // user1 submits quality verifications for multiple datasets
      for (let i = 0; i < datasets.length; i++) {
        await verification.connect(user1).submitQualityVerification(
          datasets[i],
          85 + i, // Varying quality scores
          verificationHash
        );
      }
      
      // Check reputation built up
      expect(await verification.getVerifierReputation(user1.address)).to.equal(5);
      
      // Reward good verifier
      await verification.connect(deployer).rewardVerifier(user1.address, 10);
      expect(await verification.getVerifierReputation(user1.address)).to.equal(15);
      
      // user2 submits training verifications
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("model_data"));
      await verification.connect(user2).submitTrainingVerification(
        1,
        modelHash,
        "accuracy:0.95",
        ethers.keccak256(ethers.toUtf8Bytes("proof"))
      );
      
      await verification.connect(user2).submitTrainingVerification(
        2,
        modelHash,
        "accuracy:0.92",
        ethers.keccak256(ethers.toUtf8Bytes("proof2"))
      );
      
      expect(await verification.getVerifierReputation(user2.address)).to.equal(2);
      
      // user3 submits poor quality verification and gets penalized
      await verification.connect(user3).submitQualityVerification(3, 90, verificationHash);
      await verification.connect(deployer).rewardVerifier(user3.address, 5); // Initial reward
      
      expect(await verification.getVerifierReputation(user3.address)).to.equal(6);
      
      // Then penalize for poor verification
      await verification.connect(deployer).penalizeVerifier(user3.address, 3);
      expect(await verification.getVerifierReputation(user3.address)).to.equal(3);
      
      // Verify overall verification counts
      expect(await verification.totalQualityVerifications()).to.equal(6);
      expect(await verification.totalTrainingVerifications()).to.equal(2);
    });

    it("Should handle oracle verification workflow", async function () {
      const { 
        verification,
        usdfc,
        user1,
        user2,
        deployer 
      } = await loadFixture(setupBasicTestScenario);
      
      // Set verification fee
      const verificationFee = toUSDFC(15);
      await verification.connect(deployer).updateVerificationFee(verificationFee);
      
      // Multiple users request oracle verifications
      const queryData1 = ethers.toUtf8Bytes("model_accuracy_benchmark");
      const queryData2 = ethers.toUtf8Bytes("data_quality_assessment");
      
      // user1 requests verification
      await usdfc.connect(user1).approve(await verification.getAddress(), verificationFee);
      await verification.connect(user1).requestOracleVerification(1, queryData1);
      
      // user2 requests verification
      await usdfc.connect(user2).approve(await verification.getAddress(), verificationFee);
      await verification.connect(user2).requestOracleVerification(2, queryData2);
      
      // Check requests created
      const request1 = await verification.getOracleRequest(1);
      const request2 = await verification.getOracleRequest(2);
      
      expect(request1.requester).to.equal(user1.address);
      expect(request2.requester).to.equal(user2.address);
      expect(request1.isPaid).to.be.true;
      expect(request2.isPaid).to.be.true;
      
      // Oracle responds to requests
      const response1 = ethers.toUtf8Bytes("accuracy_verified:94.2%");
      const response2 = ethers.toUtf8Bytes("quality_score:87");
      
      await verification.connect(deployer).submitOracleResponse(1, response1);
      await verification.connect(deployer).submitOracleResponse(2, response2);
      
      // Verify responses
      const finalRequest1 = await verification.getOracleRequest(1);
      const finalRequest2 = await verification.getOracleRequest(2);
      
      expect(finalRequest1.isCompleted).to.be.true;
      expect(finalRequest2.isCompleted).to.be.true;
      expect(finalRequest1.response).to.equal(ethers.hexlify(response1));
      expect(finalRequest2.response).to.equal(ethers.hexlify(response2));
    });
  });

  describe("Platform Administration", function () {
    it("Should handle platform fee updates across all contracts", async function () {
      const { 
        marketplace,
        payments,
        verification,
        deployer 
      } = await loadFixture(deployVeriFlowContracts);
      
      // Update platform fee in payments contract
      const newPlatformFee = 750; // 7.5%
      await payments.connect(deployer).updatePlatformFee(newPlatformFee);
      expect(await payments.platformFeePercentage()).to.equal(newPlatformFee);
      
      // Update verification fee
      const newVerificationFee = toUSDFC(20);
      await verification.connect(deployer).updateVerificationFee(newVerificationFee);
      expect(await verification.verificationFee()).to.equal(newVerificationFee);
      
      // Update minimum stake in marketplace
      const newMinimumStake = toUSDFC(150);
      await marketplace.connect(deployer).updateMinimumStake(newMinimumStake);
      expect(await marketplace.minimumStake()).to.equal(newMinimumStake);
    });

    it("Should handle emergency scenarios", async function () {
      const { 
        marketplace,
        payments,
        verification,
        usdfc,
        dataProvider1,
        user1,
        deployer 
      } = await loadFixture(setupBasicTestScenario);
      
      // Setup normal operation
      const stakeAmount = toUSDFC(150);
      await usdfc.connect(dataProvider1).mint({ value: toFIL(0.15) });
      await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);
      
      const dataset = createSampleDataset();
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      // In case of emergency, admin can process refunds
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset.price);
      await marketplace.connect(user1).purchaseDataset(1);
      
      // Emergency refund
      await payments.connect(deployer).processRefund(1);
      
      // Verify refund processed
      const payment = await payments.getPayment(1);
      expect(payment.isCompleted).to.be.true; // Payment still marked as completed
      
      // In emergency, provider can be allowed to unstake even with active datasets
      // This would require emergency admin functions (if implemented)
      const providerInfo = await marketplace.providers(dataProvider1.address);
      expect(providerInfo.isActive).to.be.true;
      expect(providerInfo.totalDatasets).to.equal(1);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should handle batch operations efficiently", async function () {
      const { 
        marketplace,
        usdfc,
        verification,
        dataProvider1,
        user1 
      } = await loadFixture(setupBasicTestScenario);
      
      // Setup provider
      const stakeAmount = toUSDFC(300);
      await usdfc.connect(dataProvider1).mint({ value: toFIL(0.3) });
      await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);
      
      // List multiple datasets in sequence (simulating batch operations)
      const datasets = [
        createSampleDataset(1, "Dataset A"),
        createSampleDataset(1, "Dataset B"),
        createSampleDataset(1, "Dataset C")
      ];
      
      for (let i = 0; i < datasets.length; i++) {
        await marketplace.connect(dataProvider1).listDataset(
          datasets[i].name,
          datasets[i].description,
          datasets[i].category,
          datasets[i].size,
          datasets[i].format,
          datasets[i].price,
          datasets[i].qualityScore
        );
      }
      
      // Submit multiple verifications
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("batch_quality"));
      for (let i = 1; i <= datasets.length; i++) {
        await verification.connect(dataProvider1).submitQualityVerification(
          i,
          80 + i,
          verificationHash
        );
      }
      
      // Verify all operations completed
      expect(await marketplace.totalDatasets()).to.equal(3);
      expect(await verification.totalQualityVerifications()).to.equal(3);
      
      const providerInfo = await marketplace.providers(dataProvider1.address);
      expect(providerInfo.totalDatasets).to.equal(3);
    });
  });
}); 