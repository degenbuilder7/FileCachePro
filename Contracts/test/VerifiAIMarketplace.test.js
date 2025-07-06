const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { 
  toFIL, 
  toUSDFC, 
  fromWei, 
  deployVeriFlowContracts, 
  setupBasicTestScenario,
  setupStakedProvidersScenario,
  createSampleDataset,
  expectEvent 
} = require("./VeriFlowTestUtils");

describe("VerifiAI Marketplace Contract", function () {

  describe("Deployment", function () {
    it("Should deploy with correct addresses", async function () {
      const { marketplace, usdfc, verification, payments } = await loadFixture(deployVeriFlowContracts);
      
      expect(await marketplace.usdcToken()).to.equal(await usdfc.getAddress());
      expect(await marketplace.verificationContract()).to.equal(await verification.getAddress());
      expect(await marketplace.paymentsContract()).to.equal(await payments.getAddress());
    });

    it("Should set correct minimum stake amount", async function () {
      const { marketplace } = await loadFixture(deployVeriFlowContracts);
      
      expect(await marketplace.minimumStake()).to.equal(toUSDFC(100));
    });

    it("Should set correct owner", async function () {
      const { marketplace, deployer } = await loadFixture(deployVeriFlowContracts);
      
      expect(await marketplace.owner()).to.equal(deployer.address);
    });
  });

  describe("Provider Staking", function () {
    it("Should allow users to stake and become providers", async function () {
      const { marketplace, usdfc, user1 } = await loadFixture(setupBasicTestScenario);
      
      const stakeAmount = toUSDFC(100);
      
      // Approve marketplace to spend USDFC
      await usdfc.connect(user1).approve(await marketplace.getAddress(), stakeAmount);
      
      // Stake to become provider
      await expect(marketplace.connect(user1).stakeAsProvider(stakeAmount))
        .to.emit(marketplace, "ProviderStaked")
        .withArgs(user1.address, stakeAmount);
      
      // Check provider status
      const providerInfo = await marketplace.providers(user1.address);
      expect(providerInfo.isActive).to.be.true;
      expect(providerInfo.stake).to.equal(stakeAmount);
      expect(providerInfo.totalDatasets).to.equal(0);
    });

    it("Should reject staking with insufficient amount", async function () {
      const { marketplace, usdfc, user1 } = await loadFixture(setupBasicTestScenario);
      
      const stakeAmount = toUSDFC(50); // Less than minimum
      
      await usdfc.connect(user1).approve(await marketplace.getAddress(), stakeAmount);
      
      await expect(marketplace.connect(user1).stakeAsProvider(stakeAmount))
        .to.be.revertedWith("Stake amount must be at least minimum stake");
    });

    it("Should reject staking without sufficient USDFC balance", async function () {
      const { marketplace, usdfc, user3 } = await loadFixture(setupBasicTestScenario);
      
      const stakeAmount = toUSDFC(100);
      
      // user3 doesn't have any USDFC
      await usdfc.connect(user3).approve(await marketplace.getAddress(), stakeAmount);
      
      await expect(marketplace.connect(user3).stakeAsProvider(stakeAmount))
        .to.be.revertedWithCustomError(usdfc, "ERC20InsufficientBalance");
    });

    it("Should reject staking without approval", async function () {
      const { marketplace, user1 } = await loadFixture(setupBasicTestScenario);
      
      const stakeAmount = toUSDFC(100);
      
      // Don't approve - direct stake should fail
      await expect(marketplace.connect(user1).stakeAsProvider(stakeAmount))
        .to.be.revertedWithCustomError(marketplace, "ERC20InsufficientAllowance");
    });

    it("Should allow providers to increase stake", async function () {
      const { marketplace, usdfc, user1 } = await loadFixture(setupBasicTestScenario);
      
      const initialStake = toUSDFC(100);
      const additionalStake = toUSDFC(50);
      
      // Initial stake
      await usdfc.connect(user1).approve(await marketplace.getAddress(), initialStake);
      await marketplace.connect(user1).stakeAsProvider(initialStake);
      
      // Additional stake
      await usdfc.connect(user1).approve(await marketplace.getAddress(), additionalStake);
      await marketplace.connect(user1).stakeAsProvider(additionalStake);
      
      const providerInfo = await marketplace.providers(user1.address);
      expect(providerInfo.stake).to.equal(initialStake + additionalStake);
    });

    it("Should allow providers to unstake", async function () {
      const { marketplace, usdfc, user1 } = await loadFixture(setupBasicTestScenario);
      
      const stakeAmount = toUSDFC(200);
      const unstakeAmount = toUSDFC(50);
      
      // Stake first
      await usdfc.connect(user1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(user1).stakeAsProvider(stakeAmount);
      
      // Unstake partial amount
      await expect(marketplace.connect(user1).unstake(unstakeAmount))
        .to.emit(marketplace, "ProviderUnstaked")
        .withArgs(user1.address, unstakeAmount);
      
      const providerInfo = await marketplace.providers(user1.address);
      expect(providerInfo.stake).to.equal(stakeAmount - unstakeAmount);
    });

    it("Should not allow unstaking below minimum", async function () {
      const { marketplace, usdfc, user1 } = await loadFixture(setupBasicTestScenario);
      
      const stakeAmount = toUSDFC(100);
      const unstakeAmount = toUSDFC(50);
      
      await usdfc.connect(user1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(user1).stakeAsProvider(stakeAmount);
      
      await expect(marketplace.connect(user1).unstake(unstakeAmount))
        .to.be.revertedWith("Remaining stake would be below minimum");
    });

    it("Should deactivate provider when fully unstaking", async function () {
      const { marketplace, usdfc, user1 } = await loadFixture(setupBasicTestScenario);
      
      const stakeAmount = toUSDFC(100);
      
      await usdfc.connect(user1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(user1).stakeAsProvider(stakeAmount);
      
      // Fully unstake
      await marketplace.connect(user1).unstake(stakeAmount);
      
      const providerInfo = await marketplace.providers(user1.address);
      expect(providerInfo.isActive).to.be.false;
      expect(providerInfo.stake).to.equal(0);
    });
  });

  describe("Dataset Management", function () {
    it("Should allow providers to list datasets", async function () {
      const { marketplace, dataProvider1 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      await expect(marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      )).to.emit(marketplace, "DatasetListed");
      
      // Check dataset was added
      const providerInfo = await marketplace.providers(dataProvider1.address);
      expect(providerInfo.totalDatasets).to.equal(1);
      
      // Check dataset details
      const datasetInfo = await marketplace.getDataset(1);
      expect(datasetInfo.name).to.equal(dataset.name);
      expect(datasetInfo.provider).to.equal(dataProvider1.address);
      expect(datasetInfo.price).to.equal(dataset.price);
      expect(datasetInfo.isActive).to.be.true;
    });

    it("Should reject dataset listing from non-providers", async function () {
      const { marketplace, user1 } = await loadFixture(setupBasicTestScenario);
      
      const dataset = createSampleDataset();
      
      await expect(marketplace.connect(user1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      )).to.be.revertedWith("Only active providers can list datasets");
    });

    it("Should validate dataset parameters", async function () {
      const { marketplace, dataProvider1 } = await loadFixture(setupStakedProvidersScenario);
      
      // Test empty name
      await expect(marketplace.connect(dataProvider1).listDataset(
        "",
        "Description",
        "category",
        1000,
        "format",
        toUSDFC(10),
        80
      )).to.be.revertedWith("Dataset name cannot be empty");
      
      // Test zero price
      await expect(marketplace.connect(dataProvider1).listDataset(
        "Name",
        "Description",
        "category",
        1000,
        "format",
        0,
        80
      )).to.be.revertedWith("Price must be greater than 0");
      
      // Test invalid quality score
      await expect(marketplace.connect(dataProvider1).listDataset(
        "Name",
        "Description",
        "category",
        1000,
        "format",
        toUSDFC(10),
        150 // > 100
      )).to.be.revertedWith("Quality score must be between 0 and 100");
    });

    it("Should allow providers to update dataset pricing", async function () {
      const { marketplace, dataProvider1 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      // List dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      const newPrice = toUSDFC(75);
      
      await expect(marketplace.connect(dataProvider1).updateDatasetPrice(1, newPrice))
        .to.emit(marketplace, "DatasetPriceUpdated")
        .withArgs(1, newPrice);
      
      const datasetInfo = await marketplace.getDataset(1);
      expect(datasetInfo.price).to.equal(newPrice);
    });

    it("Should allow providers to deactivate datasets", async function () {
      const { marketplace, dataProvider1 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      // List dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      await expect(marketplace.connect(dataProvider1).deactivateDataset(1))
        .to.emit(marketplace, "DatasetDeactivated")
        .withArgs(1);
      
      const datasetInfo = await marketplace.getDataset(1);
      expect(datasetInfo.isActive).to.be.false;
    });

    it("Should reject dataset operations from non-owners", async function () {
      const { marketplace, dataProvider1, dataProvider2 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      // dataProvider1 lists dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      // dataProvider2 tries to update price
      await expect(marketplace.connect(dataProvider2).updateDatasetPrice(1, toUSDFC(100)))
        .to.be.revertedWith("Only dataset owner can update");
      
      // dataProvider2 tries to deactivate
      await expect(marketplace.connect(dataProvider2).deactivateDataset(1))
        .to.be.revertedWith("Only dataset owner can deactivate");
    });
  });

  describe("Dataset Purchase", function () {
    it("Should allow users to purchase datasets", async function () {
      const { marketplace, usdfc, dataProvider1, user1 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      // List dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      // Approve payment
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset.price);
      
      // Purchase dataset
      await expect(marketplace.connect(user1).purchaseDataset(1))
        .to.emit(marketplace, "DatasetPurchased")
        .withArgs(1, user1.address, dataset.price);
      
      // Check purchase record
      expect(await marketplace.hasPurchased(user1.address, 1)).to.be.true;
    });

    it("Should reject purchase of inactive datasets", async function () {
      const { marketplace, usdfc, dataProvider1, user1 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      // List and deactivate dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      await marketplace.connect(dataProvider1).deactivateDataset(1);
      
      // Try to purchase
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset.price);
      
      await expect(marketplace.connect(user1).purchaseDataset(1))
        .to.be.revertedWith("Dataset is not active");
    });

    it("Should reject duplicate purchases", async function () {
      const { marketplace, usdfc, dataProvider1, user1 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      // List dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      // First purchase
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset.price);
      await marketplace.connect(user1).purchaseDataset(1);
      
      // Try to purchase again
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset.price);
      
      await expect(marketplace.connect(user1).purchaseDataset(1))
        .to.be.revertedWith("Dataset already purchased");
    });

    it("Should reject purchase with insufficient balance", async function () {
      const { marketplace, usdfc, dataProvider1, user3 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset = createSampleDataset();
      
      // List dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset.name,
        dataset.description,
        dataset.category,
        dataset.size,
        dataset.format,
        dataset.price,
        dataset.qualityScore
      );
      
      // user3 has no USDFC balance
      await expect(marketplace.connect(user3).purchaseDataset(1))
        .to.be.revertedWithCustomError(usdfc, "ERC20InsufficientBalance");
    });
  });

  describe("Marketplace Statistics", function () {
    it("Should track total datasets correctly", async function () {
      const { marketplace, dataProvider1, dataProvider2 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset1 = createSampleDataset(1, "Dataset 1");
      const dataset2 = createSampleDataset(2, "Dataset 2");
      
      expect(await marketplace.totalDatasets()).to.equal(0);
      
      // List first dataset
      await marketplace.connect(dataProvider1).listDataset(
        dataset1.name,
        dataset1.description,
        dataset1.category,
        dataset1.size,
        dataset1.format,
        dataset1.price,
        dataset1.qualityScore
      );
      
      expect(await marketplace.totalDatasets()).to.equal(1);
      
      // List second dataset
      await marketplace.connect(dataProvider2).listDataset(
        dataset2.name,
        dataset2.description,
        dataset2.category,
        dataset2.size,
        dataset2.format,
        dataset2.price,
        dataset2.qualityScore
      );
      
      expect(await marketplace.totalDatasets()).to.equal(2);
    });

    it("Should return correct dataset lists for providers", async function () {
      const { marketplace, dataProvider1 } = await loadFixture(setupStakedProvidersScenario);
      
      const dataset1 = createSampleDataset(1, "Dataset 1");
      const dataset2 = createSampleDataset(1, "Dataset 2");
      
      // List datasets
      await marketplace.connect(dataProvider1).listDataset(
        dataset1.name,
        dataset1.description,
        dataset1.category,
        dataset1.size,
        dataset1.format,
        dataset1.price,
        dataset1.qualityScore
      );
      
      await marketplace.connect(dataProvider1).listDataset(
        dataset2.name,
        dataset2.description,
        dataset2.category,
        dataset2.size,
        dataset2.format,
        dataset2.price,
        dataset2.qualityScore
      );
      
      const providerDatasets = await marketplace.getProviderDatasets(dataProvider1.address);
      expect(providerDatasets.length).to.equal(2);
      expect(providerDatasets[0]).to.equal(1);
      expect(providerDatasets[1]).to.equal(2);
    });
  });

  describe("Access Control and Security", function () {
    it("Should only allow owner to update minimum stake", async function () {
      const { marketplace, deployer, user1 } = await loadFixture(deployVeriFlowContracts);
      
      const newMinimumStake = toUSDFC(200);
      
      // Owner can update
      await marketplace.connect(deployer).updateMinimumStake(newMinimumStake);
      expect(await marketplace.minimumStake()).to.equal(newMinimumStake);
      
      // Non-owner cannot update
      await expect(marketplace.connect(user1).updateMinimumStake(toUSDFC(300)))
        .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("Should handle emergency pause functionality", async function () {
      const { marketplace, deployer, dataProvider1 } = await loadFixture(setupStakedProvidersScenario);
      
      // Pause contract (if pause functionality exists)
      if (typeof marketplace.pause === 'function') {
        await marketplace.connect(deployer).pause();
        
        // Operations should be paused
        const dataset = createSampleDataset();
        await expect(marketplace.connect(dataProvider1).listDataset(
          dataset.name,
          dataset.description,
          dataset.category,
          dataset.size,
          dataset.format,
          dataset.price,
          dataset.qualityScore
        )).to.be.revertedWith("Pausable: paused");
      }
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete marketplace flow", async function () {
      const { marketplace, usdfc, dataProvider1, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      // 1. dataProvider1 stakes to become provider
      const stakeAmount = toUSDFC(150);
      await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
      await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);
      
      // 2. dataProvider1 lists multiple datasets
      const dataset1 = createSampleDataset(1, "Premium ML Dataset");
      const dataset2 = createSampleDataset(1, "Basic Analytics Data");
      
      await marketplace.connect(dataProvider1).listDataset(
        dataset1.name,
        dataset1.description,
        dataset1.category,
        dataset1.size,
        dataset1.format,
        dataset1.price,
        dataset1.qualityScore
      );
      
      await marketplace.connect(dataProvider1).listDataset(
        dataset2.name,
        dataset2.description,
        dataset2.category,
        dataset2.size,
        dataset2.format,
        toUSDFC(25), // Different price
        75 // Different quality score
      );
      
      // 3. user1 purchases first dataset
      await usdfc.connect(user1).approve(await marketplace.getAddress(), dataset1.price);
      await marketplace.connect(user1).purchaseDataset(1);
      
      // 4. user2 purchases second dataset
      await usdfc.connect(user2).approve(await marketplace.getAddress(), toUSDFC(25));
      await marketplace.connect(user2).purchaseDataset(2);
      
      // 5. dataProvider1 updates pricing
      await marketplace.connect(dataProvider1).updateDatasetPrice(1, toUSDFC(60));
      
      // 6. Verify final state
      expect(await marketplace.totalDatasets()).to.equal(2);
      expect(await marketplace.hasPurchased(user1.address, 1)).to.be.true;
      expect(await marketplace.hasPurchased(user2.address, 2)).to.be.true;
      
      const providerInfo = await marketplace.providers(dataProvider1.address);
      expect(providerInfo.totalDatasets).to.equal(2);
      expect(providerInfo.isActive).to.be.true;
    });
  });
}); 