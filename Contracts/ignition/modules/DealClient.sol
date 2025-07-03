const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DealClientModule", (m) => {
    const dealClient = m.contract("DealClient");

    return { dealClient };
});