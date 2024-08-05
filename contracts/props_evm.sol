// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

error PROPS__InvalidAddress();
error PROPS__MintCapReached(uint256 limit);
error PROPS__AddressNotMultiSign();
error PROPS__AmountTrancheCapReached();
error PROPS__BurnAmountNotAvailable();

contract PROPS is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    uint256 public immutable MINT_CAP;
    string public _iconURI;
    uint256 current_supply = 0;
    uint256 mint_tranche_cap = 0;
    uint256 burn_tranche_cap = 0;

    constructor(
        uint256 mint_cap,
        uint256 mint_tranche,
        uint256 burn_tranche,
        string memory icon_uri
    )
        ERC20("PROPS", "PROPS")
    {
        MINT_CAP = mint_cap;
        _iconURI = icon_uri;
        mint_tranche_cap = mint_tranche;
        burn_tranche_cap = burn_tranche;
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    modifier isValidAddress(address to){
        if(to == address(0)){
            revert PROPS__InvalidAddress(); 
        }
        _;
    }

    modifier isMultisignAddress(address to){
        if(to.code.length == 0){
            revert PROPS__AddressNotMultiSign(); 
        }
        _;
    }

    modifier checkTrancheLimit(uint256 amount, uint256 limit_cap){
        if(amount > limit_cap){
            revert PROPS__AmountTrancheCapReached(); 
        }
        _;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) checkTrancheLimit(amount, mint_tranche_cap) {
        current_supply += amount;
        if(current_supply > MINT_CAP){
            revert PROPS__MintCapReached(MINT_CAP);
        }
        _mint(to, amount);
    }

    function burn(address to, uint256 amount) public onlyRole(BURNER_ROLE) checkTrancheLimit(amount, burn_tranche_cap) {
        if(current_supply < amount){
            revert PROPS__BurnAmountNotAvailable(); 
        }
        current_supply -= amount;
        _burn(to, amount);
    }

    function decimals() public override view virtual returns (uint8) {
        return 8;
    }

    function setupAdmin(address admin) external onlyRole(ADMIN_ROLE) isValidAddress(admin) isMultisignAddress(admin) {
        _setupRole(ADMIN_ROLE, admin);   
    }

    function setupMinter(address minter, bool enabled) external onlyRole(ADMIN_ROLE) isValidAddress(minter) isMultisignAddress(minter) {
        if (enabled) _setupRole(MINTER_ROLE, minter);
        else _revokeRole(MINTER_ROLE, minter);   
    }

    function setupBurner(address burner, bool enabled) external onlyRole(ADMIN_ROLE) isValidAddress(burner) isMultisignAddress(burner) {
        if (enabled) _setupRole(BURNER_ROLE, burner);
        else _revokeRole(BURNER_ROLE, burner);   
    }  
}