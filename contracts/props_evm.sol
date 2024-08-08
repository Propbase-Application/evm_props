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
error PROPS__FrequencyTimeLimitNotReached(
    uint256 current_timestamp,
    uint256 unlock_timestamp
);
error PROPS__BurnTrancheCapOutOfRange();
error PROPS__MintTrancheCapOutOfRange();

/**
 * @title $PROPS evm coin
 * @author Propbase
 * @notice You can use this contract for deploying $PROPS on evm
 */
contract PROPS is ERC20, ERC20Burnable, AccessControl {
    //Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Maximum supply
    uint256 public immutable MINT_CAP;

    // Coin image uri
    string public _iconURI;

    // Variable tracking current supply
    uint256 public current_supply = 0;

    // Minting limit per mint call
    uint256 public mint_tranche_cap = 0;

    // Burning limit per burn call
    uint256 public burn_tranche_cap = 0;

    // Minimum delay between each minting
    uint256 public mint_delay = 0;

    // Minimum delay between each burning
    uint256 public burn_delay = 0;

    // Variable tracking last mint timestamp
    uint256 public last_mint_timestamp = 0;

    // Variable tracking last burn timestamp
    uint256 public last_burn_timestamp = 0;

    // Variable tracking last mint tranche set timestamp
    uint256 public last_mint_tranche_timestamp = 0;

    // Variable tracking last burn tranche timestamp
    uint256 public last_burn_tranche_timestamp = 0;

    // Limit of max mint transche limit 10000000 tokens as $PROPS has 8 decimals
    uint256 private constant MAX_BURN_TRANCHE_CAP = 1000000000000000;

    // Limit of max burn transche limit 10000000 tokens as $PROPS has 8 decimals
    uint256 private constant MAX_MINT_TRANCHE_CAP = 1000000000000000;

    //events
    event PropsMinted(
        address indexed receiver,
        uint256 amount,
        uint256 timestamp
    );

    event PropsBurned(address indexed from, uint256 amount, uint256 timestamp);

    event AdminRevoked(address indexed admin, uint256 timestamp);

    event AdminSetup(address indexed new_admin, uint256 timestamp);

    event MinterSetup(address indexed new_minter, uint256 timestamp);

    event BurnerSetup(address indexed new_burner, uint256 timestamp);

    event MintTrancheCapSetup(
        address indexed minter,
        uint256 new_mint_tranche_cap,
        uint256 timestamp
    );

    event BurnTrancheCapSetup(
        address indexed burner,
        uint256 new_burn_tranche_cap,
        uint256 timestamp
    );

    // constructor setting intial configurations
    constructor(
        uint256 mint_cap,
        uint256 mint_tranche,
        uint256 burn_tranche,
        uint256 mint_period,
        uint256 burn_period,
        string memory icon_uri
    ) ERC20("PROPS", "PROPS") {
        MINT_CAP = mint_cap;
        _iconURI = icon_uri;
        mint_tranche_cap = mint_tranche;
        burn_tranche_cap = burn_tranche;
        mint_delay = mint_period;
        burn_delay = burn_period;
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

    /**
     *
     * @notice Mints the specific "amount"" of tokens to "to" address.
     * @dev Only MINTER_ROLE user can mint that to in specific delays and mint tranche limits per transactiion.
     * @param to receiver address of $PROPS
     * @param amount receiver amount $PROPS
     */
    function mint(
        address to,
        uint256 amount
    )
        public
        onlyRole(MINTER_ROLE)
        checkTrancheLimit(amount, mint_tranche_cap)
        checkDelay(last_mint_timestamp, mint_delay)
    {
        if (current_supply + amount > MINT_CAP) {
            revert PROPS__MintCapReached(MINT_CAP);
        }
        current_supply += amount;
        last_mint_timestamp = block.timestamp;
        _mint(to, amount);

        emit PropsMinted(to, amount, block.timestamp);
    }

    /**
     * @notice Burns the specific "amount"" of tokens from "from" address.
     * @dev Only BURNER_ROLE user can burn that to in specific delays and burn tranche limits per transactiion.
     * @param from receiver address of $PROPS
     * @param amount receiver amount $PROPS
     */
    function burn(
        address from,
        uint256 amount
    )
        public
        onlyRole(BURNER_ROLE)
        checkTrancheLimit(amount, burn_tranche_cap)
        checkDelay(last_burn_timestamp, burn_delay)
    {
        if (current_supply < amount) {
            revert PROPS__BurnAmountNotAvailable();
        }
        current_supply -= amount;
        last_burn_timestamp = block.timestamp;
        _burn(from, amount);

        emit PropsBurned(from, amount, block.timestamp);
    }

    /**
     *
     * @notice gets decimals of $PROPS
     * @return decimals gets decimals of $PROPS
     */
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    /**
     * @notice Revokes ADMIN_ROLE.
     * @dev Only ADMIN_ROLE user can revoke ADMIN_ROLE.
     * @param admin ADMIN_ROLE user to be revoked ADMIN_ROLE
     */
    function revokeAdmin(
        address admin
    ) external onlyRole(ADMIN_ROLE) isValidAddress(admin) {
        _revokeRole(ADMIN_ROLE, admin);

        emit AdminRevoked(admin, block.timestamp);
    }

    /**
     * @notice sets ADMIN_ROLE.
     * @dev Only ADMIN_ROLE user can set ADMIN_ROLE and address should be Multisign.
     * @param admin new ADMIN_ROLE user.
     */
    function setupAdmin(
        address admin
    )
        external
        onlyRole(ADMIN_ROLE)
        isValidAddress(admin)
        isMultisignAddress(admin)
    {
        _grantRole(ADMIN_ROLE, admin);

        emit AdminSetup(admin, block.timestamp);
    }

    /**
     * @notice sets MINTER_ROLE.
     * @dev Only ADMIN_ROLE user can set MINTER_ROLE and address should be Multisign.
     * @param minter new MINTER_ROLE user.
     * @param enabled boolean specifying whether to set or unset MINTER_ROLE.
     */
    function setupMinter(
        address minter,
        bool enabled
    )
        external
        onlyRole(ADMIN_ROLE)
        isValidAddress(minter)
        isMultisignAddress(minter)
    {
        if (enabled) _grantRole(MINTER_ROLE, minter);
        else _revokeRole(MINTER_ROLE, minter);

        emit MinterSetup(minter, block.timestamp);
    }

    /**
     * @notice sets BURNER_ROLE.
     * @dev Only ADMIN_ROLE user can set BURNER_ROLE and address should be Multisign.
     * @param burner new BURNER_ROLE user.
     * @param enabled boolean specifying whether to set or unset BURNER_ROLE.
     */
    function setupBurner(
        address burner,
        bool enabled
    )
        external
        onlyRole(ADMIN_ROLE)
        isValidAddress(burner)
        isMultisignAddress(burner)
    {
        if (enabled) _grantRole(BURNER_ROLE, burner);
        else _revokeRole(BURNER_ROLE, burner);

        emit BurnerSetup(burner, block.timestamp);
    }

    /**
     * @notice sets MintTrancheCap.
     * @dev Only MINTER_ROLE user can set MintTrancheCap and limit should be less than max mint tranche cap that to in specific delays.
     * @param limit new MintTrancheCap limit.
     */
    function setMintTrancheCap(
        uint256 limit
    )
        external
        onlyRole(MINTER_ROLE)
        checkDelay(last_mint_tranche_timestamp, mint_delay)
    {
        if (limit > MINT_CAP || limit > MAX_MINT_TRANCHE_CAP) {
            revert PROPS__MintTrancheCapOutOfRange();
        }
        last_mint_tranche_timestamp = block.timestamp;
        mint_tranche_cap = limit;

        emit MintTrancheCapSetup(msg.sender, limit, block.timestamp);
    }

    /**
     * @notice sets BurnTrancheCap.
     * @dev Only BURNER_ROLE user can set BurnTrancheCap and limit should be less than max burn tranche cap that to in specific delays.
     * @param limit new BurnTrancheCap limit.
     */
    function setBurnTrancheCap(
        uint256 limit
    )
        external
        onlyRole(BURNER_ROLE)
        checkDelay(last_burn_tranche_timestamp, burn_delay)
    {
        if (limit > MINT_CAP || limit > MAX_BURN_TRANCHE_CAP) {
            revert PROPS__BurnTrancheCapOutOfRange();
        }
        last_burn_tranche_timestamp = block.timestamp;
        burn_tranche_cap = limit;

        emit BurnTrancheCapSetup(msg.sender, limit, block.timestamp);
    }

    //view functions

    /**
     * @notice gets app configurations
     * @return MINT_CAP
     * @return mint_tranche_cap
     * @return burn_tranche_cap
     * @return mint_delay
     * @return burn_delay
     * @return _iconURI
     */
    function getCoinConfig()
        external
        view
        returns (uint256, uint256, uint256, uint256, uint256, string memory)
    {
        return (
            MINT_CAP,
            mint_tranche_cap,
            burn_tranche_cap,
            mint_delay,
            burn_delay,
            _iconURI
        );
    }
}
