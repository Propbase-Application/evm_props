const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const args = [
    ethers.parseUnits("1200000000", 8),
    1000000000000,
    500000000000,
    86400,
    86400,
    "www.icon.com",
  ];
  const props = await deploy("PROPS", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name)) {
    console.log("VERIFYING.........");
    await verify(props.address, args);
  }

  console.log("------------------------------------");
};
module.exports.tags = ["all", "erc20"];
