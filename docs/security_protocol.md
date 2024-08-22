# Evm PROPS

## Introduction

Props deployed on EVM chains are used for bridging in between evm and aptos chains for the purpose of greater security the role based approach is being implemented where the main role which is Admin is revoked at the end of initial setup.

## Security Measures

### Role Based controls

For distributing the control of evm props we have 3 roles that control overall flow of the props contract namely 

**ADMIN_ROLE**
Admin role is the role which get assigned on the initial deployment itself where the deployer who is initially single sign wallet will be  ADMIN_ROLE user and it need to set MINTER_ROLE and PARAMETER_ADMIN as MULTISIGN safe_wallet once done admin will call REVOKE_ADMIN to renounce ownership of the contract.

**MINTER_ROLE**
MINTER_ROLE user is set by ADMIN_ROLE user and it can be only a MULTISIGN wallet and this user can only mint $PROPS to a wallet with the constraints. 

**PARAMETER_ADMIN_ROLE**
PARAMETER_ADMIN_ROLE is set by admin initially and it can be only a MULTISIGN wallet this wallet is responsible to set tranche_limit per minting props per transaction.

### Constraints

**MAX_SUPPLY**
It is constant 1.2 Billion as $PROPS has maximum supply of 1.2billion in aptos itself hence props can be minted till max supply.

**MAX_MINT_TRANCHE_CAP**
It is the amount of $PROPS that can be minted per minting transactions which is 
Limited to 1 million $PROPS

**MINT_DELAY**
It is the minimum delay between each minting and updating minting tranche 
cap  transaction which is set to 48 hours for our use case.

**Mint only to Treasur**
MInter to address is always can be a multisign address set by admin.