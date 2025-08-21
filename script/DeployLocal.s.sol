// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {Market} from "../src/Market.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

/**
 * @title DeployLocal
 * @dev Simple deployment script for local development without verification
 */
contract DeployLocal is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // Anvil default
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Deploying Prediction Market System (Local) ===");
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Mock USDC
        console.log("\n--- Deploying Mock USDC ---");
        MockERC20 mockUSDC = new MockERC20("USD Coin", "USDC", 6);
        console.log("Mock USDC deployed at:", address(mockUSDC));
        
        // Mint initial supply to deployer for testing
        uint256 initialSupply = 1000000 * 10**6; // 1M USDC
        mockUSDC.mint(deployer, initialSupply);
        console.log("Minted", initialSupply / 10**6, "USDC to deployer");
        
        // Deploy MarketFactory
        console.log("\n--- Deploying MarketFactory ---");
        MarketFactory factory = new MarketFactory(deployer); // Deployer as initial oracle
        console.log("MarketFactory deployed at:", address(factory));
        console.log("Default oracle:", factory.defaultOracle());
        
        // Create demo markets for Ghana use cases
        console.log("\n--- Creating Demo Markets ---");
        
        // Market 1: GHS/USD Exchange Rate
        string memory ghsQuestion = "Will GHS/USD exchange rate exceed 16.5 by December 31, 2024?";
        uint256 ghsResolutionTime = block.timestamp + 30 days; // 1 month for testing
        
        (address ghsMarket, address ghsYes, address ghsNo) = factory.createMarket(
            ghsQuestion,
            address(mockUSDC),
            address(0), // Use default oracle
            ghsResolutionTime
        );
        
        console.log("GHS/USD Market created:");
        console.log("  Market:", ghsMarket);
        console.log("  YES Token:", ghsYes);
        console.log("  NO Token:", ghsNo);
        
        // Market 2: Fuel Price
        string memory fuelQuestion = "Will Ghana national fuel price exceed 35.0 GHS/L by next NPA announcement?";
        uint256 fuelResolutionTime = block.timestamp + 7 days; // 1 week for testing
        
        (address fuelMarket, address fuelYes, address fuelNo) = factory.createMarket(
            fuelQuestion,
            address(mockUSDC),
            address(0), // Use default oracle
            fuelResolutionTime
        );
        
        console.log("Fuel Price Market created:");
        console.log("  Market:", fuelMarket);
        console.log("  YES Token:", fuelYes);
        console.log("  NO Token:", fuelNo);
        
        vm.stopBroadcast();
        
        // Save deployment information
        string memory deploymentInfo = string(abi.encodePacked(
            "{\n",
            '  "network": "local-anvil",\n',
            '  "chainId": 31337,\n',
            '  "factory": "', vm.toString(address(factory)), '",\n',
            '  "usdc": "', vm.toString(address(mockUSDC)), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "markets": {\n',
            '    "ghsUsd": "', vm.toString(ghsMarket), '",\n',
            '    "fuelPrice": "', vm.toString(fuelMarket), '"\n',
            '  },\n',
            '  "timestamp": ', vm.toString(block.timestamp), '\n',
            "}"
        ));
        
        vm.writeFile("deployment-prediction-local.json", deploymentInfo);
        
        console.log("\n=== Frontend Environment Variables ===");
        console.log("NEXT_PUBLIC_FACTORY_ADDRESS=", address(factory));
        console.log("NEXT_PUBLIC_USDC_ADDRESS=", address(mockUSDC));
        console.log("NEXT_PUBLIC_CHAIN_ID=31337");
        console.log("NEXT_PUBLIC_NETWORK_NAME=Local Anvil");
        console.log("NEXT_PUBLIC_RPC_URL=http://localhost:8545");
        
        console.log("\n=== Deployment Complete ===");
        console.log("Ready for prediction market trading!");
    }
}