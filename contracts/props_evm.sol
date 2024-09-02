// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

error PROPS__NOT_ATHOURISED();
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
    uint256 public constant TOTAL_SUPPLY = 120000000000000000; // Maximum supply 1.2 billion $PROPS
    uint256 private constant MINT_TRANCHE_MAX = 100000000000000; // Limit of mint tranche limit 1 million
    uint256 private constant MINT_DELAY = 172800; // Delay of 2 days per mint
    uint256 public current_supply = 0; // Current supply
    uint256 public mint_tranche_limit = 0; // Minting limit per mint call
    uint256 public last_mint_timestamp = 0; // Variable tracking last mint timestamp
    uint256 public last_mint_tranche_timestamp = 0; // Variable tracking last mint tranche set timestamp

    // All addresses are Safe Multi-Sign addresses
    address private constant MINTER =
        0x401518a18849185b49097EeAf5690f6825190068;
    address private constant LIMITER =
        0xAF48d53c8b33A98390Fa52A906fD57Fad7B84a5E;
    address private constant TREASURY =
        0x068121C6be050Cd9a20105d9133FE26ab3971b46;

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

    /// @notice Mints the specific amount of tokens
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
            revert PROPS__NOT_ATHOURISED();
        }
        if (current_supply + amount > TOTAL_SUPPLY) {
            revert PROPS__MintCapReached(TOTAL_SUPPLY);
        }
        current_supply += amount;
        last_mint_timestamp = block.timestamp;
        _mint(TREASURY, amount);
        emit PropsMinted(
            msg.sender,
            TREASURY,
            amount,
            block.timestamp,
            current_supply
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
            revert PROPS__NOT_ATHOURISED();
        }
        if (limit > TOTAL_SUPPLY || limit > MINT_TRANCHE_MAX) {
            revert PROPS__MintTrancheLimitOutOfRange();
        }
        last_mint_tranche_timestamp = block.timestamp;
        mint_tranche_limit = limit;
        emit MintTrancheLimitSetup(msg.sender, limit, block.timestamp);
    }
}
