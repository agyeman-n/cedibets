# Cedibets Frontend (Prediction Markets)

Next.js frontend for a binary prediction market platform (YES/NO tokens). Users in Ghana can trade on outcomes like GHS/USD level and national fuel prices. Sign in with email/phone via Privy; no explicit wallet connection in the primary flow.

## 🚀 Features

- **Seamless Authentication**: Email/phone login via Privy (no wallet complexity)
- **Mobile-First Design**: Responsive interface optimized for mobile browsers
- **Prediction Market Contracts**: `MarketFactory`, `Market`, `OutcomeToken`
- **Real-Time Market Data**: Market state, prices, and balances
- **Portfolio View**: User positions and redemptions
- **Embedded Wallets**: Privy-powered wallet creation and management

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Privy
- **Blockchain**: wagmi + viem
- **Chain**: Arbitrum Sepolia (testnet)
- **State Management**: TanStack Query

## 📦 Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── dashboard/               # User dashboard
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                  # Reusable components
│   ├── dashboard/              # Dashboard-specific components
│   ├── home/                   # Home page components
│   ├── layout/                 # Layout components (Navbar, Footer)
│   └── providers/              # Context providers
├── hooks/                      # Custom React hooks
├── lib/                        # Utility libraries
├── types/                      # TypeScript type definitions
└── public/                     # Static assets
```

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- A Privy account and App ID
- Access to Arbitrum Sepolia testnet

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend directory:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Factory/Token/Market Addresses (update after deployment)
NEXT_PUBLIC_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_USDC_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_GHS_MARKET=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_FUEL_MARKET=0x0000000000000000000000000000000000000000

# Optional: Custom RPC URL
NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

### 3. Configure Privy

1. Sign up at [privy.io](https://privy.io)
2. Create a new app
3. Configure login methods (enable email and SMS)
4. Set your app URL in the Privy dashboard
5. Copy your App ID to the environment file

### 4. Update Contract Addresses

After deploying the Cedibets smart contract:

1. Update `NEXT_PUBLIC_CEDIBETS_ADDRESS` with your deployed contract address
2. Update `NEXT_PUBLIC_USDC_ADDRESS` with the USDC token address on Arbitrum Sepolia

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🎯 Key Components

### Authentication Flow
- Users sign in with email or phone number via Privy
- Embedded wallet is automatically created for new users
- No seed phrases or complex wallet management required

### Trading Flow (Prediction Markets)
1. User browses markets and selects a question
2. Signs in if not authenticated (Privy)
3. Approves USDC (if needed)
4. Buys YES/NO outcome tokens
5. Positions appear in portfolio; redeem after resolution

### Dashboard Features
- Policy overview with status indicators
- Wallet information and balance
- Quick actions for common tasks
- Policy filtering and search

## 🔗 Smart Contract Integration

The frontend interacts with prediction market contracts through several custom hooks:

### `usePredictionMarkets`
- Loads markets, prices, and states
- Filters (open, resolved, user positions)

### `usePredictionTrading`
- Approve USDC, buy/sell tokens, add liquidity, redeem
- Transaction state and error handling

### `usePrivySafe`
- Robust Privy usage wrapper that avoids provider timing issues

## 🎨 Design System

### Colors
- Primary: Blue (#3b82f6)
- Success: Green (#22c55e)
- Warning: Orange (#f59e0b)
- Danger: Red (#ef4444)

### Components
- Responsive design with mobile-first approach
- Consistent button styles and form elements
- Status badges for policy states
- Loading states and error handling

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📱 Mobile Considerations

The app is designed mobile-first with:
- Touch-friendly interface elements
- Responsive breakpoints
- Fast loading on slower connections
- Progressive Web App capabilities (future)

## 🔒 Security Features

- **Smart Contract Security**: All transactions go through audited OpenZeppelin contracts
- **Wallet Security**: Privy's embedded wallets use industry-standard encryption
- **Frontend Security**: No private keys stored in browser
- **Transaction Safety**: Clear confirmation flows and error handling

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build check
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **Privy Not Loading**
   - Check your App ID is correct
   - Verify your domain is configured in Privy dashboard
   - Check browser console for errors

2. **Transaction Failures**
   - Ensure user has sufficient USDC balance
   - Check contract addresses are correct
   - Verify user is on Arbitrum Sepolia network

3. **Wallet Connection Issues**
   - Clear browser cache and cookies
   - Try incognito/private browsing mode
   - Check if Privy services are operational

### Development Tips

- Use browser dev tools to inspect wallet state
- Check the Network tab for failed API calls
- Monitor contract events in Arbiscan for debugging
- Test with small amounts on testnet first

## 🔄 Contract Integration Details

### Required Contract Functions

The frontend expects these functions from Cedibets.sol:

- `purchasePolicy(uint256 _strikePrice, uint256 _expirationTimestamp)`
- `getUserPolicies(address _user)` 
- `getPolicy(uint256 _policyId)`
- `PREMIUM_AMOUNT()` and `PAYOUT_AMOUNT()` constants

### USDC Integration

The app interacts with an ERC20 USDC contract for:
- Balance checking
- Approval for spending
- Transfer execution

### Event Listening

Monitor these events for real-time updates:
- `PolicyPurchased`: New policy created
- `PolicySettled`: Policy payout executed
- ERC20 `Transfer`: USDC movements

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io)
- [wagmi Documentation](https://wagmi.sh)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Arbitrum Documentation](https://docs.arbitrum.io)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This is Phase 2 of the Cedibets project. Make sure you have completed Phase 1 (smart contract deployment) before setting up the frontend.
