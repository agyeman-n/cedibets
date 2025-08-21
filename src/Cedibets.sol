// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Cedibets
 * @dev A simple insurance contract allowing users to purchase policies that pay out
 * if the official price of petrol rises above a predetermined level within a set timeframe.
 * 
 * This contract is designed for users in Ghana to protect against fuel price increases.
 */
contract Cedibets is Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    /// @notice Structure to store insurance policy details
    struct Policy {
        uint256 id;                    // Unique ID of the policy
        address policyHolder;          // User who bought the policy
        uint256 premiumPaid;          // Amount paid for the policy (in USDC)
        uint256 payoutAmount;         // Fixed amount to be paid if condition is met (in USDC)
        uint256 strikePrice;          // Fuel price that triggers payout (e.g., 30.50 GHS stored as 3050)
        uint256 expirationTimestamp;  // Timestamp when policy expires and can be settled
        bool settled;                 // Flag to check if policy has been settled
    }
    
    /// @notice Mapping to store all policies by their ID
    mapping(uint256 => Policy) public policies;
    
    /// @notice Mapping to store policy IDs owned by each address
    mapping(address => uint256[]) public userPolicies;
    
    /// @notice Counter for creating unique policy IDs
    uint256 public policyCounter;
    
    /// @notice USDC token contract interface for premium/payout handling
    IERC20 public immutable USDC_TOKEN;
    
    /// @notice Fixed premium amount in USDC (scaled by 6 decimals for USDC)
    uint256 public constant PREMIUM_AMOUNT = 5 * 10**6; // 5 USDC
    
    /// @notice Fixed payout amount in USDC (scaled by 6 decimals for USDC)
    uint256 public constant PAYOUT_AMOUNT = 50 * 10**6; // 50 USDC
    
    // ============ Events ============
    
    /// @notice Emitted when a new policy is purchased
    event PolicyPurchased(
        uint256 indexed policyId,
        address indexed policyHolder,
        uint256 strikePrice,
        uint256 expirationTimestamp
    );
    
    /// @notice Emitted when a policy is settled
    event PolicySettled(
        uint256 indexed policyId,
        uint256 payoutAmount,
        uint256 closingPrice
    );
    
    /// @notice Emitted when funds are withdrawn by owner
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    // ============ Errors ============
    
    error InvalidStrikePrice();
    error InvalidExpirationTime();
    error PolicyNotFound();
    error PolicyAlreadySettled();
    error PolicyNotExpired();
    error InsufficientContractBalance();
    error TransferFailed();
    
    // ============ Constructor ============
    
    /**
     * @dev Constructor sets the USDC token address and initializes ownership
     * @param _usdcToken Address of the USDC token contract
     */
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        USDC_TOKEN = IERC20(_usdcToken);
        policyCounter = 1; // Start policy IDs from 1
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Purchase an insurance policy
     * @dev User pays a fixed premium to get coverage against fuel price increases
     * @param _strikePrice The fuel price that triggers payout (in fixed-point format, e.g., 3050 for 30.50 GHS)
     * @param _expirationTimestamp The timestamp when the policy expires
     */
    function purchasePolicy(
        uint256 _strikePrice,
        uint256 _expirationTimestamp
    ) external nonReentrant {
        // Validate inputs
        if (_strikePrice == 0) revert InvalidStrikePrice();
        if (_expirationTimestamp <= block.timestamp) revert InvalidExpirationTime();
        
        // Transfer premium from user to contract
        bool success = USDC_TOKEN.transferFrom(msg.sender, address(this), PREMIUM_AMOUNT);
        if (!success) revert TransferFailed();
        
        // Create new policy
        uint256 policyId = policyCounter++;
        policies[policyId] = Policy({
            id: policyId,
            policyHolder: msg.sender,
            premiumPaid: PREMIUM_AMOUNT,
            payoutAmount: PAYOUT_AMOUNT,
            strikePrice: _strikePrice,
            expirationTimestamp: _expirationTimestamp,
            settled: false
        });
        
        // Add policy to user's policy list
        userPolicies[msg.sender].push(policyId);
        
        emit PolicyPurchased(policyId, msg.sender, _strikePrice, _expirationTimestamp);
    }
    
    /**
     * @notice Check and settle a policy based on current fuel price
     * @dev This function uses a placeholder for oracle integration
     * @param _policyId The ID of the policy to settle
     * @param _currentFuelPrice The current fuel price (placeholder for oracle data)
     * 
     * TODO: Replace _currentFuelPrice parameter with Chainlink Functions oracle call
     * The oracle should fetch real-time fuel price data from a reliable API source
     * Example integration point for Chainlink Functions:
     * - Set up Chainlink Functions subscription
     * - Create JavaScript source code to fetch fuel price from API
     * - Handle the oracle response in a callback function
     * - Remove the _currentFuelPrice parameter once oracle is integrated
     */
    function checkAndSettlePolicy(
        uint256 _policyId,
        uint256 _currentFuelPrice // TODO: Remove this parameter when oracle is integrated
    ) external nonReentrant {
        Policy storage policy = policies[_policyId];
        
        // Validate policy exists
        if (policy.policyHolder == address(0)) revert PolicyNotFound();
        
        // Check if policy has expired
        if (block.timestamp <= policy.expirationTimestamp) revert PolicyNotExpired();
        
        // Check if policy is already settled
        if (policy.settled) revert PolicyAlreadySettled();
        
        // Mark policy as settled first (CEI pattern)
        policy.settled = true;
        
        // Check if payout condition is met
        if (_currentFuelPrice > policy.strikePrice) {
            // Ensure contract has sufficient balance for payout
            if (USDC_TOKEN.balanceOf(address(this)) < policy.payoutAmount) {
                revert InsufficientContractBalance();
            }
            
            // Transfer payout to policy holder
            bool success = USDC_TOKEN.transfer(policy.policyHolder, policy.payoutAmount);
            if (!success) revert TransferFailed();
            
            emit PolicySettled(_policyId, policy.payoutAmount, _currentFuelPrice);
        } else {
            // No payout - policy expires without payment
            emit PolicySettled(_policyId, 0, _currentFuelPrice);
        }
    }
    
    /**
     * @notice Withdraw collected premiums (owner only)
     * @dev Allows contract owner to withdraw funds for operational purposes
     * @param _amount Amount of USDC to withdraw
     */
    function withdrawFunds(uint256 _amount) external onlyOwner {
        uint256 contractBalance = USDC_TOKEN.balanceOf(address(this));
        require(_amount <= contractBalance, "Insufficient contract balance");
        
        bool success = USDC_TOKEN.transfer(owner(), _amount);
        if (!success) revert TransferFailed();
        
        emit FundsWithdrawn(owner(), _amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get all policy IDs for a specific user
     * @param _user Address of the user
     * @return Array of policy IDs owned by the user
     */
    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }
    
    /**
     * @notice Get contract's USDC balance
     * @return Current USDC balance of the contract
     */
    function getContractBalance() external view returns (uint256) {
        return USDC_TOKEN.balanceOf(address(this));
    }
    
    /**
     * @notice Get policy details by ID
     * @param _policyId The policy ID to query
     * @return Policy struct containing all policy details
     */
    function getPolicy(uint256 _policyId) external view returns (Policy memory) {
        return policies[_policyId];
    }
}
