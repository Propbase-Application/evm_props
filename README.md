# Evm Props

This project is implementation of PROPS coin in evm for which the PROPS coin from Aptos will be bridged.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```
GORELLI_RPC_URL="GORELLI_NETWORK_RPC_URL" //optional
SEPOLIA_RPC_URL="SEPOLIA_NETWORK_RPC_URL"//optional
PRIVATE_KEY="YOUR_PRIVATE_KEY //
ETHERSCAN_API_KEY="ETHERSCAN_API_KEY" //optional for validating contract
COIN_MARKET_CAP_API_KEY="COIN_MARKET_API_KEY"//optional
POLYGON_API_KEY="P44QQFSSFS8T7FE5Y5VPAFHDX6QXF5T6C4"//optional for validating contract
BNB_SCAN_API_KEY="DFSF2C5QWJ2F4KVXADFSZDTRBC4WB2UM8J"//optional for validating contract
```

## Initializing commands:

`npm install`

`npm i hardhat`

## Compile

`npx hardhat compile`

## Deployment

To deploy this project run

```bash
  npx hardhat deploy --netwrok [NETWORK] // Network can be of choosing
```

## Coverage

To check the contract coverage for props run

`npx hardhat coverage --sources props_evm.sol`

### Current Coverage

```


  39 passing (3s)

----------------|----------|----------|----------|----------|----------------|
File            |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------|----------|----------|----------|----------|----------------|
 contracts/     |    95.45 |    98.48 |    93.33 |    97.73 |                |
  props_evm.sol |    95.45 |    98.48 |    93.33 |    97.73 |            103 |
----------------|----------|----------|----------|----------|----------------|
All files       |    95.45 |    98.48 |    93.33 |    97.73 |                |
----------------|----------|----------|----------|----------|----------------|

```
