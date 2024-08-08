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
error PROPS__FrequencyTimeLimitNotReached(uint256 current_timestamp, uint256 unlock_timestamp);
error PROPS__BurnTrancheCapOutOfRange();
error PROPS__MintTrancheCapOutOfRange();

contract PROPS is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    uint256 public immutable MINT_CAP;
    string public _iconURI;
    uint256 public current_supply = 0;
    uint256 public mint_tranche_cap = 0;
    uint256 public burn_tranche_cap = 0;
    uint256 public mint_delay = 0;
    uint256 public burn_delay = 0;
    uint256 public last_mint_timestamp = 0;
    uint256 public last_burn_timestamp = 0;
    uint256 public last_mint_tranche_timestamp = 0;
    uint256 public last_burn_tranche_timestamp = 0;
    uint256 private constant MAX_BURN_TRANCHE_CAP = 1000000000000000;
    uint256 private constant MAX_MINT_TRANCHE_CAP = 1000000000000000;

    constructor(
        uint256 mint_cap,
        uint256 mint_tranche,
        uint256 burn_tranche,
        uint256 mint_period,
        uint256 burn_period,
        string memory icon_uri
    )
        ERC20("PROPS", "PROPS")
    {
        MINT_CAP = mint_cap;
        _iconURI = icon_uri;
        mint_tranche_cap = mint_tranche;
        burn_tranche_cap = burn_tranche;
        mint_delay = mint_period;
        burn_delay = burn_period;
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

    modifier checkDelay(uint256 last_timestamp, uint256 min_delay){
        uint256 current_timestamp  = block.timestamp;
        if(current_timestamp <= last_timestamp + min_delay){
            revert PROPS__FrequencyTimeLimitNotReached(current_timestamp, last_timestamp + min_delay); 
        }
        _;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) checkTrancheLimit(amount, mint_tranche_cap) checkDelay(last_mint_timestamp, mint_delay) {
        if(current_supply + amount > MINT_CAP){
            revert PROPS__MintCapReached(MINT_CAP);
        }
        current_supply += amount;
        last_mint_timestamp = block.timestamp;
        _mint(to, amount);
    }

    function burn(address to, uint256 amount) public onlyRole(BURNER_ROLE) checkTrancheLimit(amount, burn_tranche_cap) checkDelay(last_burn_timestamp, burn_delay) {
        if(current_supply < amount){
            revert PROPS__BurnAmountNotAvailable(); 
        }
        current_supply -= amount;
        last_burn_timestamp = block.timestamp;
        _burn(to, amount);
    }

    function decimals() public override view virtual returns (uint8) {
        return 8;
    }

    function revokeAdmin(address admin) external onlyRole(ADMIN_ROLE) isValidAddress(admin) {
        _revokeRole(ADMIN_ROLE, admin);   
    }

    function setupAdmin(address admin) external onlyRole(ADMIN_ROLE) isValidAddress(admin) isMultisignAddress(admin) {
        _grantRole(ADMIN_ROLE, admin);   
    }

    function setupMinter(address minter, bool enabled) external onlyRole(ADMIN_ROLE) isValidAddress(minter) isMultisignAddress(minter) {
        if (enabled) _grantRole(MINTER_ROLE, minter);
        else _revokeRole(MINTER_ROLE, minter);   
    }

    function setupBurner(address burner, bool enabled) external onlyRole(ADMIN_ROLE) isValidAddress(burner) isMultisignAddress(burner) {
        if (enabled) _grantRole(BURNER_ROLE, burner);
        else _revokeRole(BURNER_ROLE, burner);   
    }  

    function setMintTrancheCap(uint256 limit) external onlyRole(MINTER_ROLE) checkDelay(last_mint_tranche_timestamp, mint_delay) {
        if(limit > MINT_CAP || limit > MAX_MINT_TRANCHE_CAP ){
            revert PROPS__MintTrancheCapOutOfRange();
        }
        last_mint_tranche_timestamp = block.timestamp;
        mint_tranche_cap = limit;
    }  

    function setBurnTrancheCap(uint256 limit) external onlyRole(BURNER_ROLE) checkDelay(last_burn_tranche_timestamp, burn_delay) {
        if(limit > MINT_CAP || limit > MAX_BURN_TRANCHE_CAP){
            revert PROPS__BurnTrancheCapOutOfRange();
        }
        last_burn_tranche_timestamp = block.timestamp;
        burn_tranche_cap = limit;
    }  

    //view functions
    function getCoinConfig() external view returns(uint256, uint256, uint256, uint256, uint256, string memory){
        return (MINT_CAP, mint_tranche_cap, burn_tranche_cap, mint_delay, burn_delay, _iconURI);
    }
}