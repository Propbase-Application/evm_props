// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

error PROPS__NOT_AUTHOURISED();
error PROPS__MintCapReached(uint256 limit);
error PROPS__AmountTrancheLimitReached();
error PROPS__FrequencyTimeLimitNotReached(
    uint256 current_timestamp,
    uint256 unlock_timestamp
);
error PROPS__MintTrancheLimitOutOfRange();

/// @title $PROPS evm coin
/// @author Propbase
/// @notice You can use this contract for deploying $PROPS on evm
contract PROPS is ERC20, ERC20Burnable {
    uint256 public constant MAX_SUPPLY = 120000000000000000; // Maximum supply 1.2 billion $PROPS
    uint256 private constant MINT_TRANCHE_MAX = 200000000000000; // Limit of mint tranche limit 1 million
    uint256 private constant MINT_DELAY = 172800; // Delay of 2 days per mint
    uint256 public mint_tranche_limit = 0; // Minting limit per mint call
    uint256 public last_mint_timestamp = 0; // Variable tracking last mint timestamp
    uint256 public last_mint_tranche_timestamp = 0; // Variable tracking last mint tranche set timestamp

    // All addresses are Safe Multi-Sign addresses
    address private constant MINTER =
        0xfC85e87b38B7d2E2fBc29AE40f57c4928E22D4F0;
    address private constant LIMITER =
        0xa0305f4599A5519651435A70810B205c648799a1;
    address private constant TREASURY =
        0x43b6EaA9DF444177f1d41da6fd4A5FbB45b7E781;

    event PropsMinted(
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        uint256 timestamp,
        uint256 current_supply
    );
    event MintTrancheLimitSetup(
        address indexed sender,
        uint256 new_mint_tranche_limit,
        uint256 timestamp
    );

    // Constructor setting initial configurations
    constructor(uint256 mint_tranche) ERC20("Propbase", "PROPS") {
        mint_tranche_limit = mint_tranche;
    }

    // Checks if given tranche is within max tranche limit
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

    /// @notice Mint the specific amount of tokens
    /// @dev Only MINTER user can mint coins in tranches and in specific frequency.
    /// @param amount $PROPS coin amount
    function mint(
        uint256 amount
    )
        external
        checkTrancheLimit(amount, mint_tranche_limit)
        checkDelay(last_mint_timestamp, MINT_DELAY)
    {
        if (msg.sender != MINTER) {
            revert PROPS__NOT_AUTHOURISED();
        }
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert PROPS__MintCapReached(MAX_SUPPLY);
        }
        last_mint_timestamp = block.timestamp;
        _mint(TREASURY, amount);
        emit PropsMinted(
            msg.sender,
            TREASURY,
            amount,
            block.timestamp,
            totalSupply()
        );
    }

    /// @notice sets decimals of $PROPS
    /// @return decimals decimals of $PROPS
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    /**
     * @notice sets MintTrancheLimit.
     * @dev Only LIMITER user can set MintTrancheLimit within max limit with specific delays.
     * @param limit new tranche limit to mint.
     */
    function setMintTrancheLimit(
        uint256 limit
    ) external checkDelay(last_mint_tranche_timestamp, MINT_DELAY) {
        if (msg.sender != LIMITER) {
            revert PROPS__NOT_AUTHOURISED();
        }
        if (limit > MAX_SUPPLY || limit > MINT_TRANCHE_MAX) {
            revert PROPS__MintTrancheLimitOutOfRange();
        }
        last_mint_tranche_timestamp = block.timestamp;
        mint_tranche_limit = limit;
        emit MintTrancheLimitSetup(msg.sender, limit, block.timestamp);
    }
}
