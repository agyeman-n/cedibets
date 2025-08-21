# Cedibets Deployment Guide

This guide covers the complete deployment process for the Cedibets platform, including smart contract deployment, frontend configuration, and oracle integration preparation.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Frontend Configuration](#frontend-configuration)
4. [Oracle Integration Preparation](#oracle-integration-preparation)
5. [Testing Deployment](#testing-deployment)
6. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Tools
- **Foundry**: For smart contract compilation and deployment
- **Node.js 18+**: For frontend development
- **Git**: For version control
- **MetaMask or similar**: For wallet management

### Required Accounts
- **Arbiscan API Key**: For contract verification
- **Privy App ID**: For frontend authentication
- **Testnet ETH**: For deployment gas fees

### Environment Setup
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install Node.js dependencies
cd frontend
npm install

# Verify installations
forge --version
node --version
npm --version
```

## 🚀 Smart Contract Deployment

### Step 1: Environment Configuration

Create a `.env` file in the project root:

```env
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ETHERSCAN_API_KEY=your_arbiscan_api_key

# Optional: Custom RPC endpoints
ALCHEMY_ARBITRUM_SEPOLIA=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY
INFURA_ARBITRUM_SEPOLIA=https://arbitrum-sepolia.infura.io/v3/YOUR_KEY
```

**⚠️ Security Note**: Never commit your private key to version control!

### Step 2: Get Testnet ETH

1. **Arbitrum Sepolia Faucet**: Visit [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
2. **Bridge from Sepolia**: Use [Arbitrum Bridge](https://bridge.arbitrum.io/) to bridge ETH from Sepolia to Arbitrum Sepolia
3. **Alternative Faucets**: 
   - [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)
   - [Alchemy Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia-faucet)

### Step 3: Compile Contracts

```bash
# Compile all contracts
forge build

# Verify compilation
forge build --sizes
```

### Step 4: Run Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test file
forge test --match-contract CedibetsTest
```

### Step 5: Deploy to Arbitrum Sepolia

```bash
# Deploy using the main script
forge script script/DeployCedibets.s.sol \
    --rpc-url $ARBITRUM_SEPOLIA_RPC \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY

# Alternative: Deploy with custom USDC address
forge script script/DeployCedibets.s.sol:DeployCedibetsWithCustomUSDC \
    --sig "run(address)" \
    --rpc-url $ARBITRUM_SEPOLIA_RPC \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
```

### Step 6: Verify Deployment

After deployment, verify the contract on Arbiscan:

1. Visit [Arbitrum Sepolia Arbiscan](https://sepolia.arbiscan.io/)
2. Search for your deployed contract address
3. Verify the contract source code
4. Check the contract's state variables

### Step 7: Save Deployment Info

The deployment script automatically saves deployment information. You can also manually save it:

```bash
# Create deployment info file
cat > deployment-info.json << EOF
{
  "network": "arbitrum-sepolia",
  "chainId": 421614,
  "cedibets": "YOUR_DEPLOYED_CONTRACT_ADDRESS",
  "usdc": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  "deployer": "YOUR_DEPLOYER_ADDRESS",
  "deploymentTx": "YOUR_DEPLOYMENT_TX_HASH",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
```

## 🌐 Frontend Configuration

### Step 1: Environment Setup

Navigate to the frontend directory and create environment file:

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local` with your deployment information:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Contract Addresses (from deployment)
NEXT_PUBLIC_CEDIBETS_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_USDC_ADDRESS=0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_NETWORK_NAME=Arbitrum Sepolia

# Optional: Custom RPC URL for better performance
NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# App Configuration
NEXT_PUBLIC_APP_NAME=Cedibets
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 2: Configure Privy

1. **Create Privy App**:
   - Visit [Privy Dashboard](https://console.privy.io/)
   - Create a new app
   - Configure login methods (email, SMS)
   - Set your app URL

2. **Update Privy Configuration**:
   - Copy your App ID to `.env.local`
   - Configure allowed domains in Privy dashboard
   - Set up redirect URLs if needed

### Step 3: Update Contract Configuration

Update the contract addresses in `frontend/lib/contract.ts`:

```typescript
export const CONTRACTS = {
  CEDIBETS: process.env.NEXT_PUBLIC_CEDIBETS_ADDRESS as Address,
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as Address,
} as const
```

### Step 4: Test Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Test production build
npm start
```

### Step 5: Deploy Frontend

#### Option A: Vercel (Recommended)

1. **Connect Repository**:
   - Push code to GitHub
   - Connect repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Deploy**:
   ```bash
   # Vercel will auto-deploy on push
   git push origin main
   ```

#### Option B: Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔗 Oracle Integration Preparation

### Current Implementation

The `checkAndSettlePolicy` function currently uses a placeholder parameter:

```solidity
function checkAndSettlePolicy(
    uint256 _policyId,
    uint256 _currentFuelPrice // TODO: Remove this parameter when oracle is integrated
) external nonReentrant {
    // ... existing logic ...
}
```

### Future Chainlink Functions Integration

#### Step 1: Oracle Function Design

Create a JavaScript function for Chainlink Functions:

```javascript
// fuel-price-oracle.js
const axios = require('axios');

async function fetchFuelPrice(sourceApi) {
  try {
    // Fetch fuel price from reliable API
    const response = await axios.get(sourceApi);
    const fuelPrice = response.data.price; // Adjust based on API response
    
    // Convert to fixed-point format (e.g., 30.50 GHS -> 3050)
    const fixedPointPrice = Math.round(fuelPrice * 100);
    
    return fixedPointPrice;
  } catch (error) {
    console.error('Error fetching fuel price:', error);
    throw new Error('Failed to fetch fuel price');
  }
}

// Chainlink Functions handler
module.exports = async (args) => {
  const sourceApi = args[0] || 'https://api.example.com/fuel-price';
  return await fetchFuelPrice(sourceApi);
};
```

#### Step 2: Smart Contract Updates

Update the Cedibets contract to integrate with Chainlink Functions:

```solidity
// TODO: Add Chainlink Functions imports
// import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol";

contract Cedibets is Ownable, ReentrancyGuard, FunctionsClient {
    // TODO: Add Chainlink Functions state variables
    // bytes32 public s_lastRequestId;
    // bytes public s_lastResponse;
    // bytes public s_lastError;
    
    // TODO: Update checkAndSettlePolicy function
    function checkAndSettlePolicy(uint256 _policyId) external nonReentrant {
        // TODO: Remove _currentFuelPrice parameter
        // TODO: Add Chainlink Functions request
        // TODO: Handle oracle response in callback
    }
    
    // TODO: Add Chainlink Functions callback
    // function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    //     // Handle oracle response
    //     // Settle policies based on real fuel price data
    // }
}
```

#### Step 3: Oracle Setup Steps

1. **Chainlink Functions Subscription**:
   - Create subscription on [Chainlink Functions](https://functions.chain.link/)
   - Fund subscription with LINK tokens
   - Configure allowed callers

2. **API Integration**:
   - Identify reliable fuel price APIs for Ghana
   - Implement error handling and fallbacks
   - Set up monitoring and alerts

3. **Testing**:
   - Test oracle function locally
   - Deploy to testnet
   - Verify price accuracy and reliability

### Integration Timeline

| Phase | Description | Timeline |
|-------|-------------|----------|
| 1 | Oracle function development | 1-2 weeks |
| 2 | Smart contract updates | 1 week |
| 3 | Testnet integration | 1 week |
| 4 | Mainnet deployment | 1 week |

## 🧪 Testing Deployment

### Smart Contract Testing

```bash
# Test on local network
anvil
forge test --fork-url http://localhost:8545

# Test on Arbitrum Sepolia
forge test --fork-url $ARBITRUM_SEPOLIA_RPC
```

### Frontend Testing

```bash
# Test contract integration
npm run test:contract

# Test user flows
npm run test:e2e

# Test mobile responsiveness
npm run test:mobile
```

### Integration Testing

1. **Purchase Flow Test**:
   - Sign in with Privy
   - Approve USDC spending
   - Purchase policy
   - Verify policy appears in dashboard

2. **Settlement Test**:
   - Create test policy
   - Manually trigger settlement
   - Verify payout (if conditions met)

3. **Error Handling Test**:
   - Test insufficient balance
   - Test network errors
   - Test contract errors

## 🔧 Troubleshooting

### Common Deployment Issues

#### 1. Insufficient Gas
```bash
# Increase gas limit
forge script script/DeployCedibets.s.sol \
    --rpc-url $ARBITRUM_SEPOLIA_RPC \
    --broadcast \
    --gas-limit 5000000
```

#### 2. Contract Verification Failed
```bash
# Manual verification
forge verify-contract \
    --chain-id 421614 \
    --constructor-args $(cast abi-encode "constructor(address)" 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d) \
    YOUR_CONTRACT_ADDRESS \
    src/Cedibets.sol:Cedibets \
    --etherscan-api-key $ETHERSCAN_API_KEY
```

#### 3. Frontend Connection Issues
- Check contract addresses in `.env.local`
- Verify network configuration
- Check browser console for errors
- Ensure Privy app is properly configured

### Debug Commands

```bash
# Check contract state
cast call YOUR_CONTRACT_ADDRESS "owner()" --rpc-url $ARBITRUM_SEPOLIA_RPC

# Check USDC balance
cast call 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d "balanceOf(address)" YOUR_ADDRESS --rpc-url $ARBITRUM_SEPOLIA_RPC

# Check policy details
cast call YOUR_CONTRACT_ADDRESS "getPolicy(uint256)" 1 --rpc-url $ARBITRUM_SEPOLIA_RPC
```

### Support Resources

- **Arbitrum Documentation**: [docs.arbitrum.io](https://docs.arbitrum.io/)
- **Foundry Book**: [book.getfoundry.sh](https://book.getfoundry.sh/)
- **Privy Documentation**: [docs.privy.io](https://docs.privy.io/)
- **Chainlink Functions**: [docs.chain.link/functions](https://docs.chain.link/functions)

## 📞 Next Steps

After successful deployment:

1. **Monitor Contract**: Set up monitoring for contract events and transactions
2. **User Testing**: Conduct user acceptance testing with real users
3. **Security Audit**: Consider professional security audit before mainnet
4. **Oracle Integration**: Proceed with Chainlink Functions integration
5. **Mainnet Deployment**: Deploy to Arbitrum One mainnet when ready

---

**Note**: This deployment guide covers the current MVP implementation. Future phases will include oracle integration, enhanced features, and mainnet deployment.
