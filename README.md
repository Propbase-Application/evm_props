# Evm Props

This project is implementation of PROPS coin in evm for which the PROPS coin from Aptos will be bridged.
More on security protocol is mentioned [here](docs/security_protocol.md)

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```
GORELLI_RPC_URL="GORELLI_NETWORK_RPC_URL" //optional
SEPOLIA_RPC_URL="SEPOLIA_NETWORK_RPC_URL"//optional
PRIVATE_KEY="YOUR_PRIVATE_KEY //
ETHERSCAN_API_KEY="ETHERSCAN_API_KEY" //optional for validating contract
COIN_MARKET_CAP_API_KEY="COIN_MARKET_API_KEY"//optional
POLYGON_API_KEY="POLYGON_NETWORK_API_KEY"//optional for validating contract
BNB_SCAN_API_KEY="BNB_SCAN_API_KEY"//optional for validating contract
```

## Initializing commands:

`npm install`

`npm i hardhat`

## Compile

`npx hardhat compile`

## Deployment

To deploy this project run

```bash
  npx hardhat deploy --network [NETWORK] // Network can be of choosing
```

## Coverage

To check the contract coverage for props run

`npx hardhat coverage --sources props_evm.sol`

### Current Coverage

```


  33 passing (7s)

----------------|----------|----------|----------|----------|----------------|
File            |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------|----------|----------|----------|----------|----------------|
 contracts/     |    92.59 |       98 |    85.71 |    95.45 |                |
  props_evm.sol |    92.59 |       98 |    85.71 |    95.45 |        127,227 |
----------------|----------|----------|----------|----------|----------------|
All files       |    92.59 |       98 |    85.71 |    95.45 |                |
----------------|----------|----------|----------|----------|----------------|


```

## Testnet Deployment

```
npx hardhat deploy --network base_chain_sepolia
```

## Mainnet Deployment

```
npx hardhat deploy --network base_chain_mainnet
```
