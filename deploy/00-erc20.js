const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const args = [
    1200000000,
    "0xaE51A9C50a524cEeBF2393f7c211Ed86c5B13c33",
    10000000,
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
