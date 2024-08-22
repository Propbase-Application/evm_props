// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "../props_evm.sol";

// This contract is used to mimick the multisign address as the multisign must always be a contract
contract TEST {
    PROPS private props_coin;

    constructor(address _calleeAddress) {
        props_coin = PROPS(_calleeAddress);
    }
    function setMintTrancheLimit(uint256 amount) public {
        props_coin.setMintTrancheLimit(amount);
    }

    function mint(uint256 amount) public {
        props_coin.mint(amount);
    }
}
