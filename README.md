# Cedibets - Fuel Price Protection Platform

A decentralized application (dApp) that provides simple "insurance" protection against fuel price increases in Ghana. Users pay a small premium to receive a fixed payout if official petrol prices rise above a predetermined level within a set timeframe.

## 🎯 Project Overview

**Mission**: Make fuel price protection accessible to everyone in Ghana through simple, transparent blockchain technology.

**Core Principles**:
- **User-Centric**: Hide blockchain complexity behind simple email/phone authentication
- **Mobile-First**: Optimized for mobile browsers and local connectivity
- **Secure & Simple**: Minimal, auditable smart contract logic

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│   Frontend      │    │  Smart Contract  │    │   Oracles      │
│   (Next.js)     │────│   (Cedibets.sol) │────│  (Chainlink)   │
│                 │    │                  │    │   [Future]     │
├─────────────────┤    ├──────────────────┤    └────────────────┘
│ • Privy Auth    │    │ • Policy Storage │    
│ • Mobile UI     │    │ • USDC Handling  │    
│ • Wagmi/Viem    │    │ • Payout Logic   │    
└─────────────────┘    └──────────────────┘    
```

## 📋 Project Status

### ✅ Phase 1: Smart Contract (COMPLETED)
- [x] Cedibets.sol contract with policy management
- [x] Premium collection and payout logic
- [x] OpenZeppelin security integrations
- [x] Foundry testing framework
- [x] Deployment scripts

### ✅ Phase 2: Frontend (COMPLETED)
- [x] Next.js application with TypeScript
- [x] Privy authentication (email/phone)
- [x] Mobile-first responsive design
- [x] Smart contract integration
- [x] User dashboard for policy management
- [x] Purchase flow with USDC handling

### ✅ Phase 3: Deployment & Oracle Preparation (COMPLETED)
- [x] Comprehensive deployment guide
- [x] Arbitrum Sepolia deployment scripts
- [x] Frontend configuration documentation
- [x] Oracle integration roadmap
- [x] Chainlink Functions preparation
- [x] Security and monitoring guidelines

### 🔄 Phase 4: Oracle Integration (PLANNED)
- [ ] Chainlink Functions for fuel price data
- [ ] Automated policy settlement
- [ ] Real-time price monitoring
- [ ] Historical price tracking

## 🚀 Quick Start

### Prerequisites
- **Foundry**: For smart contract compilation and deployment
- **Node.js 18+**: For frontend development
- **Git**: For version control
- **MetaMask or similar**: For wallet management

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/cedibets.git
cd cedibets
```

### 2. Smart Contract Setup
```bash
# Install Foundry dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Deploy to testnet (see DEPLOYMENT.md for detailed instructions)
forge script script/DeployCedibets.s.sol --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast --verify
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### 4. Configuration

Update these key configuration files:

**Smart Contract** (`script/DeployCedibets.s.sol`):
```solidity
// Update with actual USDC address on your target network
address usdcToken = 0x...; // USDC contract address
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_CEDIBETS_ADDRESS=0x... # Your deployed contract
NEXT_PUBLIC_USDC_ADDRESS=0x...    # USDC token address
```

## 🛠 Technology Stack

### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Framework**: Foundry
- **Security**: OpenZeppelin contracts
- **Network**: Arbitrum Sepolia (testnet)

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Privy
- **Blockchain**: wagmi + viem
- **State**: TanStack Query

### Infrastructure
- **Deployment**: Vercel (frontend), Forge (contracts)
- **Data**: Chainlink (future oracles)
- **Storage**: IPFS (future metadata)

## 📖 How It Works

### For Users
1. **Sign Up**: Use email or phone number (no wallet needed)
2. **Buy Protection**: Pay 5 USDC premium for 50 USDC protection
3. **Set Strike Price**: Choose fuel price trigger (e.g., 30.50 GHS)
4. **Automatic Payout**: Receive 50 USDC if fuel exceeds your strike price

### Technical Flow
1. User authenticates via Privy embedded wallet
2. Frontend calls `purchasePolicy()` on smart contract
3. Contract stores policy details and collects USDC premium
4. Oracle monitors fuel prices (manual for now, Chainlink later)
5. Contract automatically pays out if conditions are met

## 🔧 Smart Contract API

### Key Functions

```solidity
// Purchase a new policy
function purchasePolicy(
    uint256 _strikePrice,
    uint256 _expirationTimestamp
) external;

// Settle an expired policy (placeholder for oracle)
function checkAndSettlePolicy(
    uint256 _policyId,
    uint256 _currentFuelPrice // TODO: Remove this parameter when oracle is integrated
) external nonReentrant {
    // ... existing logic ...
}

// View user's policies
function getUserPolicies(address _user) 
    external view returns (uint256[] memory);
```

### Policy Structure
```solidity
struct Policy {
    uint256 id;                    // Unique identifier
    address policyHolder;          // Owner address
    uint256 premiumPaid;          // Amount paid (5 USDC)
    uint256 payoutAmount;         // Payout if triggered (50 USDC)
    uint256 strikePrice;          // Trigger price (e.g., 3050 = 30.50 GHS)
    uint256 expirationTimestamp;  // Policy expiry time
    bool settled;                 // Settlement status
}
```

## 🚀 Deployment Guide

### Smart Contract Deployment

1. **Setup Environment**
```bash
# Create .env file in project root
PRIVATE_KEY=your_private_key
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ETHERSCAN_API_KEY=your_etherscan_key
```

2. **Deploy Contract**
```bash
forge script script/DeployCedibets.s.sol \
    --rpc-url $ARBITRUM_SEPOLIA_RPC \
    --broadcast \
    --verify
```

3. **Verify Deployment**
```bash
# Check contract on Arbiscan
# https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS
```

### Frontend Deployment

1. **Vercel (Recommended)**
   - Connect GitHub repository to Vercel
   - Set environment variables in dashboard
   - Deploy automatically on push

2. **Manual Deployment**
```bash
cd frontend
npm run build
npm start
```

## 🔗 Oracle Integration

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

#### Oracle Function Design
```javascript
// fuel-price-oracle.js
const axios = require('axios');

async function fetchFuelPrice(sourceApi) {
  try {
    const response = await axios.get(sourceApi);
    const fuelPrice = response.data.price;
    const fixedPointPrice = Math.round(fuelPrice * 100);
    return fixedPointPrice;
  } catch (error) {
    throw new Error('Failed to fetch fuel price');
  }
}

module.exports = async (args) => {
  const sourceApi = args[0] || 'https://api.example.com/fuel-price';
  return await fetchFuelPrice(sourceApi);
};
```

#### Smart Contract Updates
```solidity
// TODO: Add Chainlink Functions imports
// import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";

contract Cedibets is Ownable, ReentrancyGuard, FunctionsClient {
    // TODO: Add Chainlink Functions state variables
    // bytes32 public s_lastRequestId;
    // mapping(bytes32 => uint256) public s_requestToPolicyId;
    
    // TODO: Update checkAndSettlePolicy function
    function requestFuelPriceSettlement(uint256 _policyId) external nonReentrant {
        // TODO: Remove _currentFuelPrice parameter
        // TODO: Add Chainlink Functions request
        // TODO: Handle the oracle response in a callback function
    }
}
```

### Integration Timeline

| Phase | Description | Timeline |
|-------|-------------|----------|
| 1 | Oracle function development | 1-2 weeks |
| 2 | Smart contract updates | 1 week |
| 3 | Testnet integration | 1 week |
| 4 | Mainnet deployment | 1 week |

## 🧪 Testing

### Smart Contract Tests
```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testPurchasePolicy
```

### Frontend Tests
```bash
cd frontend

# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Complete deployment guide
- **[ORACLE_INTEGRATION.md](ORACLE_INTEGRATION.md)**: Oracle integration roadmap
- **[frontend/README.md](frontend/README.md)**: Frontend-specific documentation

## 🔮 Future Roadmap

### Phase 4: Oracle Integration
- **Chainlink Functions**: Real fuel price data fetching
- **Automated Settlement**: Remove manual price input
- **Price History**: Historical price tracking and analytics

### Phase 5: Enhanced Features
- **Multiple Strike Prices**: Various protection levels
- **Longer Durations**: 3, 6, 12-month policies
- **Mobile App**: Native iOS/Android applications
- **Advanced Analytics**: User insights and market data

### Phase 6: Expansion
- **Multi-Country**: Expand beyond Ghana
- **Additional Assets**: Protect against other commodity prices
- **DeFi Integration**: Yield farming for unused premiums
- **Governance Token**: Community-driven platform decisions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the full test suite
6. Submit a pull request

### Areas for Contribution
- **Smart Contract**: Gas optimization, additional features
- **Frontend**: UI/UX improvements, performance
- **Testing**: More comprehensive test coverage
- **Documentation**: User guides, API documentation
- **Localization**: Twi, Ga, and other local languages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin**: Security-first smart contract frameworks
- **Privy**: Seamless web3 authentication
- **Arbitrum**: Fast, low-cost blockchain infrastructure
- **Foundry**: Modern Solidity development tools
- **Next.js**: React framework for production
- **Chainlink**: Decentralized oracle networks

## 📞 Contact

- **Email**: hello@cedibets.com
- **Twitter**: [@cedibets](https://twitter.com/cedibets)
- **Discord**: [Join our community](https://discord.gg/cedibets)
- **GitHub**: [github.com/cedibets](https://github.com/cedibets)

## 🚨 Security

### Smart Contract Security
- **Audited**: OpenZeppelin contracts with proven security
- **Tested**: Comprehensive test coverage
- **Access Control**: Owner-only functions for critical operations
- **Reentrancy Protection**: CEI pattern implementation

### Frontend Security
- **No Private Keys**: Embedded wallets managed by Privy
- **HTTPS Only**: Secure connections required
- **Input Validation**: Client and server-side validation
- **Error Handling**: Graceful error handling and user feedback

### Oracle Security (Future)
- **Multiple Sources**: Redundant data sources for reliability
- **Price Validation**: Range checking and format validation
- **Error Handling**: Graceful handling of oracle failures
- **Monitoring**: Real-time monitoring and alerting

---

**Disclaimer**: This is experimental software. Users should understand the risks involved in using blockchain-based financial products. Never invest more than you can afford to lose.

**Note**: This project is currently in MVP phase on Arbitrum Sepolia testnet. Mainnet deployment will follow after thorough testing and security audits.