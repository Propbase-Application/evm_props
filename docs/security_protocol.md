# Evm PROPS

## Introduction

Props deployed on EVM chains are used for bridging in between Aptos blockchain network and EVM chains.
Role based approach is being implemented for ensuring greater security.

## Security Measures

### Role Based controls

For distributing the control of evm props we have 3 roles that control overall flow of the props contract namely

**ADMIN_ROLE**

- Admin role is the role which get assigned on the initial deployment itself where the deployer who is initially single sign wallet will be ADMIN_ROLE user. Admin role user need to set MINTER_ROLE and LIMITER_ROLE as MULTISIGN safe_wallet. Admin role user can change the admin only to a multisign wallet after the initial deployment. Admin role user can call REVOKE_ADMIN to renounce admin role.

**MINTER_ROLE**

- MINTER_ROLE user is set by ADMIN_ROLE user and it can be only a MULTISIGN wallet and this user can only mint $PROPS to a multisign treasury wallet with the constraints.

**LIMITER_ROLE**

- LIMITER_ROLE is set by admin initially and it can be only a MULTISIGN wallet. This wallet is responsible to set tranche_limit per minting props per transaction.

### Constraints

**TOTAL_SUPPLY**

- It is the constant 1.2 Billion as $PROPS has maximum supply of 1.2billion in aptos itself hence props can be minted till max supply.

**MINT_TRANCHE_MAX**

- It is the amount of $PROPS that can be minted per minting transaction. The maximum value for this is
  Limited to 1 million $PROPS

**MINT_DELAY**

- It is the minimum delay between each minting function call. This is set to 48 hours for our use case.

**Mint only to Treasury**

- Minter can send minted PROPS to an address predefined as treasury which must be a multisign address set by admin.
