const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { toFIL, toUSDFC, fromWei } = require("./VeriFlowTestUtils");

describe("USDFC Token Contract", function () {

  async function deployUSDFCFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    const USDFC = await ethers.getContractFactory("USDFC");
    const usdfc = await USDFC.deploy();
    await usdfc.waitForDeployment();

    return { usdfc, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      const { usdfc } = await loadFixture(deployUSDFCFixture);
      
      expect(await usdfc.name()).to.equal("USD Filecoin");
      expect(await usdfc.symbol()).to.equal("USDFC");
    });

    it("Should set the correct decimals", async function () {
      const { usdfc } = await loadFixture(deployUSDFCFixture);
      
      expect(await usdfc.decimals()).to.equal(18);
    });

    it("Should set the correct owner", async function () {
      const { usdfc, owner } = await loadFixture(deployUSDFCFixture);
      
      expect(await usdfc.owner()).to.equal(owner.address);
    });

    it("Should have initial total supply of 100,000 USDFC", async function () {
      const { usdfc } = await loadFixture(deployUSDFCFixture);
      
      expect(await usdfc.totalSupply()).to.equal(toUSDFC(100000)); // 100,000 USDFC initial supply
    });
  });

  describe("Minting Functionality", function () {
    it("Should mint correct amount of USDFC for FIL sent (1000 USDFC per FIL)", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(1); // 1 FIL
      const expectedUSDFC = toUSDFC(1000); // Should get 1000 USDFC
      
      await expect(usdfc.connect(user1).mintWithCollateral({ value: filAmount }))
        .to.changeTokenBalance(usdfc, user1, expectedUSDFC);
    });

    it("Should mint correct amount for 0.1 FIL (100 USDFC)", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(0.1); // 0.1 FIL
      const expectedUSDFC = toUSDFC(100); // Should get 100 USDFC
      
      await expect(usdfc.connect(user1).mintWithCollateral({ value: filAmount }))
        .to.changeTokenBalance(usdfc, user1, expectedUSDFC);
    });

    it("Should mint correct amount for fractional FIL amounts", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(0.5); // 0.5 FIL
      const expectedUSDFC = toUSDFC(500); // Should get 500 USDFC
      
      await expect(usdfc.connect(user1).mintWithCollateral({ value: filAmount }))
        .to.changeTokenBalance(usdfc, user1, expectedUSDFC);
    });

    it("Should emit Mint event with correct parameters", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(1);
      const expectedUSDFC = toUSDFC(1000);
      
      await expect(usdfc.connect(user1).mintWithCollateral({ value: filAmount }))
        .to.emit(usdfc, "Mint")
        .withArgs(user1.address, expectedUSDFC, filAmount);
    });

    it("Should increase total supply when minting", async function () {
      const { usdfc, user1, user2 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount1 = toFIL(1);
      const filAmount2 = toFIL(2);
      const initialSupply = await usdfc.totalSupply();
      const expectedIncrease = toUSDFC(3000); // 1000 + 2000
      
      await usdfc.connect(user1).mintWithCollateral({ value: filAmount1 });
      await usdfc.connect(user2).mintWithCollateral({ value: filAmount2 });
      
      expect(await usdfc.totalSupply()).to.equal(initialSupply + expectedIncrease);
    });

    it("Should allow multiple mints from same user", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(0.5); // 0.5 FIL each time
      const expectedUSDFCPerMint = toUSDFC(500);
      
      await usdfc.connect(user1).mintWithCollateral({ value: filAmount });
      await usdfc.connect(user1).mintWithCollateral({ value: filAmount });
      
      expect(await usdfc.balanceOf(user1.address)).to.equal(expectedUSDFCPerMint * 2n);
    });

    it("Should reject minting with zero FIL", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      await expect(usdfc.connect(user1).mintWithCollateral({ value: 0 }))
        .to.be.revertedWith("Must send FIL as collateral");
    });

    it("Should handle very small FIL amounts correctly", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      // 0.001 FIL should give 1 USDFC
      const filAmount = toFIL(0.001);
      const expectedUSDFC = toUSDFC(1);
      
      await expect(usdfc.connect(user1).mintWithCollateral({ value: filAmount }))
        .to.changeTokenBalance(usdfc, user1, expectedUSDFC);
    });

    it("Should work with receive function for direct FIL transfers", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(1);
      const expectedUSDFC = toUSDFC(1000);
      
      // Send FIL directly to contract (triggers receive function)
      await expect(user1.sendTransaction({ to: await usdfc.getAddress(), value: filAmount }))
        .to.changeTokenBalance(usdfc, user1, expectedUSDFC);
    });
  });

  describe("Redeem Functionality", function () {
    it("Should allow users to redeem USDFC for FIL", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      // First mint some tokens
      const filAmount = toFIL(1);
      await usdfc.connect(user1).mintWithCollateral({ value: filAmount });
      
      // Redeem half the USDFC
      const redeemAmount = toUSDFC(500);
      const expectedFIL = toFIL(0.5);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(usdfc.connect(user1).redeem(redeemAmount))
        .to.emit(usdfc, "Redeem")
        .withArgs(user1.address, redeemAmount, expectedFIL);
      
      // Check USDFC balance decreased
      expect(await usdfc.balanceOf(user1.address)).to.equal(toUSDFC(500));
    });

    it("Should reject redemption with insufficient USDFC balance", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const redeemAmount = toUSDFC(1000);
      
      await expect(usdfc.connect(user1).redeem(redeemAmount))
        .to.be.revertedWith("Insufficient USDFC balance");
    });

    it("Should reject redemption with insufficient collateral", async function () {
      const { usdfc, user1, owner } = await loadFixture(deployUSDFCFixture);
      
      // Owner mints USDFC directly to user (without collateral)
      await usdfc.connect(owner).mint(user1.address, toUSDFC(1000));
      
      const redeemAmount = toUSDFC(500);
      
      await expect(usdfc.connect(user1).redeem(redeemAmount))
        .to.be.revertedWith("Insufficient collateral");
    });
  });

  describe("Owner Mint Functionality", function () {
    it("Should allow owner to mint tokens directly", async function () {
      const { usdfc, owner, user1 } = await loadFixture(deployUSDFCFixture);
      
      const mintAmount = toUSDFC(1000);
      
      await expect(usdfc.connect(owner).mint(user1.address, mintAmount))
        .to.changeTokenBalance(usdfc, user1, mintAmount);
    });

    it("Should reject owner mint from non-owner", async function () {
      const { usdfc, user1, user2 } = await loadFixture(deployUSDFCFixture);
      
      const mintAmount = toUSDFC(1000);
      
      await expect(usdfc.connect(user1).mint(user2.address, mintAmount))
        .to.be.revertedWithCustomError(usdfc, "OwnableUnauthorizedAccount");
    });
  });

  describe("Collateral Management", function () {
    it("Should track collateral deposits correctly", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(2);
      
      await usdfc.connect(user1).mintWithCollateral({ value: filAmount });
      
      expect(await usdfc.collateralDeposits(user1.address)).to.equal(filAmount);
    });

    it("Should return correct collateral info", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const filAmount = toFIL(1); // 1 FIL collateral
      await usdfc.connect(user1).mintWithCollateral({ value: filAmount });
      
      const [depositedCollateral, collateralRatio] = await usdfc.getCollateralInfo(user1.address);
      
      expect(depositedCollateral).to.equal(filAmount);
      // With 1 FIL collateral and 1000 USDFC: (1 * 1000 * 100) / 1000 = 100%
      expect(collateralRatio).to.equal(100);
    });

    it("Should return zero collateral ratio for users with no balance", async function () {
      const { usdfc, user1 } = await loadFixture(deployUSDFCFixture);
      
      const [depositedCollateral, collateralRatio] = await usdfc.getCollateralInfo(user1.address);
      
      expect(depositedCollateral).to.equal(0);
      expect(collateralRatio).to.equal(0);
    });
  });

  describe("ERC20 Standard Functionality", function () {
    it("Should allow token transfers", async function () {
      const { usdfc, user1, user2 } = await loadFixture(deployUSDFCFixture);
      
      // Mint tokens for user1
      await usdfc.connect(user1).mintWithCollateral({ value: toFIL(1) });
      
      const transferAmount = toUSDFC(100);
      
      await expect(usdfc.connect(user1).transfer(user2.address, transferAmount))
        .to.changeTokenBalances(usdfc, [user1, user2], [-transferAmount, transferAmount]);
    });

    it("Should allow approvals and transferFrom", async function () {
      const { usdfc, user1, user2, user3 } = await loadFixture(deployUSDFCFixture);
      
      // Mint tokens for user1
      await usdfc.connect(user1).mintWithCollateral({ value: toFIL(1) });
      
      const approveAmount = toUSDFC(500);
      const transferAmount = toUSDFC(200);
      
      // Approve user2 to spend user1's tokens
      await usdfc.connect(user1).approve(user2.address, approveAmount);
      
      // Check allowance
      expect(await usdfc.allowance(user1.address, user2.address)).to.equal(approveAmount);
      
      // Transfer from user1 to user3 via user2
      await expect(usdfc.connect(user2).transferFrom(user1.address, user3.address, transferAmount))
        .to.changeTokenBalances(usdfc, [user1, user3], [-transferAmount, transferAmount]);
      
      // Check remaining allowance
      expect(await usdfc.allowance(user1.address, user2.address)).to.equal(approveAmount - transferAmount);
    });

    it("Should reject transfers exceeding balance", async function () {
      const { usdfc, user1, user2 } = await loadFixture(deployUSDFCFixture);
      
      // Mint some tokens for user1
      await usdfc.connect(user1).mintWithCollateral({ value: toFIL(1) }); // 1000 USDFC
      
      const transferAmount = toUSDFC(1500); // More than balance
      
      await expect(usdfc.connect(user1).transfer(user2.address, transferAmount))
        .to.be.revertedWithCustomError(usdfc, "ERC20InsufficientBalance");
    });

    it("Should reject transferFrom exceeding allowance", async function () {
      const { usdfc, user1, user2, user3 } = await loadFixture(deployUSDFCFixture);
      
      // Mint tokens for user1
      await usdfc.connect(user1).mintWithCollateral({ value: toFIL(1) });
      
      const approveAmount = toUSDFC(100);
      const transferAmount = toUSDFC(200); // More than allowance
      
      await usdfc.connect(user1).approve(user2.address, approveAmount);
      
      await expect(usdfc.connect(user2).transferFrom(user1.address, user3.address, transferAmount))
        .to.be.revertedWithCustomError(usdfc, "ERC20InsufficientAllowance");
    });
  });

  describe("Ownership Functionality", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { usdfc, owner, user1 } = await loadFixture(deployUSDFCFixture);
      
      await usdfc.connect(owner).transferOwnership(user1.address);
      expect(await usdfc.owner()).to.equal(user1.address);
    });

    it("Should reject ownership transfer from non-owner", async function () {
      const { usdfc, user1, user2 } = await loadFixture(deployUSDFCFixture);
      
      await expect(usdfc.connect(user1).transferOwnership(user2.address))
        .to.be.revertedWithCustomError(usdfc, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration Tests", function () {
    it("Should work correctly in a complex scenario", async function () {
      const { usdfc, owner, user1, user2 } = await loadFixture(deployUSDFCFixture);
      
      // 1. user1 mints 1000 USDFC with 1 FIL
      await usdfc.connect(user1).mintWithCollateral({ value: toFIL(1) });
      expect(await usdfc.balanceOf(user1.address)).to.equal(toUSDFC(1000));
      
      // 2. user1 transfers 200 USDFC to user2
      await usdfc.connect(user1).transfer(user2.address, toUSDFC(200));
      expect(await usdfc.balanceOf(user2.address)).to.equal(toUSDFC(200));
      
      // 3. Owner mints 500 USDFC directly to user2
      await usdfc.connect(owner).mint(user2.address, toUSDFC(500));
      expect(await usdfc.balanceOf(user2.address)).to.equal(toUSDFC(700));
      
      // 4. user1 redeems 400 USDFC for FIL
      await usdfc.connect(user1).redeem(toUSDFC(400));
      expect(await usdfc.balanceOf(user1.address)).to.equal(toUSDFC(400));
      
      // 5. user2 mints more with direct FIL transfer
      await user2.sendTransaction({ to: await usdfc.getAddress(), value: toFIL(0.5) });
      expect(await usdfc.balanceOf(user2.address)).to.equal(toUSDFC(1200)); // 700 + 500
      
      // Check final state
      const [collateral, ratio] = await usdfc.getCollateralInfo(user1.address);
      expect(collateral).to.equal(toFIL(0.6)); // 1 - 0.4 redeemed
      
      const totalSupply = await usdfc.totalSupply();
      // Initial 100000 + 1000 + 500 + 500 - 400 = 101600
      expect(totalSupply).to.equal(toUSDFC(101600));
    });
  });
}); 