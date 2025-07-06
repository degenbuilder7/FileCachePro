const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { 
  toFIL, 
  toUSDFC, 
  deployVeriFlowContracts, 
  setupBasicTestScenario,
  expectEvent 
} = require("./VeriFlowTestUtils");

describe("VerifiAI Payments Contract", function () {

  describe("Deployment", function () {
    it("Should deploy with correct USDFC token address", async function () {
      const { payments, usdfc } = await loadFixture(deployVeriFlowContracts);
      
      expect(await payments.usdcToken()).to.equal(await usdfc.getAddress());
    });

    it("Should set correct owner", async function () {
      const { payments, deployer } = await loadFixture(deployVeriFlowContracts);
      
      expect(await payments.owner()).to.equal(deployer.address);
    });

    it("Should set correct platform fee (default 5%)", async function () {
      const { payments } = await loadFixture(deployVeriFlowContracts);
      
      expect(await payments.platformFeePercentage()).to.equal(500); // 5% = 500 basis points
    });
  });

  describe("Payment Processing", function () {
    it("Should process dataset payments correctly", async function () {
      const { payments, usdfc, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      const datasetId = 1;
      
      // Approve payment contract to spend user1's USDFC
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      
      // Process payment
      await expect(payments.connect(user1).processPayment(user2.address, paymentAmount, datasetId))
        .to.emit(payments, "PaymentProcessed")
        .withArgs(user1.address, user2.address, paymentAmount, datasetId);
      
      // Check payment record
      const payment = await payments.getPayment(1);
      expect(payment.buyer).to.equal(user1.address);
      expect(payment.seller).to.equal(user2.address);
      expect(payment.amount).to.equal(paymentAmount);
      expect(payment.datasetId).to.equal(datasetId);
      expect(payment.isCompleted).to.be.true;
    });

    it("Should calculate and distribute platform fees correctly", async function () {
      const { payments, usdfc, user1, user2, deployer } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      const expectedPlatformFee = toUSDFC(5); // 5% of 100
      const expectedSellerAmount = toUSDFC(95); // 95% of 100
      const datasetId = 1;
      
      const initialSellerBalance = await usdfc.balanceOf(user2.address);
      const initialPlatformBalance = await usdfc.balanceOf(deployer.address);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, datasetId);
      
      const finalSellerBalance = await usdfc.balanceOf(user2.address);
      const finalPlatformBalance = await usdfc.balanceOf(deployer.address);
      
      expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerAmount);
      expect(finalPlatformBalance - initialPlatformBalance).to.equal(expectedPlatformFee);
    });

    it("Should reject payments with insufficient balance", async function () {
      const { payments, usdfc, user3, user1 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      // user3 has no USDFC balance
      await expect(payments.connect(user3).processPayment(user1.address, paymentAmount, 1))
        .to.be.revertedWithCustomError(usdfc, "ERC20InsufficientBalance");
    });

    it("Should reject payments without approval", async function () {
      const { payments, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      // Don't approve - payment should fail
      await expect(payments.connect(user1).processPayment(user2.address, paymentAmount, 1))
        .to.be.revertedWithCustomError(payments, "ERC20InsufficientAllowance");
    });

    it("Should reject zero amount payments", async function () {
      const { payments, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      await expect(payments.connect(user1).processPayment(user2.address, 0, 1))
        .to.be.revertedWith("Payment amount must be greater than 0");
    });

    it("Should reject payments to zero address", async function () {
      const { payments, user1 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      await expect(payments.connect(user1).processPayment(ethers.ZeroAddress, paymentAmount, 1))
        .to.be.revertedWith("Invalid seller address");
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const { payments, deployer } = await loadFixture(deployVeriFlowContracts);
      
      const newFeePercentage = 750; // 7.5%
      
      await expect(payments.connect(deployer).updatePlatformFee(newFeePercentage))
        .to.emit(payments, "PlatformFeeUpdated")
        .withArgs(newFeePercentage);
      
      expect(await payments.platformFeePercentage()).to.equal(newFeePercentage);
    });

    it("Should reject platform fee updates from non-owner", async function () {
      const { payments, user1 } = await loadFixture(deployVeriFlowContracts);
      
      await expect(payments.connect(user1).updatePlatformFee(750))
        .to.be.revertedWithCustomError(payments, "OwnableUnauthorizedAccount");
    });

    it("Should reject invalid platform fee percentages", async function () {
      const { payments, deployer } = await loadFixture(deployVeriFlowContracts);
      
      // Test fee > 20% (2000 basis points)
      await expect(payments.connect(deployer).updatePlatformFee(2500))
        .to.be.revertedWith("Platform fee cannot exceed 20%");
    });

    it("Should calculate fees correctly with different percentages", async function () {
      const { payments, usdfc, user1, user2, deployer } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(1000);
      
      // Test with 10% fee
      await payments.connect(deployer).updatePlatformFee(1000); // 10%
      
      const initialSellerBalance = await usdfc.balanceOf(user2.address);
      const initialPlatformBalance = await usdfc.balanceOf(deployer.address);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, 1);
      
      const finalSellerBalance = await usdfc.balanceOf(user2.address);
      const finalPlatformBalance = await usdfc.balanceOf(deployer.address);
      
      const expectedPlatformFee = toUSDFC(100); // 10% of 1000
      const expectedSellerAmount = toUSDFC(900); // 90% of 1000
      
      expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerAmount);
      expect(finalPlatformBalance - initialPlatformBalance).to.equal(expectedPlatformFee);
    });
  });

  describe("Payment History and Queries", function () {
    it("Should track payment count correctly", async function () {
      const { payments, usdfc, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      expect(await payments.paymentCount()).to.equal(0);
      
      const paymentAmount = toUSDFC(50);
      
      // First payment
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, 1);
      
      expect(await payments.paymentCount()).to.equal(1);
      
      // Second payment
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, 2);
      
      expect(await payments.paymentCount()).to.equal(2);
    });

    it("Should return correct buyer payments", async function () {
      const { payments, usdfc, user1, user2, user3 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(50);
      
      // user1 makes payments to different sellers
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, 1);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user3.address, paymentAmount, 2);
      
      const buyerPayments = await payments.getBuyerPayments(user1.address);
      expect(buyerPayments.length).to.equal(2);
      expect(buyerPayments[0]).to.equal(1);
      expect(buyerPayments[1]).to.equal(2);
    });

    it("Should return correct seller payments", async function () {
      const { payments, usdfc, user1, user2, user3 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(50);
      
      // Different buyers make payments to user2
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, 1);
      
      await usdfc.connect(user3).mint({ value: toFIL(1) }); // Give user3 some USDFC
      await usdfc.connect(user3).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user3).processPayment(user2.address, paymentAmount, 2);
      
      const sellerPayments = await payments.getSellerPayments(user2.address);
      expect(sellerPayments.length).to.equal(2);
      expect(sellerPayments[0]).to.equal(1);
      expect(sellerPayments[1]).to.equal(2);
    });
  });

  describe("Escrow Functionality", function () {
    it("Should handle escrowed payments", async function () {
      const { payments, usdfc, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      const datasetId = 1;
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      
      // Create escrowed payment
      await expect(payments.connect(user1).createEscrowPayment(user2.address, paymentAmount, datasetId))
        .to.emit(payments, "EscrowCreated")
        .withArgs(1, user1.address, user2.address, paymentAmount, datasetId);
      
      const escrow = await payments.getEscrow(1);
      expect(escrow.buyer).to.equal(user1.address);
      expect(escrow.seller).to.equal(user2.address);
      expect(escrow.amount).to.equal(paymentAmount);
      expect(escrow.isCompleted).to.be.false;
    });

    it("Should allow escrow release by buyer", async function () {
      const { payments, usdfc, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).createEscrowPayment(user2.address, paymentAmount, 1);
      
      const initialSellerBalance = await usdfc.balanceOf(user2.address);
      
      await expect(payments.connect(user1).releaseEscrow(1))
        .to.emit(payments, "EscrowReleased")
        .withArgs(1);
      
      const finalSellerBalance = await usdfc.balanceOf(user2.address);
      const expectedSellerAmount = toUSDFC(95); // After 5% fee
      
      expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerAmount);
      
      const escrow = await payments.getEscrow(1);
      expect(escrow.isCompleted).to.be.true;
    });

    it("Should reject escrow release by non-buyer", async function () {
      const { payments, usdfc, user1, user2, user3 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).createEscrowPayment(user2.address, paymentAmount, 1);
      
      await expect(payments.connect(user3).releaseEscrow(1))
        .to.be.revertedWith("Only buyer can release escrow");
    });

    it("Should reject double escrow release", async function () {
      const { payments, usdfc, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).createEscrowPayment(user2.address, paymentAmount, 1);
      
      // First release
      await payments.connect(user1).releaseEscrow(1);
      
      // Second release should fail
      await expect(payments.connect(user1).releaseEscrow(1))
        .to.be.revertedWith("Escrow already completed");
    });
  });

  describe("Refund Functionality", function () {
    it("Should allow owner to process refunds", async function () {
      const { payments, usdfc, user1, user2, deployer } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, 1);
      
      // Owner can process refund
      const initialBuyerBalance = await usdfc.balanceOf(user1.address);
      
      await expect(payments.connect(deployer).processRefund(1))
        .to.emit(payments, "RefundProcessed")
        .withArgs(1, user1.address, paymentAmount);
      
      const finalBuyerBalance = await usdfc.balanceOf(user1.address);
      expect(finalBuyerBalance - initialBuyerBalance).to.equal(paymentAmount);
    });

    it("Should reject refund processing by non-owner", async function () {
      const { payments, usdfc, user1, user2 } = await loadFixture(setupBasicTestScenario);
      
      const paymentAmount = toUSDFC(100);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), paymentAmount);
      await payments.connect(user1).processPayment(user2.address, paymentAmount, 1);
      
      await expect(payments.connect(user1).processRefund(1))
        .to.be.revertedWithCustomError(payments, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complex payment scenario", async function () {
      const { payments, usdfc, user1, user2, user3, deployer } = await loadFixture(setupBasicTestScenario);
      
      // 1. Process multiple payments with different amounts
      const payment1Amount = toUSDFC(100);
      const payment2Amount = toUSDFC(250);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), payment1Amount);
      await payments.connect(user1).processPayment(user2.address, payment1Amount, 1);
      
      await usdfc.connect(user1).approve(await payments.getAddress(), payment2Amount);
      await payments.connect(user1).processPayment(user3.address, payment2Amount, 2);
      
      // 2. Create and release escrow
      const escrowAmount = toUSDFC(150);
      await usdfc.connect(user2).approve(await payments.getAddress(), escrowAmount);
      await payments.connect(user2).createEscrowPayment(user3.address, escrowAmount, 3);
      await payments.connect(user2).releaseEscrow(1);
      
      // 3. Update platform fee and process another payment
      await payments.connect(deployer).updatePlatformFee(1000); // 10%
      const payment3Amount = toUSDFC(200);
      await usdfc.connect(user2).approve(await payments.getAddress(), payment3Amount);
      await payments.connect(user2).processPayment(user1.address, payment3Amount, 4);
      
      // 4. Verify final state
      expect(await payments.paymentCount()).to.equal(4); // 3 regular payments + 1 escrow completion
      expect(await payments.escrowCount()).to.equal(1);
      
      // Check payment history
      const user1BuyerPayments = await payments.getBuyerPayments(user1.address);
      expect(user1BuyerPayments.length).to.equal(2);
      
      const user2SellerPayments = await payments.getSellerPayments(user2.address);
      expect(user2SellerPayments.length).to.equal(1);
    });
  });
}); 