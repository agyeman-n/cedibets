// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {Market} from "../src/Market.sol";
import {OutcomeToken} from "../src/OutcomeToken.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MarketFactoryTest is Test {
    MarketFactory public factory;
    MockERC20 public usdc;
    address public oracle;
    address public user1;
    address public user2;
    
    uint256 constant INITIAL_USDC_BALANCE = 10000 * 10**6; // 10,000 USDC
    
    event MarketCreated(
        address indexed market,
        string question,
        address indexed collateralToken,
        address indexed oracle,
        uint256 resolutionTimestamp,
        address yesToken,
        address noToken
    );
    
    event DefaultOracleUpdated(address indexed oldOracle, address indexed newOracle);
    
    function setUp() public {
        oracle = makeAddr("oracle");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy mock USDC
        usdc = new MockERC20("USD Coin", "USDC", 6);
        
        // Deploy factory
        factory = new MarketFactory(oracle);
        
        // Mint USDC to users
        usdc.mint(user1, INITIAL_USDC_BALANCE);
        usdc.mint(user2, INITIAL_USDC_BALANCE);
    }
    
    function testCreateMarket() public {
        string memory question = "Will GHS/USD exceed 15.0 by Dec 31, 2024?";
        uint256 resolutionTime = block.timestamp + 30 days;
        
        (address market, address yesToken, address noToken) = factory.createMarket(
            question,
            address(usdc),
            address(0), // Use default oracle
            resolutionTime
        );
        
        // Verify market was created
        assertEq(factory.getMarketsCount(), 1);
        assertEq(factory.markets(0), market);
        assertTrue(factory.isValidMarket(market));
        
        // Verify market properties
        Market marketContract = Market(market);
        assertEq(marketContract.question(), question);
        assertEq(marketContract.oracle(), oracle);
        assertEq(marketContract.resolutionTimestamp(), resolutionTime);
        assertEq(address(marketContract.collateralToken()), address(usdc));
        assertEq(address(marketContract.yesToken()), yesToken);
        assertEq(address(marketContract.noToken()), noToken);
        assertEq(uint(marketContract.state()), uint(Market.State.Open));
        
        // Verify tokens
        OutcomeToken yesTokenContract = OutcomeToken(yesToken);
        OutcomeToken noTokenContract = OutcomeToken(noToken);
        
        assertTrue(yesTokenContract.isYesToken());
        assertFalse(noTokenContract.isYesToken());
        assertEq(yesTokenContract.owner(), market);
        assertEq(noTokenContract.owner(), market);
    }
    
    function testCreateMarketWithCustomOracle() public {
        address customOracle = makeAddr("customOracle");
        string memory question = "Will fuel price exceed 10 GHS/L by Jan 2025?";
        uint256 resolutionTime = block.timestamp + 60 days;
        
        (address market, , ) = factory.createMarket(
            question,
            address(usdc),
            customOracle,
            resolutionTime
        );
        
        Market marketContract = Market(market);
        assertEq(marketContract.oracle(), customOracle);
    }
    
    function test_RevertWhen_ResolutionTimeTooSoon() public {
        vm.expectRevert("Invalid resolution timestamp");
        factory.createMarket(
            "Test question",
            address(usdc),
            address(0),
            block.timestamp + 30 minutes // Less than MIN_RESOLUTION_TIME
        );
    }
    
    function test_RevertWhen_ResolutionTimeTooFarInFuture() public {
        vm.expectRevert("Invalid resolution timestamp");
        factory.createMarket(
            "Test question",
            address(usdc),
            address(0),
            block.timestamp + 400 days // More than MAX_RESOLUTION_TIME
        );
    }
    
    function test_RevertWhen_EmptyQuestion() public {
        vm.expectRevert("Question cannot be empty");
        factory.createMarket(
            "",
            address(usdc),
            address(0),
            block.timestamp + 30 days
        );
    }
    
    function test_RevertWhen_ZeroCollateralAddress() public {
        vm.expectRevert("Collateral token cannot be zero address");
        factory.createMarket(
            "Test question",
            address(0),
            address(0),
            block.timestamp + 30 days
        );
    }
    
    function testGetMarkets() public {
        // Create multiple markets
        for (uint i = 0; i < 5; i++) {
            factory.createMarket(
                string(abi.encodePacked("Question ", vm.toString(i))),
                address(usdc),
                address(0),
                block.timestamp + 30 days
            );
        }
        
        assertEq(factory.getMarketsCount(), 5);
        
        // Test getAllMarkets
        address[] memory allMarkets = factory.getAllMarkets();
        assertEq(allMarkets.length, 5);
        
        // Test getMarkets with range
        address[] memory someMarkets = factory.getMarkets(1, 4);
        assertEq(someMarkets.length, 3);
        assertEq(someMarkets[0], factory.markets(1));
        assertEq(someMarkets[1], factory.markets(2));
        assertEq(someMarkets[2], factory.markets(3));
    }
    
    function testGetMarketsByState() public {
        // Create a market
        (address market1, , ) = factory.createMarket(
            "Question 1",
            address(usdc),
            address(0),
            block.timestamp + 1 hours
        );
        
        (address market2, , ) = factory.createMarket(
            "Question 2",
            address(usdc),
            address(0),
            block.timestamp + 1 hours
        );
        
        // All markets should be Open initially
        address[] memory openMarkets = factory.getMarketsByState(Market.State.Open);
        assertEq(openMarkets.length, 2);
        
        // Resolve one market
        vm.warp(block.timestamp + 2 hours);
        vm.prank(oracle);
        Market(market1).resolveMarket(true);
        
        // Check states
        openMarkets = factory.getMarketsByState(Market.State.Open);
        assertEq(openMarkets.length, 1);
        assertEq(openMarkets[0], market2);
        
        address[] memory resolvedMarkets = factory.getMarketsByState(Market.State.Resolved);
        assertEq(resolvedMarkets.length, 1);
        assertEq(resolvedMarkets[0], market1);
    }
    
    function testGetResolvableMarkets() public {
        uint256 shortTime = block.timestamp + 1 hours;
        uint256 longTime = block.timestamp + 7 days;
        
        // Create markets with different resolution times
        (address market1, , ) = factory.createMarket(
            "Question 1",
            address(usdc),
            address(0),
            shortTime
        );
        
        factory.createMarket(
            "Question 2",
            address(usdc),
            address(0),
            longTime
        );
        
        // Initially no markets are resolvable
        address[] memory resolvable = factory.getResolvableMarkets();
        assertEq(resolvable.length, 0);
        
        // Move time forward
        vm.warp(shortTime + 1);
        
        // Now one market should be resolvable
        resolvable = factory.getResolvableMarkets();
        assertEq(resolvable.length, 1);
        assertEq(resolvable[0], market1);
        
        // Resolve the market
        vm.prank(oracle);
        Market(market1).resolveMarket(true);
        
        // No longer resolvable
        resolvable = factory.getResolvableMarkets();
        assertEq(resolvable.length, 0);
    }
    
    function testUpdateDefaultOracle() public {
        address newOracle = makeAddr("newOracle");
        
        vm.expectEmit(true, true, false, false);
        emit DefaultOracleUpdated(oracle, newOracle);
        
        factory.updateDefaultOracle(newOracle);
        assertEq(factory.defaultOracle(), newOracle);
        
        // Test that new markets use the new default oracle
        (address market, , ) = factory.createMarket(
            "Test question",
            address(usdc),
            address(0), // Use default
            block.timestamp + 30 days
        );
        
        assertEq(Market(market).oracle(), newOracle);
    }
    
    function test_RevertWhen_UpdateDefaultOracleZeroAddress() public {
        vm.expectRevert("Oracle cannot be zero address");
        factory.updateDefaultOracle(address(0));
    }
    
    function test_RevertWhen_UpdateDefaultOracleNotOwner() public {
        vm.expectRevert();
        vm.prank(user1);
        factory.updateDefaultOracle(makeAddr("newOracle"));
    }
    
    function testGetMarketByIndex() public {
        string memory question = "Test question";
        uint256 resolutionTime = block.timestamp + 30 days;
        
        (address expectedMarket, , ) = factory.createMarket(
            question,
            address(usdc),
            address(0),
            resolutionTime
        );
        
        (
            address market,
            string memory returnedQuestion,
            Market.State state,
            uint256 returnedResolutionTime,
            address returnedOracle,
            address collateralToken,
            address yesToken,
            address noToken,
            uint256 totalLiquidity
        ) = factory.getMarketByIndex(0);
        
        assertEq(market, expectedMarket);
        assertEq(returnedQuestion, question);
        assertEq(uint(state), uint(Market.State.Open));
        assertEq(returnedResolutionTime, resolutionTime);
        assertEq(returnedOracle, oracle);
        assertEq(collateralToken, address(usdc));
        assertEq(totalLiquidity, 0);
    }
    
    function test_RevertWhen_GetMarketByIndexOutOfBounds() public {
        vm.expectRevert("Market index out of bounds");
        factory.getMarketByIndex(0); // No markets created yet
    }
}
