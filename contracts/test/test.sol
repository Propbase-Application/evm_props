// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "../props_evm.sol";

contract TEST {

    PROPS private props_coin;

    constructor(address _calleeAddress) {
        props_coin = PROPS(_calleeAddress);
    }
    function setMintTrancheCap(uint256 amount) public  {
        props_coin.setMintTrancheCap(amount);
    }

    function setBurnTrancheCap(uint256 amount) public  {
        props_coin.setBurnTrancheCap(amount);
    }

    function mint(address to, uint256 amount) public  {
        props_coin.mint(to, amount);
    }

    function burn(address to, uint256 amount) public  {
        props_coin.burn(to, amount);
    }
}