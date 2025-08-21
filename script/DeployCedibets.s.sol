// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Cedibets} from "../src/Cedibets.sol";

/**
 * @title DeployCedibets
 * @dev Deployment script for the Cedibets smart contract
 * 
 * This script deploys the Cedibets contract to the specified network.
 * 
 * USAGE:
 * 1. Set your private key: export PRIVATE_KEY=your_private_key_here
 * 2. Set RPC URL: export ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
 * 3. Set Etherscan API key: export ETHERSCAN_API_KEY=your_etherscan_key
 * 4. Run deployment: forge script script/DeployCedibets.s.sol --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast --verify
 * 
 * NETWORK CONFIGURATIONS:
 * - Arbitrum Sepolia (Testnet): Chain ID 421614
 * - Arbitrum One (Mainnet): Chain ID 42161
 * 
 * IMPORTANT NOTES:
 * - Ensure you have sufficient ETH for deployment gas fees
 * - Verify the USDC token address for your target network
 * - Keep your private key secure and never commit it to version control
 */
contract DeployCedibets is Script {
    
    // ============ State Variables ============
    
    /// @notice USDC token addresses for different networks
    mapping(uint256 => address) public usdcAddresses;
    
    // ============ Constructor ============
    
    constructor() {
        // Initialize USDC addresses for different networks
        // Arbitrum Sepolia (Testnet)
        usdcAddresses[421614] = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
        
        // Arbitrum One (Mainnet) - Update with actual USDC address
        usdcAddresses[42161] = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
        
        // Add more networks as needed
        // Polygon Mumbai (Testnet)
        usdcAddresses[80001] = 0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747;
        
        // Polygon (Mainnet)
        usdcAddresses[137] = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Main deployment function
     * @dev Deploys the Cedibets contract with the appropriate USDC address for the current network
     * @return cedibets The deployed Cedibets contract address
     */
    function run() external returns (Cedibets cedibets) {
        // Get deployment parameters
        uint256 chainId = block.chainid;
        address usdcToken = getUsdcAddress(chainId);
        
        // Log deployment information
        console.log("=== Cedibets Deployment ===");
        console.log("Chain ID:", chainId);
        console.log("USDC Token Address:", usdcToken);
        console.log("Deployer Address:", msg.sender);
        
        // Validate USDC address
        require(usdcToken != address(0), "Invalid USDC address for this network");
        
        // Start deployment transaction
        vm.startBroadcast();
        
        // Deploy Cedibets contract
        cedibets = new Cedibets(usdcToken);
        
        vm.stopBroadcast();
        
        // Log deployment results
        console.log("=== Deployment Complete ===");
        console.log("Cedibets Contract Address:", address(cedibets));
        
        // Verify deployment
        verifyDeployment(address(cedibets), usdcToken);
        
        return cedibets;
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Get USDC address for the specified chain ID
     * @param _chainId The chain ID to get USDC address for
     * @return The USDC token address for the specified network
     */
    function getUsdcAddress(uint256 _chainId) internal view returns (address) {
        address usdcAddress = usdcAddresses[_chainId];
        require(usdcAddress != address(0), "USDC address not configured for this network");
        return usdcAddress;
    }
    
    /**
     * @notice Verify the deployment by checking contract state
     * @param _cedibetsAddress The deployed Cedibets contract address
     * @param _usdcAddress The USDC token address used in deployment
     */
    function verifyDeployment(address _cedibetsAddress, address _usdcAddress) internal view {
        Cedibets cedibets = Cedibets(_cedibetsAddress);
        
        // Verify USDC token address
        address storedUsdc = address(cedibets.USDC_TOKEN());
        require(storedUsdc == _usdcAddress, "USDC address mismatch");
        
        // Verify contract constants
        uint256 premiumAmount = cedibets.PREMIUM_AMOUNT();
        uint256 payoutAmount = cedibets.PAYOUT_AMOUNT();
        
        console.log("=== Deployment Verification ===");
        console.log("USDC Token Address (verified):", storedUsdc);
        console.log("Premium Amount:", premiumAmount);
        console.log("Payout Amount:", payoutAmount);
        console.log("Policy Counter:", cedibets.policyCounter());
        
        console.log("Deployment verification successful!");
    }
}

/**
 * @title DeployCedibetsWithCustomUSDC
 * @dev Alternative deployment script for custom USDC addresses
 * 
 * Use this script when you need to deploy with a different USDC address
 * than the default ones configured in DeployCedibets.
 */
contract DeployCedibetsWithCustomUSDC is Script {
    
    /**
     * @notice Deploy with custom USDC address
     * @param _usdcAddress The custom USDC token address to use
     * @return cedibets The deployed Cedibets contract address
     */
    function run(address _usdcAddress) external returns (Cedibets cedibets) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        
        console.log("=== Custom USDC Deployment ===");
        console.log("Custom USDC Address:", _usdcAddress);
        console.log("Deployer Address:", msg.sender);
        
        vm.startBroadcast();
        
        cedibets = new Cedibets(_usdcAddress);
        
        vm.stopBroadcast();
        
        console.log("=== Deployment Complete ===");
        console.log("Cedibets Contract Address:", address(cedibets));
        
        return cedibets;
    }
}
