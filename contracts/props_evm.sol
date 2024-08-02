// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract PROPS is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    uint256 public immutable MINT_CAP;
    uint256 current_supply = 0;

    constructor(
        uint256 mint_cap,
        address reciever,
        uint256 amount
    )
        ERC20("PROPS", "PROPS")
    {
        MINT_CAP = mint_cap;
        _setupRole(ADMIN_ROLE, msg.sender);
        _mint(reciever, amount ** decimals());
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        current_supply += amount;
        require(current_supply <= MINT_CAP, "Maximum number of tokens already minted");
        _mint(to, amount);
    }

    function burn(address to, uint256 amount) public onlyRole(BURNER_ROLE) {
        current_supply -= amount;
        _burn(to, amount);
    }

    function decimals() override public view returns (uint8) {
        return 8;
    }
    
    function setupMinter(address minter, bool enabled) external onlyRole(ADMIN_ROLE) {
        require(minter != address(0), "!minter");
        if (enabled) _setupRole(MINTER_ROLE, minter);
        else _revokeRole(MINTER_ROLE, minter);   
    }

    function setupBurner(address burner, bool enabled) external onlyRole(ADMIN_ROLE) {
        require(burner != address(0), "!burner");
        if (enabled) _setupRole(BURNER_ROLE, burner);
        else _revokeRole(BURNER_ROLE, burner);   
    }  
}