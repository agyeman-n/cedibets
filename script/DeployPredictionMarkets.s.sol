// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {Market} from "../src/Market.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

/**
 * @title DeployPredictionMarkets
 * @dev Deployment script for the prediction market system
 * 
 * This script deploys:
 * 1. MarketFactory contract
 * 2. Creates initial demo markets for Ghana use cases
 * 3. Optionally deploys MockERC20 for local testing
 */
contract DeployPredictionMarkets is Script {
    mapping(uint256 => address) public usdcAddresses;
    
    constructor() {
        // Mainnet USDC addresses
        usdcAddresses[421614] = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d; // Arbitrum Sepolia
        usdcAddresses[42161] = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831; // Arbitrum One
        usdcAddresses[80001] = 0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747; // Polygon Mumbai
        usdcAddresses[137] = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174; // Polygon
        usdcAddresses[1] = 0xa0b86A33e6441b8435B662f7af8ae3f81c8D6faA; // Ethereum Mainnet
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying Prediction Market System ===");
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Determine USDC address or deploy mock
        address usdcAddress = getUsdcAddress(chainId);
        bool isLocalDeployment = false;
        
        if (usdcAddress == address(0)) {
            console.log("\n--- Deploying Mock USDC (Local/Testnet) ---");
            MockERC20 mockUSDC = new MockERC20("USD Coin", "USDC", 6);
            usdcAddress = address(mockUSDC);
            isLocalDeployment = true;
            
            console.log("Mock USDC deployed at:", usdcAddress);
            
            // Mint initial supply to deployer for testing
            uint256 initialSupply = 1000000 * 10**6; // 1M USDC
            mockUSDC.mint(deployer, initialSupply);
            console.log("Minted", initialSupply / 10**6, "USDC to deployer");
        } else {
            console.log("\n--- Using existing USDC ---");
            console.log("USDC address:", usdcAddress);
        }
        
        // Deploy MarketFactory
        console.log("\n--- Deploying MarketFactory ---");
        MarketFactory factory = new MarketFactory(deployer); // Deployer as initial oracle
        console.log("MarketFactory deployed at:", address(factory));
        console.log("Default oracle:", factory.defaultOracle());
        
        // Create demo markets for Ghana use cases
        console.log("\n--- Creating Demo Markets ---");
        
        // Market 1: GHS/USD Exchange Rate
        string memory ghsQuestion = "Will GHS/USD exchange rate exceed 15.0 by December 31, 2024?";
        uint256 ghsResolutionTime = block.timestamp + 365 days; // 1 year from now
        
        (address ghsMarket, address ghsYes, address ghsNo) = factory.createMarket(
            ghsQuestion,
            usdcAddress,
            address(0), // Use default oracle
            ghsResolutionTime
        );
        
        console.log("GHS/USD Market created:");
        console.log("  Market:", ghsMarket);
        console.log("  YES Token:", ghsYes);
        console.log("  NO Token:", ghsNo);
        console.log("  Resolution:", ghsResolutionTime);
        
        // Market 2: Fuel Price
        string memory fuelQuestion = "Will Ghana national fuel price exceed 10.0 GHS/L by June 30, 2024?";
        uint256 fuelResolutionTime = block.timestamp + 180 days; // 6 months from now
        
        (address fuelMarket, address fuelYes, address fuelNo) = factory.createMarket(
            fuelQuestion,
            usdcAddress,
            address(0), // Use default oracle
            fuelResolutionTime
        );
        
        console.log("Fuel Price Market created:");
        console.log("  Market:", fuelMarket);
        console.log("  YES Token:", fuelYes);
        console.log("  NO Token:", fuelNo);
        console.log("  Resolution:", fuelResolutionTime);
        
        // Market 3: Short-term crypto market
        string memory cryptoQuestion = "Will Bitcoin price exceed $100,000 by March 31, 2024?";
        uint256 cryptoResolutionTime = block.timestamp + 90 days; // 3 months from now
        
        (address cryptoMarket, address cryptoYes, address cryptoNo) = factory.createMarket(
            cryptoQuestion,
            usdcAddress,
            address(0), // Use default oracle
            cryptoResolutionTime
        );
        
        console.log("Bitcoin Price Market created:");
        console.log("  Market:", cryptoMarket);
        console.log("  YES Token:", cryptoYes);
        console.log("  NO Token:", cryptoNo);
        console.log("  Resolution:", cryptoResolutionTime);
        
        vm.stopBroadcast();
        
        // Save deployment information
        _saveDeploymentInfo(
            chainId,
            address(factory),
            usdcAddress,
            deployer,
            isLocalDeployment,
            ghsMarket,
            fuelMarket,
            cryptoMarket
        );
        
        // Verify deployment if on supported network
        if (!isLocalDeployment) {
            _verifyDeployment(address(factory));
        }
        
        _printUsageInstructions(address(factory), usdcAddress, isLocalDeployment);
    }
    
    function getUsdcAddress(uint256 chainId) public view returns (address) {
        return usdcAddresses[chainId];
    }
    
    function _saveDeploymentInfo(
        uint256 chainId,
        address factory,
        address usdc,
        address deployer,
        bool isLocal,
        address ghsMarket,
        address fuelMarket,
        address cryptoMarket
    ) internal {
        string memory deploymentInfo = string(abi.encodePacked(
            "{\n",
            '  "network": "', isLocal ? "local-anvil" : _getNetworkName(chainId), '",\n',
            '  "chainId": ', vm.toString(chainId), ',\n',
            '  "factory": "', vm.toString(factory), '",\n',
            '  "usdc": "', vm.toString(usdc), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "isLocal": ', isLocal ? "true" : "false", ',\n',
            '  "markets": {\n',
            '    "ghsUsd": "', vm.toString(ghsMarket), '",\n',
            '    "fuelPrice": "', vm.toString(fuelMarket), '",\n',
            '    "bitcoin": "', vm.toString(cryptoMarket), '"\n',
            '  },\n',
            '  "timestamp": ', vm.toString(block.timestamp), ',\n',
            '  "blockNumber": ', vm.toString(block.number), '\n',
            "}"
        ));
        
        string memory filename = isLocal ? "deployment-prediction-local.json" : "deployment-prediction.json";
        vm.writeFile(filename, deploymentInfo);
        console.log("\n--- Deployment Info Saved ---");
        console.log("File:", filename);
    }
    
    function _verifyDeployment(address factory) internal {
        console.log("\n--- Verifying Deployment ---");
        console.log("Note: Run the following command to verify on Etherscan:");
        console.log("forge verify-contract", factory, "src/MarketFactory.sol:MarketFactory --chain-id", block.chainid);
    }
    
    function _getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "ethereum";
        if (chainId == 42161) return "arbitrum";
        if (chainId == 421614) return "arbitrum-sepolia";
        if (chainId == 137) return "polygon";
        if (chainId == 80001) return "mumbai";
        return "unknown";
    }
    
    function _printUsageInstructions(address factory, address usdc, bool isLocal) internal view {
        console.log("\n=== Usage Instructions ===");
        
        if (isLocal) {
            console.log("1. Frontend Environment Variables:");
            console.log("   NEXT_PUBLIC_FACTORY_ADDRESS=", factory);
            console.log("   NEXT_PUBLIC_USDC_ADDRESS=", usdc);
            console.log("   NEXT_PUBLIC_CHAIN_ID=", block.chainid);
            console.log("   NEXT_PUBLIC_NETWORK_NAME=Local Anvil");
            
            console.log("\n2. Testing Commands:");
            console.log("   - Check factory:", "cast call", factory, "getMarketsCount() --rpc-url http://localhost:8545");
            console.log("   - Get markets:", "cast call", factory, "getAllMarkets() --rpc-url http://localhost:8545");
        } else {
            console.log("1. Frontend Environment Variables:");
            console.log("   NEXT_PUBLIC_FACTORY_ADDRESS=", factory);
            console.log("   NEXT_PUBLIC_USDC_ADDRESS=", usdc);
            console.log("   NEXT_PUBLIC_CHAIN_ID=", block.chainid);
            
            console.log("\n2. Verification:");
            console.log("   Run contract verification after deployment");
        }
        
        console.log("\n3. Oracle Setup:");
        console.log("   - Update oracle address if needed:", "cast send", factory, "updateDefaultOracle(address)" );
        console.log("   - Current oracle:", MarketFactory(factory).defaultOracle());
        
        console.log("\n4. Market Interaction:");
        console.log("   - Add liquidity to markets to enable trading");
        console.log("   - Use the frontend to interact with markets");
        console.log("   - Markets will be resolvable after their resolution timestamp");
        
        console.log("\nDeployment complete! Ready for prediction market trading.");
    }
}
