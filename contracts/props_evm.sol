// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

error PROPS__InvalidAddress();
error PROPS__MintCapReached(uint256 limit);
error PROPS__AddressNotMultiSign();
error PROPS__AmountTrancheLimitReached();
error PROPS__FrequencyTimeLimitNotReached(
    uint256 current_timestamp,
    uint256 unlock_timestamp
);
error PROPS__MintTrancheLimitOutOfRange();

/// @title $PROPS evm coin
/// @author Propbase
/// @notice You can use this contract for deploying $PROPS on evm
contract PROPS is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant LIMITER_ROLE = keccak256("LIMITER_ROLE");

    uint256 public constant TOTAL_SUPPLY = 120000000000000000; // Maximum supply
    uint256 private constant MINT_TRANCHE_MAX = 100000000000000; // Limit of max mint tranche limit 1 million tokens as $PROPS has 8 decimals
    uint256 private constant MINT_DELAY = 172800; // Delay of 2 days per mint
    uint256 public current_supply = 0; // Current supply
    uint256 public mint_tranche_limit = 0; // Minting limit per mint call
    uint256 public last_mint_timestamp = 0; // Variable tracking last mint timestamp
    uint256 public last_mint_tranche_timestamp = 0; // Variable tracking last mint tranche set timestamp
    address public admin;
    address public minter;
    address public limiter;
    address public treasury;

    event PropsMinted(
        address indexed receiver,
        uint256 amount,
        uint256 timestamp,
        uint256 current_supply
    );
    event AdminChanged(address indexed new_admin, uint256 timestamp);
    event AdminRevoked(address indexed admin, uint256 timestamp);
    event MinterChanged(address indexed new_minter, uint256 timestamp);
    event LimiterChanged(address indexed new_limiter, uint256 timestamp);
    event TreasuryChanged(address indexed new_treasury, uint256 timestamp);
    event MintTrancheLimitSetup(
        address indexed minter,
        uint256 new_mint_tranche_limit,
        uint256 timestamp
    );

    // Constructor setting initial configurations
    constructor(uint256 mint_tranche) ERC20("Propbase", "PROPS") {
        mint_tranche_limit = mint_tranche;
        admin = msg.sender;
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    // Checks if address is non zero address
    modifier isValidAddress(address to) {
        if (to == address(0)) {
            revert PROPS__InvalidAddress();
        }
        _;
    }

    // Checks if address is multi-sign address
    modifier isMultisignAddress(address to) {
        if (to.code.length == 0) {
            revert PROPS__AddressNotMultiSign();
        }
        _;
    }

    // Checks if updated tranche is within max tranche limit
    modifier checkTrancheLimit(uint256 amount, uint256 limit_max) {
        if (amount > limit_max) {
            revert PROPS__AmountTrancheLimitReached();
        }
        _;
    }

    // Checks if delay is present in between same function calls
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

    /// @notice Mints the specific amount of tokens
    /// @dev Only MINTER_ROLE user can mint coins in tranches and in specific frequency.
    /// @param amount $PROPS coin amount
    function mint(
        uint256 amount
    )
        public
        onlyRole(MINTER_ROLE)
        checkTrancheLimit(amount, mint_tranche_limit)
        checkDelay(last_mint_timestamp, MINT_DELAY)
    {
        if (current_supply + amount > TOTAL_SUPPLY) {
            revert PROPS__MintCapReached(TOTAL_SUPPLY);
        }
        current_supply += amount;
        last_mint_timestamp = block.timestamp;
        _mint(treasury, amount);
        emit PropsMinted(treasury, amount, block.timestamp, current_supply);
    }

    /// @notice sets decimals of $PROPS
    /// @return decimals decimals of $PROPS
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    /// @notice sets ADMIN_ROLE.
    /// @dev Only ADMIN_ROLE user can set ADMIN_ROLE and address should be Multisign.
    /// @param new_admin new ADMIN_ROLE user.
    function changeAdmin(
        address new_admin
    )
        external
        onlyRole(ADMIN_ROLE)
        isValidAddress(new_admin)
        isMultisignAddress(new_admin)
    {
        _grantRole(ADMIN_ROLE, new_admin);
        _revokeRole(ADMIN_ROLE, msg.sender);
        admin = new_admin;
        emit AdminChanged(new_admin, block.timestamp);
    }

    /// @notice Revokes ADMIN_ROLE.
    /// @dev Only current ADMIN_ROLE user can revoke ADMIN_ROLE.
    /// @param user user to be revoked from ADMIN_ROLE
    function revokeAdmin(
        address user
    ) external onlyRole(ADMIN_ROLE) isValidAddress(user) {
        _revokeRole(ADMIN_ROLE, user);
        admin = address(0);
        emit AdminRevoked(user, block.timestamp);
    }

    /// @notice sets Minter.
    /// @dev Only ADMIN_ROLE user can set MINTER_ROLE and address should be Multisign.
    /// @param new_minter new MINTER_ROLE user.
    function changeMinter(
        address new_minter
    )
        external
        onlyRole(ADMIN_ROLE)
        isValidAddress(new_minter)
        isMultisignAddress(new_minter)
    {
        _grantRole(MINTER_ROLE, new_minter);
        if (minter != address(0)) _revokeRole(MINTER_ROLE, minter);
        minter = new_minter;
        emit MinterChanged(new_minter, block.timestamp);
    }

    /// @notice sets Limiter.
    /// @dev Only ADMIN_ROLE user can set LIMITER_ROLE and address should be Multisign.
    /// @param new_limiter new LIMITER_ROLE user.
    function changeLimiter(
        address new_limiter
    )
        external
        onlyRole(ADMIN_ROLE)
        isValidAddress(new_limiter)
        isMultisignAddress(new_limiter)
    {
        _grantRole(LIMITER_ROLE, new_limiter);
        if (limiter != address(0)) _revokeRole(LIMITER_ROLE, limiter);
        limiter = new_limiter;
        emit LimiterChanged(new_limiter, block.timestamp);
    }

    /// @notice sets Treasury.
    /// @dev Only ADMIN_ROLE user can set treasury and address should be Multisign.
    /// @param new_treasury new treasury user.
    function changeTreasury(
        address new_treasury
    )
        external
        onlyRole(ADMIN_ROLE)
        isValidAddress(new_treasury)
        isMultisignAddress(new_treasury)
    {
        treasury = new_treasury;
        emit TreasuryChanged(new_treasury, block.timestamp);
    }

    /**
     * @notice sets MintTrancheLimit.
     * @dev Only MINTER_ROLE user can set MintTrancheLimit within max limit with specific delays.
     * @param limit new MintTrancheLimit limit.
     */
    function setMintTrancheLimit(
        uint256 limit
    )
        external
        onlyRole(LIMITER_ROLE)
        checkDelay(last_mint_tranche_timestamp, MINT_DELAY)
    {
        if (limit > TOTAL_SUPPLY || limit > MINT_TRANCHE_MAX) {
            revert PROPS__MintTrancheLimitOutOfRange();
        }
        last_mint_tranche_timestamp = block.timestamp;
        mint_tranche_limit = limit;
        emit MintTrancheLimitSetup(msg.sender, limit, block.timestamp);
    }
}
