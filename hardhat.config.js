require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-contract-sizer");
require("hardhat-deploy");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
      blockConfirmations: 1,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
    base_chain_sepolia: {
      url: process.env.BASE_CHAIN_SEPOLIA_RPC,
      chainId: 84532,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
    baseSepolia: {
      url: process.env.BASE_CHAIN_SEPOLIA_RPC,
      chainId: 84532,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
    base_chain_mainnet: {
      url: process.env.BASE_CHAIN_MAINNET_RPC,
      chainId: 8453,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
    eth_chain_mainnet: {
      url: process.env.ETH_CHAIN_MAINNET_RPC || "https://1rpc.io/eth",
      chainId: 1,
      accounts: [PRIVATE_KEY],
    },
    // Robinhood Chain mainnet (Arbitrum-stack L2). Explorer: https://robinhoodchain.blockscout.com/
    // Gas price there is ~0.02 gwei, so it is left to the provider rather than pinned.
    robinhood_chain_mainnet: {
      url:
        process.env.ROBINHOOD_CHAIN_MAINNET_RPC ||
        "https://rpc.mainnet.chain.robinhood.com",
      chainId: 4663,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETH_MAINNET_API_KEY,
      bscTestnet: process.env.BNB_SCAN_API_KEY,
      base_chain_sepolia: process.env.BASE_CHAIN_SEPOLIA_API_KEY,
      baseSepolia: process.env.BASE_CHAIN_SEPOLIA_API_KEY,
      base: process.env.BASE_CHAIN_MAINNET_API_KEY,
      // Blockscout API key (free, from https://dev.blockscout.com/). Requests without a key are rejected.
      robinhood_chain_mainnet: process.env.BLOCKSCOUT_API_KEY_ROBINHOOD,
    },
    customChains: [
      {
        network: "robinhood_chain_mainnet",
        chainId: 4663,
        urls: {
          // https://robinhoodchain.blockscout.com/api sits behind a Cloudflare challenge that
          // rejects non-browser clients, so verification goes through Blockscout's keyed API gateway.
          apiURL: "https://api.blockscout.com/4663/api",
          browserURL: "https://robinhoodchain.blockscout.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COIN_MARKET_CAP_API_KEY,
    token: "ETH",
  },
  mocha: {
    timeout: 400000,
  },
};
