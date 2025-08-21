// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {Market} from "../src/Market.sol";
import {OutcomeToken} from "../src/OutcomeToken.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MarketTest is Test {
    MarketFactory public factory;
    Market public market;
    MockERC20 public usdc;
    OutcomeToken public yesToken;
    OutcomeToken public noToken;
    
    address public oracle;
    address public user1;
    address public user2;
    address public liquidityProvider;
    
    uint256 constant INITIAL_USDC_BALANCE = 100000 * 10**6; // 100,000 USDC
    uint256 constant LIQUIDITY_AMOUNT = 10000 * 10**6; // 10,000 USDC
    
    event LiquidityAdded(address indexed provider, uint256 amount);
    event TokensPurchased(address indexed buyer, address indexed token, uint256 amountIn, uint256 tokensOut);
    event TokensSold(address indexed seller, address indexed token, uint256 tokensIn, uint256 amountOut);
    event MarketResolved(bool isYesOutcome, address winningToken);
    event TokensRedeemed(address indexed user, uint256 amount);
    
    function setUp() public {
        oracle = makeAddr("oracle");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        liquidityProvider = makeAddr("liquidityProvider");
        
        // Deploy mock USDC
        usdc = new MockERC20("USD Coin", "USDC", 6);
        
        // Deploy factory
        factory = new MarketFactory(oracle);
        
        // Create a market
        string memory question = "Will GHS/USD exceed 15.0 by Dec 31, 2024?";
        uint256 resolutionTime = block.timestamp + 30 days;
        
        (address marketAddress, address yesTokenAddress, address noTokenAddress) = factory.createMarket(
            question,
            address(usdc),
            address(0), // Use default oracle
            resolutionTime
        );
        
        market = Market(marketAddress);
        yesToken = OutcomeToken(yesTokenAddress);
        noToken = OutcomeToken(noTokenAddress);
        
        // Mint USDC to users
        usdc.mint(user1, INITIAL_USDC_BALANCE);
        usdc.mint(user2, INITIAL_USDC_BALANCE);
        usdc.mint(liquidityProvider, INITIAL_USDC_BALANCE);
    }
    
    function testAddLiquidity() public {
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        
        vm.expectEmit(true, false, false, true);
        emit LiquidityAdded(liquidityProvider, LIQUIDITY_AMOUNT);
        
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        // Check balances
        assertEq(yesToken.balanceOf(liquidityProvider), LIQUIDITY_AMOUNT);
        assertEq(noToken.balanceOf(liquidityProvider), LIQUIDITY_AMOUNT);
        assertEq(usdc.balanceOf(address(market)), LIQUIDITY_AMOUNT);
        assertEq(market.totalLiquidity(), LIQUIDITY_AMOUNT);
        
        // Check total supplies
        assertEq(yesToken.totalSupply(), LIQUIDITY_AMOUNT);
        assertEq(noToken.totalSupply(), LIQUIDITY_AMOUNT);
    }
    
    function testBuyYesTokens() public {
        // Add initial liquidity
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        // User1 buys YES tokens
        uint256 buyAmount = 1000 * 10**6; // 1000 USDC
        vm.startPrank(user1);
        usdc.approve(address(market), buyAmount);
        
        uint256 initialYesBalance = yesToken.balanceOf(user1);
        uint256 initialUsdcBalance = usdc.balanceOf(user1);
        
        vm.expectEmit(true, true, false, false);
        emit TokensPurchased(user1, address(yesToken), buyAmount, 0); // We don't know exact amount
        
        market.buy(address(yesToken), buyAmount);
        vm.stopPrank();
        
        // Check that user received YES tokens
        assertTrue(yesToken.balanceOf(user1) > initialYesBalance);
        assertEq(usdc.balanceOf(user1), initialUsdcBalance - buyAmount);
        
        // Check that price changed (YES price should decrease because more YES tokens exist)
        (uint256 yesPrice, uint256 noPrice) = market.getCurrentPrices();
        assertTrue(yesPrice < 5e17); // Less than 0.5 (more YES tokens = lower price)
        assertTrue(noPrice > 5e17); // Greater than 0.5 (fewer NO tokens = higher price)
        // Should sum to 1 (allow small rounding error)
        uint256 totalPrice = yesPrice + noPrice;
        assertTrue(totalPrice >= 1e18 - 1 && totalPrice <= 1e18 + 1);
    }
    
    function testBuyNoTokens() public {
        // Add initial liquidity
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        // User1 buys NO tokens
        uint256 buyAmount = 1000 * 10**6; // 1000 USDC
        vm.startPrank(user1);
        usdc.approve(address(market), buyAmount);
        
        market.buy(address(noToken), buyAmount);
        vm.stopPrank();
        
        // Check that price changed (NO price should decrease because more NO tokens exist)
        (uint256 yesPrice, uint256 noPrice) = market.getCurrentPrices();
        assertTrue(noPrice < 5e17); // Less than 0.5 (more NO tokens = lower price)
        assertTrue(yesPrice > 5e17); // Greater than 0.5 (fewer YES tokens = higher price)
        // Should sum to 1 (allow small rounding error)
        uint256 totalPrice = yesPrice + noPrice;
        assertTrue(totalPrice >= 1e18 - 1 && totalPrice <= 1e18 + 1);
    }
    
    function testSellTokens() public {
        // Add initial liquidity
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        // User1 buys YES tokens
        uint256 buyAmount = 2000 * 10**6; // 2000 USDC
        vm.startPrank(user1);
        usdc.approve(address(market), buyAmount);
        market.buy(address(yesToken), buyAmount);
        
        // Now sell half of the YES tokens
        uint256 yesBalance = yesToken.balanceOf(user1);
        uint256 sellAmount = yesBalance / 2;
        uint256 initialUsdcBalance = usdc.balanceOf(user1);
        
        vm.expectEmit(true, true, false, false);
        emit TokensSold(user1, address(yesToken), sellAmount, 0); // We don't know exact amount
        
        market.sell(address(yesToken), sellAmount);
        vm.stopPrank();
        
        // Check that user received USDC back
        assertTrue(usdc.balanceOf(user1) > initialUsdcBalance);
        assertEq(yesToken.balanceOf(user1), yesBalance - sellAmount);
    }
    
    function testResolveMarket() public {
        // Market should start as Open
        assertEq(uint(market.state()), uint(Market.State.Open));
        
        // Fast forward past resolution time
        vm.warp(block.timestamp + 31 days);
        
        vm.expectEmit(true, false, false, true);
        emit MarketResolved(true, address(yesToken));
        
        vm.prank(oracle);
        market.resolveMarket(true); // YES wins
        
        // Check market state
        assertEq(uint(market.state()), uint(Market.State.Resolved));
        assertEq(market.winningToken(), address(yesToken));
    }
    
    function testRedeemWinningTokens() public {
        // Add liquidity and buy some YES tokens
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        uint256 buyAmount = 1000 * 10**6;
        vm.startPrank(user1);
        usdc.approve(address(market), buyAmount);
        market.buy(address(yesToken), buyAmount);
        vm.stopPrank();
        
        uint256 yesBalance = yesToken.balanceOf(user1);
        
        // Resolve market with YES winning
        vm.warp(block.timestamp + 31 days);
        vm.prank(oracle);
        market.resolveMarket(true);
        
        // Redeem winning tokens
        uint256 initialUsdcBalance = usdc.balanceOf(user1);
        
        vm.expectEmit(true, false, false, true);
        emit TokensRedeemed(user1, yesBalance);
        
        vm.prank(user1);
        market.redeem();
        
        // Check redemption
        assertEq(yesToken.balanceOf(user1), 0); // Tokens burned
        assertEq(usdc.balanceOf(user1), initialUsdcBalance + yesBalance); // USDC received 1:1
    }
    
    function test_RevertWhen_BuyInvalidToken() public {
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        vm.startPrank(user1);
        usdc.approve(address(market), 1000 * 10**6);
        vm.expectRevert("Invalid token");
        market.buy(address(usdc), 1000 * 10**6); // Invalid token
        vm.stopPrank();
    }
    
    function test_RevertWhen_BuyAfterResolution() public {
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        // Resolve market
        vm.warp(block.timestamp + 31 days);
        vm.prank(oracle);
        market.resolveMarket(true);
        
        // Try to buy after resolution
        vm.startPrank(user1);
        usdc.approve(address(market), 1000 * 10**6);
        vm.expectRevert("Market not open");
        market.buy(address(yesToken), 1000 * 10**6);
        vm.stopPrank();
    }
    
    function test_RevertWhen_ResolveNotOracle() public {
        vm.warp(block.timestamp + 31 days);
        vm.expectRevert("Only oracle can resolve");
        vm.prank(user1); // Not oracle
        market.resolveMarket(true);
    }
    
    function test_RevertWhen_ResolveTooEarly() public {
        vm.expectRevert("Resolution time not reached");
        vm.prank(oracle);
        market.resolveMarket(true); // Before resolution time
    }
    
    function test_RevertWhen_RedeemUnresolvedMarket() public {
        vm.expectRevert("Market not resolved");
        vm.prank(user1);
        market.redeem(); // Market not resolved
    }
    
    function test_RevertWhen_RedeemNoTokens() public {
        // Resolve market
        vm.warp(block.timestamp + 31 days);
        vm.prank(oracle);
        market.resolveMarket(true);
        
        // Try to redeem with no tokens
        vm.expectRevert("No winning tokens to redeem");
        vm.prank(user1);
        market.redeem();
    }
    
    function testGetCurrentPricesNoLiquidity() public {
        (uint256 yesPrice, uint256 noPrice) = market.getCurrentPrices();
        assertEq(yesPrice, 5e17); // 0.5
        assertEq(noPrice, 5e17); // 0.5
    }
    
    function testPriceMovement() public {
        // Add liquidity
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        // Initial prices should be 0.5/0.5
        (uint256 yesPrice, uint256 noPrice) = market.getCurrentPrices();
        assertEq(yesPrice, 5e17);
        assertEq(noPrice, 5e17);
        
        // Buy YES tokens - should decrease YES price
        vm.startPrank(user1);
        usdc.approve(address(market), 5000 * 10**6);
        market.buy(address(yesToken), 5000 * 10**6);
        vm.stopPrank();
        
        (yesPrice, noPrice) = market.getCurrentPrices();
        assertTrue(yesPrice < 5e17); // YES price decreases
        assertTrue(noPrice > 5e17); // NO price increases
        
        // Buy NO tokens - should decrease NO price and increase YES price
        vm.startPrank(user2);
        usdc.approve(address(market), 7000 * 10**6);
        market.buy(address(noToken), 7000 * 10**6);
        vm.stopPrank();
        
        (yesPrice, noPrice) = market.getCurrentPrices();
        // After buying more NO tokens, NO price should be lower than YES price
        assertTrue(noPrice < yesPrice);
    }
    
    function testTradingFees() public {
        // Add liquidity
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        uint256 buyAmount = 1000 * 10**6;
        uint256 initialAccumulatedFees = market.accumulatedFees();
        
        // Buy tokens
        vm.startPrank(user1);
        usdc.approve(address(market), buyAmount);
        market.buy(address(yesToken), buyAmount);
        vm.stopPrank();
        
        // Check that fees were collected
        uint256 expectedFee = (buyAmount * market.TRADING_FEE()) / market.FEE_DENOMINATOR();
        assertEq(market.accumulatedFees(), initialAccumulatedFees + expectedFee);
    }
    
    function testWithdrawFees() public {
        // Add liquidity and trade to accumulate fees
        vm.startPrank(liquidityProvider);
        usdc.approve(address(market), LIQUIDITY_AMOUNT);
        market.addLiquidity(LIQUIDITY_AMOUNT);
        vm.stopPrank();
        
        vm.startPrank(user1);
        usdc.approve(address(market), 1000 * 10**6);
        market.buy(address(yesToken), 1000 * 10**6);
        vm.stopPrank();
        
        uint256 accumulatedFees = market.accumulatedFees();
        assertTrue(accumulatedFees > 0);
        
        // Withdraw fees (as factory owner)
        uint256 initialFactoryBalance = usdc.balanceOf(address(factory));
        vm.prank(address(factory));
        market.withdrawFees();
        
        assertEq(market.accumulatedFees(), 0);
        assertEq(usdc.balanceOf(address(factory)), initialFactoryBalance + accumulatedFees);
    }
    
    function test_RevertWhen_WithdrawFeesNotOwner() public {
        vm.expectRevert();
        vm.prank(user1);
        market.withdrawFees();
    }
}
