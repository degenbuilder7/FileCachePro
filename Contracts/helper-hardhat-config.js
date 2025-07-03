const networkConfig = {
    314159: {
        name: "calibration",
        ethUsdPriceFeed: "0x0000000000000000000000000000000000000000",
    },
    314: {
        name: "mainnet",
        ethUsdPriceFeed: "0x0000000000000000000000000000000000000000",
    },
    31337: {
        name: "localhost",
    },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains,
}; 