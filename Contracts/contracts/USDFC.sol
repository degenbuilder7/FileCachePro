// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title USDFC - Mock USD Filecoin for Calibration Testnet
 * @dev Mock USDFC token for testing VerifiAI marketplace
 * @notice Based on the real USDFC by Secured Finance, this is a testnet version
 */
contract USDFC is ERC20, Ownable {
    uint8 private _decimals = 18;
    
    // Mock collateral ratio (110% like real USDFC)
    uint256 public constant COLLATERAL_RATIO = 110;
    
    event Mint(address indexed user, uint256 amount, uint256 collateralAmount);
    event Redeem(address indexed user, uint256 amount, uint256 collateralAmount);
    event CollateralDeposited(address indexed user, uint256 amount);
    
    // Track FIL collateral deposited by users
    mapping(address => uint256) public collateralDeposits;
    
    constructor() ERC20("USD Filecoin", "USDFC") Ownable(msg.sender) {
        // Mint initial supply for testing (100,000 USDFC)
        _mint(msg.sender, 100000 * 10**decimals());
    }
    
    /**
     * @dev Mint USDFC by depositing FIL as collateral (mock version)
     * @notice Real USDFC requires 110% collateral ratio
     */
    function mintWithCollateral() external payable {
        require(msg.value > 0, "Must send FIL as collateral");
        
        // Calculate USDFC to mint (assuming 1 FIL = $5 for testing)
        // With 110% collateral ratio: 1 FIL ($5) -> 4.54 USDFC
        uint256 usdcAmount = (msg.value * 454) / 100; // 4.54 USDFC per FIL
        
        collateralDeposits[msg.sender] += msg.value;
        _mint(msg.sender, usdcAmount);
        
        emit Mint(msg.sender, usdcAmount, msg.value);
        emit CollateralDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Redeem USDFC for FIL collateral
     * @param amount Amount of USDFC to redeem
     */
    function redeem(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient USDFC balance");
        
        // Calculate FIL to return
        uint256 filAmount = (amount * 100) / 454; // Reverse calculation
        require(collateralDeposits[msg.sender] >= filAmount, "Insufficient collateral");
        
        collateralDeposits[msg.sender] -= filAmount;
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(filAmount);
        
        emit Redeem(msg.sender, amount, filAmount);
    }
    
    /**
     * @dev Mint tokens directly (only owner, for testing purposes)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Returns the number of decimals (18 like real USDFC)
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Get user's collateral info
     * @param user User address
     * @return depositedCollateral Amount of FIL deposited as collateral
     * @return collateralRatio Current collateral ratio percentage
     */
    function getCollateralInfo(address user) external view returns (
        uint256 depositedCollateral,
        uint256 collateralRatio
    ) {
        depositedCollateral = collateralDeposits[user];
        uint256 userBalance = balanceOf(user);
        
        if (userBalance == 0) {
            collateralRatio = 0;
        } else {
            // Calculate ratio: (collateral * 454 / 100) / userBalance * 100
            collateralRatio = (depositedCollateral * 454) / userBalance;
        }
    }
    
    /**
     * @dev Fallback function to handle direct FIL transfers for minting
     */
    receive() external payable {
        require(msg.value > 0, "Must send FIL as collateral");
        
        // Calculate USDFC to mint (assuming 1 FIL = $5 for testing)
        uint256 usdcAmount = (msg.value * 454) / 100;
        
        collateralDeposits[msg.sender] += msg.value;
        _mint(msg.sender, usdcAmount);
        
        emit Mint(msg.sender, usdcAmount, msg.value);
        emit CollateralDeposited(msg.sender, msg.value);
    }
} 