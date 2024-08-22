# EVM $PROPS

This project is implementation of $PROPS coin in evm. $PROPS coin is the native utility coin of Propbase, a global power in driving real world property assets in blockchain. Propbase is a blockchain based tokenized property transaction marketplace for investment properties headquartered in South East Asia. The Props utility token powers the circular economy on Propbase and enables users to freely interact with close to zero fees.

# Docs

The functional diagram is described at [functional_diagram_props.png](docs/functional_diagram_props.png)
More on security protocol is mentioned at [security_protocol.md](docs/security_protocol.md)
Extensive test are found at [props_evm.test.js](test/props_evm.test.js)

## Environment Variables

To run this project, you will need to copy the items from the .env.example to .env file and fill up the values. Take precaution in not to expose the private keys in the .env file.

## Install packages:

select the latest stable node version in terminal via nvm

```
npm install
```

```
npm i hardhat
```

## Compile

```
npx hardhat compile
```

## Test

```
npx hardhat coverage --sources props_evm.sol
```

### Current Coverage

```


  42 passing (7s)

----------------|----------|----------|----------|----------|----------------|
File            |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------|----------|----------|----------|----------|----------------|
 contracts/     |      100 |    98.21 |      100 |      100 |                |
  props_evm.sol |      100 |    98.21 |      100 |      100 |                |
----------------|----------|----------|----------|----------|----------------|
All files       |      100 |    98.21 |      100 |      100 |                |
----------------|----------|----------|----------|----------|----------------|


```

## Deployment

To deploy this project in the specified NETWORK as configured in [hardhat.config.js](hardhat.config.js).
The contract gets deployed and is verified in the network explorer.

```
  npx hardhat deploy --network [NETWORK]
```

## Testnet Deployment

```
npx hardhat deploy --network baseSepolia
```

## Mainnet Deployment

```
npx hardhat deploy --network base_chain_mainnet
```
