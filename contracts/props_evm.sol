// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";


/// @title $PROPS evm coin
/// @author Propbase
/// @notice You can use this contract for deploying $PROPS on evm
contract TEST_PROPS is ERC20, ERC20Burnable {

    string public _iconURI; // Coin image uri

    // constructor setting intial configurations
    constructor(
        address receiver,
        uint256 amount,
        string memory icon_uri
    ) ERC20("PROPS", "PROPS") {
        _iconURI = icon_uri;
        _mint(receiver, amount);
    }

    /// @notice gets decimals of $PROPS
    /// @return decimals gets decimals of $PROPS
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }
}
