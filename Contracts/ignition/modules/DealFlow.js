const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DealFLowModule", (m) => {
  const dealContractAddress = m.getParameter(
    "dealClientAddress",
    "0x68de4962694b8e8ee61d59d8acb4e142e8e5ba51"
  );
  const tellorRetrievalAddress = m.getParameter(
    "tellorRetrievalAddress",
    "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444"
  );
  const subnetRegistryAddress = m.getParameter(
    "subnetRegistryAddress",
    "0xc938B2B862d4Ef9896E641b3f1269DabFB2D2103"
  );
  const stakeAmount = m.getParameter("stakeAmount", "1000000000000");

  const dealFlow = m.contract("DealFlow", [
    dealContractAddress,
    tellorRetrievalAddress,
    subnetRegistryAddress,
    stakeAmount,
  ]);

  return { dealFlow };
});
