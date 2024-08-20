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

/// @title $PROPS evm coin
/// @author Propbase
/// @notice You can use this contract for deploying $PROPS on evm
contract PROPS is ERC20, ERC20Burnable, AccessControl {
    //Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PARAMETER_ADMIN_ROLE = keccak256("PARAMETER_ADMIN_ROLE");

    uint256 public constant MINT_CAP = 120000000000000000; // Maximum supply
    string public _iconURI; // Coin image uri
    uint256 public current_supply = 0; // Variable tracking current supply
    uint256 public mint_tranche_cap = 0; // Minting limit per mint call
    uint256 public last_mint_timestamp = 0; // Variable tracking last mint timestamp
    uint256 public last_mint_tranche_timestamp = 0; // Variable tracking last mint tranche set timestamp
    uint256 private constant MAX_MINT_TRANCHE_CAP = 100000000000000; // Limit of max burn transche limit 1 million tokens as $PROPS has 8 decimals
    uint256 private constant MINT_DELAY = 172800; // Delay of 2 days per mint
    //events
    event PropsMinted(address indexed receiver, uint256 amount, uint256 timestamp);
    event PropsBurned(address indexed from, uint256 amount, uint256 timestamp);
    event AdminRevoked(address indexed admin, uint256 timestamp);
    event AdminSetup(address indexed new_admin, uint256 timestamp);
    event MinterSetup(address indexed new_minter, uint256 timestamp);
    event ParameterAdminRoleSetup(address indexed new_parameter_admin, uint256 timestamp);
    event MintTrancheCapSetup(address indexed minter, uint256 new_mint_tranche_cap, uint256 timestamp);

    // constructor setting intial configurations
    constructor(
        uint256 mint_tranche,//5 million hard code //need to change later
        string memory icon_uri
    ) ERC20("PROPS", "PROPS") {
        _iconURI = icon_uri;
        mint_tranche_cap = mint_tranche;
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    //modifiers
    //Checks if address is non zero address
    modifier isValidAddress(address to) {
        if (to == address(0)) {
            revert PROPS__InvalidAddress();
        }
        _;
    }

    //Checks if address is multi-sign address
    modifier isMultisignAddress(address to) {
        if (to.code.length == 0) {
            revert PROPS__AddressNotMultiSign();
        }
        _;
    }

    //Checks if updated tranche is in max tranche limit
    modifier checkTrancheLimit(uint256 amount, uint256 limit_cap) {
        if (amount > limit_cap) {
            revert PROPS__AmountTrancheCapReached();
        }
        _;
    }

    //Checks if dealy is present in between function calls
    modifier checkDelay(uint256 last_timestamp, uint256 min_delay) {
        uint256 current_timestamp = block.timestamp;
        if (current_timestamp <= last_timestamp + min_delay) {
            revert PROPS__FrequencyTimeLimitNotReached(
                current_timestamp,
                last_timestamp + min_delay
            );
        }
        _;
    }

    /// @notice Mints the specific "amount"" of tokens to "to" address.
    /// @dev Only MINTER_ROLE user can mint that to in specific delays and mint tranche limits per transaction.
    /// @param to receiver address of $PROPS
    /// @param amount receiver amount $PROPS
    function mint(address to,uint256 amount)
    public onlyRole(MINTER_ROLE) checkTrancheLimit(amount, mint_tranche_cap) checkDelay(last_mint_timestamp, MINT_DELAY){
        if (current_supply + amount > MINT_CAP) {
            revert PROPS__MintCapReached(MINT_CAP);
        }
        current_supply += amount;
        last_mint_timestamp = block.timestamp;
        _mint(to, amount);

        emit PropsMinted(to, amount, block.timestamp);
    }

    /// @notice gets decimals of $PROPS
    /// @return decimals gets decimals of $PROPS
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    /// @notice Revokes ADMIN_ROLE.
    /// @dev Only ADMIN_ROLE user can revoke ADMIN_ROLE.
    /// @param user ADMIN_ROLE user to be revoked ADMIN_ROLE
    function revokeAdmin(bytes32 role, address user) 
    external onlyRole(ADMIN_ROLE) isValidAddress(user) {
        _revokeRole(role, user);

        emit AdminRevoked(user, block.timestamp);
    }

    /// @notice sets ADMIN_ROLE.
    /// @dev Only ADMIN_ROLE user can set ADMIN_ROLE and address should be Multisign.
    /// @param admin new ADMIN_ROLE user.
    function setupAdmin(address admin)
    external onlyRole(ADMIN_ROLE) isValidAddress(admin) isMultisignAddress(admin)
    {
        _grantRole(ADMIN_ROLE, admin);

        emit AdminSetup(admin, block.timestamp);
    }

    /// @notice sets MINTER_ROLE.
    /// @dev Only ADMIN_ROLE user can set MINTER_ROLE and address should be Multisign.
    /// @param minter new MINTER_ROLE user.
    /// @param enabled boolean specifying whether to set or unset MINTER_ROLE.
    function setupMinter(address minter, bool enabled)
    external onlyRole(ADMIN_ROLE) isValidAddress(minter) isMultisignAddress(minter){
        if (enabled) _grantRole(MINTER_ROLE, minter);
        else _revokeRole(MINTER_ROLE, minter);

        emit MinterSetup(minter, block.timestamp);
    }

    /// @notice sets MINTER_ROLE.
    /// @dev Only ADMIN_ROLE user can set PARAMETER_ADMIN_ROLE and address should be Multisign.
    /// @param parameter_admin new PARAMETER_ADMIN_ROLE user.
    /// @param enabled boolean specifying whether to set or unset PARAMETER_ADMIN_ROLE.
    function setupParameterAdmin(address parameter_admin, bool enabled)
    external onlyRole(ADMIN_ROLE) isValidAddress(parameter_admin) isMultisignAddress(parameter_admin){
        if (enabled) _grantRole(PARAMETER_ADMIN_ROLE, parameter_admin);
        else _revokeRole(PARAMETER_ADMIN_ROLE, parameter_admin);

        emit ParameterAdminRoleSetup(parameter_admin, block.timestamp);
    }

    /**
     * @notice sets MintTrancheCap.
     * @dev Only MINTER_ROLE user can set MintTrancheCap and limit should be less than max mint tranche cap that to in specific delays.
     * @param limit new MintTrancheCap limit.
     */
    function setMintTrancheCap(uint256 limit)
    external onlyRole(PARAMETER_ADMIN_ROLE) checkDelay(last_mint_tranche_timestamp, MINT_DELAY){
        if (limit > MINT_CAP || limit > MAX_MINT_TRANCHE_CAP) {
            revert PROPS__MintTrancheCapOutOfRange();
        }
        last_mint_tranche_timestamp = block.timestamp;
        mint_tranche_cap = limit;

        emit MintTrancheCapSetup(msg.sender, limit, block.timestamp);
    }

    //remove
    //view functions

    /// @notice gets app configurations
    /// @return MINT_CAP
    /// @return mint_tranche_cap
    /// @return MINT_DELAY
    /// @return _iconURI
    function getCoinConfig()
    external view returns (uint256, uint256, uint256, string memory)
    {
        return (
            MINT_CAP,
            mint_tranche_cap,
            MINT_DELAY,
            _iconURI
        );
    }
}
