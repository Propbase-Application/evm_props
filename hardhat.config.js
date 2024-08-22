require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();
require('hardhat-contract-sizer');
require('hardhat-deploy');
require('@nomicfoundation/hardhat-verify');
require('solidity-coverage');
require('hardhat-gas-reporter');

/** @type import('hardhat/config').HardhatUserConfig */
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY;

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545/',
      chainId: 31337,
      blockConfirmations: 1,
    },
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
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
    base_chain_mainnet: {
      url: process.env.BASE_CHAIN_MAINNET_RPC,
      chainId: 8453,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.12',
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
      bscTestnet: process.env.BNB_SCAN_API_KEY,
      base_chain_sepolia: process.env.BASE_CHAIN_SEPOLIA_API_KEY,
      base_chain_mainnet: process.env.BASE_CHAIN_MAINNET_API_KEY,
    },
    customChains: [],
  },
  gasReporter: {
    enabled: true,
    outputFile: 'gas-report.txt',
    noColors: true,
    currency: 'USD',
    coinmarketcap: COIN_MARKET_CAP_API_KEY,
    token: 'ETH',
  },
  mocha: {
    timeout: 400000,
  },
};
