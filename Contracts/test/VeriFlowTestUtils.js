const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

/**
 * Common test utilities for VeriFlow contracts
 */

/**
 * Converts FIL to wei (18 decimals)
 */
function toFIL(amount) {
  return ethers.parseEther(amount.toString());
}

/**
 * Converts USDFC to smallest unit (18 decimals)  
 */
function toUSDFC(amount) {
  return ethers.parseEther(amount.toString());
}

/**
 * Formats wei to ETH for readable output
 */
function fromWei(amount) {
  return ethers.formatEther(amount);
}

/**
 * Get current block timestamp
 */
async function getCurrentTime() {
  const block = await ethers.provider.getBlock('latest');
  return block.timestamp;
}

/**
 * Deploy all VeriFlow contracts with proper setup
 */
async function deployVeriFlowContracts() {
  // Get signers
  const [deployer, user1, user2, user3, dataProvider1, dataProvider2] = await ethers.getSigners();

  // Deploy USDFC first
  const USDFC = await ethers.getContractFactory("USDFC");
  const usdfc = await USDFC.deploy();
  await usdfc.waitForDeployment();

  // Deploy VerifiAIVerification
  const VerifiAIVerification = await ethers.getContractFactory("VerifiAIVerification");
  const verification = await VerifiAIVerification.deploy();
  await verification.waitForDeployment();

  // Deploy VerifiAIPayments
  const VerifiAIPayments = await ethers.getContractFactory("VerifiAIPayments");
  const payments = await VerifiAIPayments.deploy(await usdfc.getAddress());
  await payments.waitForDeployment();

  // Deploy VerifiAIMarketplace
  const VerifiAIMarketplace = await ethers.getContractFactory("VerifiAIMarketplace");
  const marketplace = await VerifiAIMarketplace.deploy(
    await usdfc.getAddress(),
    await verification.getAddress(),
    await payments.getAddress()
  );
  await marketplace.waitForDeployment();

  // Deploy VerifiAIMarketApiHelper (no constructor args)
  const VerifiAIMarketApiHelper = await ethers.getContractFactory("VerifiAIMarketApiHelper");
  const marketApiHelper = await VerifiAIMarketApiHelper.deploy();
  await marketApiHelper.waitForDeployment();

  return {
    usdfc,
    verification,
    payments,
    marketplace,
    marketApiHelper,
    deployer,
    user1,
    user2,
    user3,
    dataProvider1,
    dataProvider2,
    accounts: [deployer, user1, user2, user3, dataProvider1, dataProvider2]
  };
}

/**
 * Setup basic test scenario with funded users
 */
async function setupBasicTestScenario() {
  const contracts = await deployVeriFlowContracts();
  const { usdfc, marketplace, user1, user2, dataProvider1 } = contracts;

  // Fund users with FIL for minting USDFC
  const fundAmount = toFIL(10); // 10 FIL each

  // Mint USDFC for users (using the correct exchange rate: 1000 USDFC per FIL)
  await usdfc.connect(user1).mint({ value: toFIL(1) }); // Should get 1000 USDFC
  await usdfc.connect(user2).mint({ value: toFIL(1) }); // Should get 1000 USDFC
  await usdfc.connect(dataProvider1).mint({ value: toFIL(2) }); // Should get 2000 USDFC

  return contracts;
}

/**
 * Setup test scenario with staked providers
 */
async function setupStakedProvidersScenario() {
  const contracts = await setupBasicTestScenario();
  const { usdfc, marketplace, dataProvider1, dataProvider2 } = contracts;

  // Approve and stake for providers
  const stakeAmount = toUSDFC(100); // 100 USDFC minimum stake

  // Provider 1: mint more USDFC and stake
  await usdfc.connect(dataProvider1).mint({ value: toFIL(0.1) }); // Get 100 more USDFC
  await usdfc.connect(dataProvider1).approve(await marketplace.getAddress(), stakeAmount);
  await marketplace.connect(dataProvider1).stakeAsProvider(stakeAmount);

  // Provider 2: mint USDFC and stake
  await usdfc.connect(dataProvider2).mint({ value: toFIL(0.2) }); // Get 200 USDFC
  await usdfc.connect(dataProvider2).approve(await marketplace.getAddress(), stakeAmount);
  await marketplace.connect(dataProvider2).stakeAsProvider(stakeAmount);

  return contracts;
}

/**
 * Create sample dataset metadata
 */
function createSampleDataset(providerId = 1, name = "Sample Dataset") {
  return {
    name: name,
    description: `Description for ${name}`,
    category: "machine-learning",
    size: 1000000, // 1MB
    format: "json",
    price: toUSDFC(50), // 50 USDFC
    qualityScore: 85,
    tags: ["test", "sample", "ml"]
  };
}

/**
 * Assert that an event was emitted with correct parameters
 */
async function expectEvent(tx, contract, eventName, expectedArgs = []) {
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed && parsed.name === eventName;
    } catch (e) {
      return false;
    }
  });
  
  expect(event).to.not.be.undefined;
  
  if (expectedArgs.length > 0) {
    const parsed = contract.interface.parseLog(event);
    expectedArgs.forEach((expectedArg, index) => {
      if (expectedArg !== null && expectedArg !== undefined) {
        expect(parsed.args[index]).to.equal(expectedArg);
      }
    });
  }
  
  return event;
}

/**
 * Assert balance changes for multiple accounts
 */
async function expectBalanceChanges(tx, token, accounts, expectedChanges) {
  const balancesBefore = await Promise.all(
    accounts.map(account => token.balanceOf(account.address))
  );
  
  await tx.wait();
  
  const balancesAfter = await Promise.all(
    accounts.map(account => token.balanceOf(account.address))
  );
  
  expectedChanges.forEach((expectedChange, index) => {
    const actualChange = balancesAfter[index] - balancesBefore[index];
    expect(actualChange).to.equal(expectedChange);
  });
}

module.exports = {
  toFIL,
  toUSDFC,
  fromWei,
  getCurrentTime,
  deployVeriFlowContracts,
  setupBasicTestScenario,
  setupStakedProvidersScenario,
  createSampleDataset,
  expectEvent,
  expectBalanceChanges
}; 