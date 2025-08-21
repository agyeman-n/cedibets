# Local Development Guide

This guide will help you run and test the entire Cedibets platform locally on your laptop.

## 🚀 Quick Start

### 1. Start Local Blockchain

```bash
# Start Anvil (local Ethereum node)
anvil
```

This will start a local blockchain at `http://localhost:8545` with 10 pre-funded accounts.

### 2. Deploy Smart Contract Locally

```bash
# In a new terminal, deploy the contract
forge script script/DeployCedibets.s.sol \
    --rpc-url http://localhost:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --broadcast
```

### 3. Start Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Create local environment file
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
# Local Development Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_CEDIBETS_ADDRESS=YOUR_LOCAL_CONTRACT_ADDRESS
NEXT_PUBLIC_USDC_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Local Anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 📋 Detailed Setup Instructions

### Step 1: Environment Setup

#### Install Dependencies
```bash
# Install Foundry dependencies
forge install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### Verify Installation
```bash
# Check Foundry
forge --version
cast --version
anvil --version

# Check Node.js
node --version
npm --version
```

### Step 2: Local Blockchain Setup

#### Start Anvil
```bash
# Start local blockchain with custom configuration
anvil \
    --port 8545 \
    --accounts 10 \
    --balance 10000 \
    --gas-limit 30000000 \
    --gas-price 1000000000 \
    --block-time 1
```

**Anvil Configuration Options:**
- `--port 8545`: Port for the local blockchain
- `--accounts 10`: Number of pre-funded accounts
- `--balance 10000`: ETH balance per account (in ETH)
- `--gas-limit 30000000`: Gas limit for blocks
- `--gas-price 1000000000`: Gas price (1 gwei)
- `--block-time 1`: Block time in seconds

#### Anvil Output
You'll see output like this:
```
Available Accounts
==================
(0) "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

(1) "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...

Listening on 127.0.0.1:8545
```

**Save these details!** You'll need the private keys for testing.

### Step 3: Deploy Smart Contract Locally

#### Create Deployment Script
```bash
# Create a local deployment script
cat > script/DeployLocal.s.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Cedibets} from "../src/Cedibets.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

contract DeployLocal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to local Anvil network...");
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock USDC first
        MockERC20 mockUSDC = new MockERC20();
        console.log("Mock USDC deployed at:", address(mockUSDC));
        
        // Deploy Cedibets with mock USDC
        Cedibets cedibets = new Cedibets(address(mockUSDC));
        console.log("Cedibets deployed at:", address(cedibets));
        
        vm.stopBroadcast();
        
        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "{\n",
            '  "network": "local-anvil",\n',
            '  "chainId": 31337,\n',
            '  "cedibets": "', vm.toString(address(cedibets)), '",\n',
            '  "usdc": "', vm.toString(address(mockUSDC)), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "timestamp": ', vm.toString(block.timestamp), "\n",
            "}"
        ));
        
        vm.writeFile("deployment-local.json", deploymentInfo);
        console.log("Deployment info saved to deployment-local.json");
        
        // Print configuration for frontend
        console.log("\n=== Frontend Configuration ===");
        console.log("Add these to your frontend/.env.local:");
        console.log("NEXT_PUBLIC_CEDIBETS_ADDRESS=", vm.toString(address(cedibets)));
        console.log("NEXT_PUBLIC_USDC_ADDRESS=", vm.toString(address(mockUSDC)));
        console.log("NEXT_PUBLIC_CHAIN_ID=31337");
        console.log("NEXT_PUBLIC_RPC_URL=http://localhost:8545");
    }
}
EOF
```

#### Deploy Contracts
```bash
# Set private key (use the first Anvil account)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy contracts
forge script script/DeployLocal.s.sol \
    --rpc-url http://localhost:8545 \
    --broadcast
```

### Step 4: Configure Frontend for Local Development

#### Update Environment Variables
```bash
cd frontend

# Create environment file
cat > .env.local << 'EOF'
# Local Development Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Contract Addresses (update with your deployed addresses)
NEXT_PUBLIC_CEDIBETS_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_USDC_ADDRESS=YOUR_DEPLOYED_USDC_ADDRESS

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Local Anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545

# App Configuration
NEXT_PUBLIC_APP_NAME=Cedibets (Local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development
NEXT_PUBLIC_DEBUG=true
EOF
```

#### Update Contract Configuration
Edit `frontend/lib/contract.ts` to support local network:

```typescript
// Add local network configuration
export const SUPPORTED_CHAINS = {
  localAnvil: {
    id: 31337,
    name: 'Local Anvil',
    network: 'local-anvil',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['http://localhost:8545'],
      },
      public: {
        http: ['http://localhost:8545'],
      },
    },
    blockExplorers: {
      default: { name: 'Local', url: 'http://localhost:8545' },
    },
    testnet: true,
  },
  arbitrumSepolia: {
    // ... existing configuration
  },
} as const
```

### Step 5: Start Frontend Development Server

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 🧪 Testing Locally

### Smart Contract Testing

#### Run All Tests
```bash
# Test against local network
forge test --fork-url http://localhost:8545

# Test with verbosity
forge test --fork-url http://localhost:8545 -vvv
```

#### Test Specific Functions
```bash
# Test policy purchase
forge test --match-test testPurchasePolicy --fork-url http://localhost:8545

# Test policy settlement
forge test --match-test testSettlePolicy --fork-url http://localhost:8545
```

### Frontend Testing

#### Manual Testing
1. **Authentication**: Test Privy login flow
2. **Wallet Connection**: Verify wallet connects to local network
3. **USDC Balance**: Check if mock USDC balance displays
4. **Policy Purchase**: Test complete purchase flow
5. **Dashboard**: Verify policy management

#### Automated Testing
```bash
# Run frontend tests
npm run test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Integration Testing

#### Test Complete User Flow
1. **Setup**: Ensure Anvil and contracts are running
2. **Login**: Use Privy to authenticate
3. **Get USDC**: Use mock USDC faucet or mint function
4. **Purchase Policy**: Buy a fuel price protection policy
5. **View Dashboard**: Check policy appears in dashboard
6. **Settle Policy**: Test manual settlement (for now)

## 🔧 Development Tools

### Foundry Tools

#### Cast (Command Line Interface)
```bash
# Check contract state
cast call YOUR_CONTRACT_ADDRESS "owner()" --rpc-url http://localhost:8545

# Check USDC balance
cast call YOUR_USDC_ADDRESS "balanceOf(address)" YOUR_ADDRESS --rpc-url http://localhost:8545

# Send transaction
cast send YOUR_CONTRACT_ADDRESS "functionName()" --private-key YOUR_PRIVATE_KEY --rpc-url http://localhost:8545
```

#### Anvil (Local Blockchain)
```bash
# Start with custom configuration
anvil --port 8545 --accounts 10 --balance 10000

# Reset blockchain (clears all data)
anvil --port 8545 --accounts 10 --balance 10000 --init
```

### Browser Tools

#### MetaMask Configuration
1. Add local network to MetaMask:
   - Network Name: `Local Anvil`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import Anvil accounts using private keys

#### Browser Console
```javascript
// Check if contracts are loaded
window.ethereum.request({ method: 'eth_chainId' })

// Check account balance
window.ethereum.request({ 
  method: 'eth_getBalance', 
  params: ['YOUR_ADDRESS', 'latest'] 
})
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Anvil Not Starting
```bash
# Check if port is in use
lsof -i :8545

# Kill process if needed
kill -9 $(lsof -t -i:8545)

# Start Anvil on different port
anvil --port 8546
```

#### 2. Contract Deployment Fails
```bash
# Check gas limit
anvil --gas-limit 50000000

# Check private key format
echo "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" | wc -c
# Should be 66 characters (including 0x)
```

#### 3. Frontend Connection Issues
```bash
# Check network configuration
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Check contract addresses
cast call YOUR_CONTRACT_ADDRESS "owner()" --rpc-url http://localhost:8545
```

#### 4. Privy Configuration
- Ensure your Privy App ID is correct
- Check that localhost is allowed in Privy dashboard
- Verify network configuration in Privy settings

### Debug Commands

#### Smart Contract Debugging
```bash
# Get detailed transaction info
cast tx TX_HASH --rpc-url http://localhost:8545

# Trace transaction
cast run TX_HASH --rpc-url http://localhost:8545

# Get contract bytecode
cast code CONTRACT_ADDRESS --rpc-url http://localhost:8545
```

#### Frontend Debugging
```bash
# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_CEDIBETS_ADDRESS)"

# Check build output
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

## 📊 Local Development Workflow

### Daily Development Routine

1. **Start Local Environment**
   ```bash
   # Terminal 1: Start Anvil
   anvil
   
   # Terminal 2: Deploy contracts (if needed)
   forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
   
   # Terminal 3: Start frontend
   cd frontend && npm run dev
   ```

2. **Make Changes**
   - Edit smart contracts in `src/`
   - Edit frontend code in `frontend/`
   - Test changes immediately

3. **Test Changes**
   ```bash
   # Test smart contracts
   forge test --fork-url http://localhost:8545
   
   # Test frontend
   npm run test
   ```

4. **Reset if Needed**
   ```bash
   # Reset Anvil (clears all data)
   anvil --init
   
   # Redeploy contracts
   forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
   ```

### Development Tips

1. **Use Anvil Accounts**: The pre-funded accounts are perfect for testing
2. **Mock USDC**: Use the mock USDC for testing without real tokens
3. **Fast Blocks**: Anvil's 1-second block time makes testing fast
4. **Reset Often**: Don't hesitate to reset Anvil for clean testing
5. **Console Logging**: Use `console.log` in smart contracts for debugging

## 🎯 Next Steps

Once you're comfortable with local development:

1. **Test on Testnet**: Deploy to Arbitrum Sepolia
2. **Oracle Integration**: Implement Chainlink Functions
3. **Production Deployment**: Deploy to mainnet
4. **Monitoring**: Set up production monitoring

---

**Happy coding!** 🚀

This local setup gives you a complete development environment where you can test every aspect of the Cedibets platform without any external dependencies or costs.
