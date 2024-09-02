# Evm PROPS

## Introduction

Props deployed on EVM chains are used for bridging in between Aptos blockchain network and EVM chains.
Role based approach is being implemented for ensuring greater security.

## Security Measures

### Address Based controls

**MINTER_ADDRESS**

- MINTER_ADDRESS user is set by DEPLOYER by hardcoding and it will set MULTISIGN wallet and this user can only mint $PROPS to a multisign treasury wallet hardcoded in code.

**LIMITER_ADDRESS**

- LIMITER_ADDRESS is set by DEPLOYER by hardcoding and it will set MULTISIGN wallet. This wallet is responsible to set tranche_limit per minting props per transaction.

### Constraints

**TOTAL_SUPPLY**

- It is the constant 1.2 Billion as $PROPS has maximum supply of 1.2billion in aptos itself hence props can be minted till max supply.

**MINT_TRANCHE_MAX**

- It is the amount of $PROPS that can be minted per minting transaction. The maximum value for this is
  Limited to 1 million $PROPS

**MINT_DELAY**

- It is the minimum delay between each minting function call. This is set to 48 hours for our use case.

**Mint only to Treasury**

- Minter can send minted PROPS to an address predefined as treasury which must be a multisign address set by deployer.
