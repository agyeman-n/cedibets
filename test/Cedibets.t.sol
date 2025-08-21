// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Cedibets} from "../src/Cedibets.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

/**
 * @title CedibetsTest
 * @dev Comprehensive test suite for the Cedibets insurance contract
 */
contract CedibetsTest is Test {
    
    Cedibets public cedibets;
    MockERC20 public mockUSDC;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant PREMIUM_AMOUNT = 5 * 10**6; // 5 USDC
    uint256 public constant PAYOUT_AMOUNT = 50 * 10**6; // 50 USDC
    uint256 public constant INITIAL_USDC_BALANCE = 1000 * 10**6; // 1000 USDC
    
    // Test parameters
    uint256 public constant STRIKE_PRICE = 3050; // 30.50 GHS
    uint256 public constant EXPIRATION_TIME = 30 days;
    
    event PolicyPurchased(
        uint256 indexed policyId,
        address indexed policyHolder,
        uint256 strikePrice,
        uint256 expirationTimestamp
    );
    
    event PolicySettled(
        uint256 indexed policyId,
        uint256 payoutAmount,
        uint256 closingPrice
    );
    
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    function setUp() public {
        // Set up test accounts
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy mock USDC token
        mockUSDC = new MockERC20("Mock USDC", "USDC", 6);
        
        // Deploy Cedibets contract
        cedibets = new Cedibets(address(mockUSDC));
        
        // Fund test accounts with USDC
        mockUSDC.mint(user1, INITIAL_USDC_BALANCE);
        mockUSDC.mint(user2, INITIAL_USDC_BALANCE);
        mockUSDC.mint(address(cedibets), PAYOUT_AMOUNT * 10); // Fund contract for payouts
        
        // Set up approvals for users
        vm.prank(user1);
        mockUSDC.approve(address(cedibets), type(uint256).max);
        
        vm.prank(user2);
        mockUSDC.approve(address(cedibets), type(uint256).max);
    }
    
    // ============ Policy Purchase Tests ============
    
    function testPurchasePolicySuccess() public {
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        
        vm.expectEmit(true, true, false, true);
        emit PolicyPurchased(1, user1, STRIKE_PRICE, expirationTimestamp);
        
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        // Verify policy details
        Cedibets.Policy memory policy = cedibets.getPolicy(1);
        assertEq(policy.id, 1);
        assertEq(policy.policyHolder, user1);
        assertEq(policy.premiumPaid, PREMIUM_AMOUNT);
        assertEq(policy.payoutAmount, PAYOUT_AMOUNT);
        assertEq(policy.strikePrice, STRIKE_PRICE);
        assertEq(policy.expirationTimestamp, expirationTimestamp);
        assertFalse(policy.settled);
        
        // Verify user policies array
        uint256[] memory userPolicies = cedibets.getUserPolicies(user1);
        assertEq(userPolicies.length, 1);
        assertEq(userPolicies[0], 1);
        
        // Verify USDC transfer
        assertEq(mockUSDC.balanceOf(user1), INITIAL_USDC_BALANCE - PREMIUM_AMOUNT);
        
        // Verify policy counter increment
        assertEq(cedibets.policyCounter(), 2);
    }
    
    function testPurchasePolicyInvalidStrikePrice() public {
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        
        vm.prank(user1);
        vm.expectRevert(Cedibets.InvalidStrikePrice.selector);
        cedibets.purchasePolicy(0, expirationTimestamp);
    }
    
    function testPurchasePolicyInvalidExpirationTime() public {
        vm.prank(user1);
        vm.expectRevert(Cedibets.InvalidExpirationTime.selector);
        cedibets.purchasePolicy(STRIKE_PRICE, block.timestamp - 1);
    }
    
    function testPurchasePolicyInsufficientBalance() public {
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        
        // Remove user's USDC balance
        vm.prank(user1);
        mockUSDC.transfer(user2, INITIAL_USDC_BALANCE);
        
        vm.prank(user1);
        vm.expectRevert(); // Expect any revert for insufficient balance
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
    }
    
    function testMultiplePoliciesPurchase() public {
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        
        // User1 purchases first policy
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        // User2 purchases second policy with different strike price
        vm.prank(user2);
        cedibets.purchasePolicy(STRIKE_PRICE + 100, expirationTimestamp);
        
        // Verify both policies exist
        Cedibets.Policy memory policy1 = cedibets.getPolicy(1);
        Cedibets.Policy memory policy2 = cedibets.getPolicy(2);
        
        assertEq(policy1.policyHolder, user1);
        assertEq(policy2.policyHolder, user2);
        assertEq(policy1.strikePrice, STRIKE_PRICE);
        assertEq(policy2.strikePrice, STRIKE_PRICE + 100);
        
        // Verify policy counter
        assertEq(cedibets.policyCounter(), 3);
    }
    
    // ============ Policy Settlement Tests ============
    
    function testSettlePolicyWithPayout() public {
        // Purchase policy
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        // Fast forward time past expiration
        vm.warp(expirationTimestamp + 1);
        
        uint256 initialBalance = mockUSDC.balanceOf(user1);
        uint256 currentFuelPrice = STRIKE_PRICE + 100; // Price above strike
        
        vm.expectEmit(true, false, false, true);
        emit PolicySettled(1, PAYOUT_AMOUNT, currentFuelPrice);
        
        // Settle policy - should trigger payout
        cedibets.checkAndSettlePolicy(1, currentFuelPrice);
        
        // Verify policy is settled
        Cedibets.Policy memory policy = cedibets.getPolicy(1);
        assertTrue(policy.settled);
        
        // Verify payout was made
        assertEq(mockUSDC.balanceOf(user1), initialBalance + PAYOUT_AMOUNT);
    }
    
    function testSettlePolicyWithoutPayout() public {
        // Purchase policy
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        // Fast forward time past expiration
        vm.warp(expirationTimestamp + 1);
        
        uint256 initialBalance = mockUSDC.balanceOf(user1);
        uint256 currentFuelPrice = STRIKE_PRICE - 100; // Price below strike
        
        vm.expectEmit(true, false, false, true);
        emit PolicySettled(1, 0, currentFuelPrice);
        
        // Settle policy - should not trigger payout
        cedibets.checkAndSettlePolicy(1, currentFuelPrice);
        
        // Verify policy is settled
        Cedibets.Policy memory policy = cedibets.getPolicy(1);
        assertTrue(policy.settled);
        
        // Verify no payout was made
        assertEq(mockUSDC.balanceOf(user1), initialBalance);
    }
    
    function testSettlePolicyNotExpired() public {
        // Purchase policy
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        // Try to settle before expiration
        vm.expectRevert(Cedibets.PolicyNotExpired.selector);
        cedibets.checkAndSettlePolicy(1, STRIKE_PRICE + 100);
    }
    
    function testSettlePolicyNotFound() public {
        vm.expectRevert(Cedibets.PolicyNotFound.selector);
        cedibets.checkAndSettlePolicy(999, STRIKE_PRICE + 100);
    }
    
    function testSettlePolicyAlreadySettled() public {
        // Purchase and settle policy
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        vm.warp(expirationTimestamp + 1);
        cedibets.checkAndSettlePolicy(1, STRIKE_PRICE + 100);
        
        // Try to settle again
        vm.expectRevert(Cedibets.PolicyAlreadySettled.selector);
        cedibets.checkAndSettlePolicy(1, STRIKE_PRICE + 100);
    }
    
    function testSettlePolicyInsufficientContractBalance() public {
        // Purchase policy
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        // Remove contract's USDC balance
        uint256 contractBalance = mockUSDC.balanceOf(address(cedibets));
        vm.prank(address(cedibets));
        mockUSDC.transfer(owner, contractBalance);
        
        // Fast forward time past expiration
        vm.warp(expirationTimestamp + 1);
        
        uint256 currentFuelPrice = STRIKE_PRICE + 100; // Price above strike
        
        vm.expectRevert(Cedibets.InsufficientContractBalance.selector);
        cedibets.checkAndSettlePolicy(1, currentFuelPrice);
    }
    
    // ============ Owner Functions Tests ============
    
    function testWithdrawFundsSuccess() public {
        // Purchase policy to add funds to contract
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        uint256 contractBalance = cedibets.getContractBalance();
        uint256 withdrawAmount = PREMIUM_AMOUNT;
        
        vm.expectEmit(true, false, false, true);
        emit FundsWithdrawn(owner, withdrawAmount);
        
        cedibets.withdrawFunds(withdrawAmount);
        
        assertEq(cedibets.getContractBalance(), contractBalance - withdrawAmount);
        assertEq(mockUSDC.balanceOf(owner), withdrawAmount);
    }
    
    function testWithdrawFundsOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        cedibets.withdrawFunds(1000);
    }
    
    function testWithdrawFundsInsufficientBalance() public {
        uint256 contractBalance = cedibets.getContractBalance();
        
        vm.expectRevert("Insufficient contract balance");
        cedibets.withdrawFunds(contractBalance + 1);
    }
    
    // ============ View Functions Tests ============
    
    function testGetContractBalance() public {
        uint256 expectedBalance = mockUSDC.balanceOf(address(cedibets));
        assertEq(cedibets.getContractBalance(), expectedBalance);
    }
    
    function testGetUserPoliciesEmpty() public {
        uint256[] memory userPolicies = cedibets.getUserPolicies(user1);
        assertEq(userPolicies.length, 0);
    }
    
    function testGetUserPoliciesMultiple() public {
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        
        // User1 purchases multiple policies
        vm.startPrank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        cedibets.purchasePolicy(STRIKE_PRICE + 100, expirationTimestamp);
        vm.stopPrank();
        
        uint256[] memory userPolicies = cedibets.getUserPolicies(user1);
        assertEq(userPolicies.length, 2);
        assertEq(userPolicies[0], 1);
        assertEq(userPolicies[1], 2);
    }
    
    function testGetPolicyDetails() public {
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        Cedibets.Policy memory policy = cedibets.getPolicy(1);
        assertEq(policy.id, 1);
        assertEq(policy.policyHolder, user1);
        assertEq(policy.premiumPaid, PREMIUM_AMOUNT);
        assertEq(policy.payoutAmount, PAYOUT_AMOUNT);
        assertEq(policy.strikePrice, STRIKE_PRICE);
        assertEq(policy.expirationTimestamp, expirationTimestamp);
        assertFalse(policy.settled);
    }
    
    // ============ Integration Tests ============
    
    function testCompleteWorkflow() public {
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_TIME;
        
        // 1. User purchases policy
        vm.prank(user1);
        cedibets.purchasePolicy(STRIKE_PRICE, expirationTimestamp);
        
        // 2. Verify initial state
        Cedibets.Policy memory policy = cedibets.getPolicy(1);
        assertFalse(policy.settled);
        assertEq(mockUSDC.balanceOf(user1), INITIAL_USDC_BALANCE - PREMIUM_AMOUNT);
        
        // 3. Time passes and price goes above strike
        vm.warp(expirationTimestamp + 1);
        uint256 initialBalance = mockUSDC.balanceOf(user1);
        
        // 4. Settle policy with payout
        cedibets.checkAndSettlePolicy(1, STRIKE_PRICE + 200);
        
        // 5. Verify final state
        policy = cedibets.getPolicy(1);
        assertTrue(policy.settled);
        assertEq(mockUSDC.balanceOf(user1), initialBalance + PAYOUT_AMOUNT);
        
        // 6. Owner withdraws remaining funds
        uint256 contractBalanceBefore = cedibets.getContractBalance();
        cedibets.withdrawFunds(PREMIUM_AMOUNT);
        assertEq(cedibets.getContractBalance(), contractBalanceBefore - PREMIUM_AMOUNT);
    }
    
    function testFuzzPolicyPurchase(uint256 strikePrice, uint256 timeOffset) public {
        // Bound inputs to reasonable ranges
        strikePrice = bound(strikePrice, 1, 10000); // 0.01 to 100.00 GHS
        timeOffset = bound(timeOffset, 1 days, 365 days); // 1 day to 1 year
        
        uint256 expirationTimestamp = block.timestamp + timeOffset;
        
        vm.prank(user1);
        cedibets.purchasePolicy(strikePrice, expirationTimestamp);
        
        Cedibets.Policy memory policy = cedibets.getPolicy(1);
        assertEq(policy.strikePrice, strikePrice);
        assertEq(policy.expirationTimestamp, expirationTimestamp);
        assertEq(policy.policyHolder, user1);
    }
}
