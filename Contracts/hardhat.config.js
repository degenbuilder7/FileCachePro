require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@typechain/hardhat");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */

// Use a proper 32-byte dummy private key for compilation, real one for deployment
const DUMMY_PRIVATE_KEY = "0x1111111111111111111111111111111111111111111111111111111111111111";
const PRIVATE_KEY = process.env.PRIVATE_KEY || DUMMY_PRIVATE_KEY;

// Only warn about missing private key for deployment tasks
if (!process.env.PRIVATE_KEY && (process.argv.includes("deploy") || process.argv.includes("run"))) {
  console.warn("⚠️  WARNING: Please set your PRIVATE_KEY in a .env file for deployment");
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: true,
      outputSelection: {
        "*": {
          "*": ["*"]
        }
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // Set dummy account for compilation
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    },
    calibration: {
      url: "https://api.calibration.node.glif.io/rpc/v1", // Updated to GLIF RPC
      chainId: 314159,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [DUMMY_PRIVATE_KEY],
      gas: "auto",
      gasPrice: "auto",
      timeout: 60000,
    },
    mainnet: {
      chainId: 314,
      url: "https://api.node.glif.io/rpc/v1", // Updated to GLIF RPC
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [DUMMY_PRIVATE_KEY],
      gas: "auto",
      gasPrice: "auto",
      timeout: 60000,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      filecoin: "YOUR_FILSCAN_API_KEY", // Optional for contract verification
    },
    customChains: [
      {
        network: "filecoin",
        chainId: 314,
        urls: {
          apiURL: "https://filfox.info/api/v1",
          browserURL: "https://filfox.info/en",
        },
      },
      {
        network: "calibration",
        chainId: 314159,
        urls: {
          apiURL: "https://calibration.filfox.info/api/v1",
          browserURL: "https://calibration.filfox.info/en",
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
      314: 0, // Filecoin mainnet
      314159: 0, // Calibration testnet
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};
