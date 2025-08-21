# Cedibets — Prediction Markets for Ghana’s Economy

Cedibets is a prediction market platform for Ghana-focused markets. Users buy and sell binary YES/NO tokens on clearly defined questions (e.g., GHS/USD exchange rate level, national fuel price level). Markets settle via a trusted, automated oracle operated by the Cedibets team using public data sources (e.g., cedirates.com).

This is NOT an insurance product. It is a YES/NO prediction market with transparent rules, centralized market creation, and oracle-based resolution.

## 🎯 Scope

- **Initial markets**:
  - GHS/USD level at a specific timestamp (cedirates.com reference)
  - National petrol price level at next NPA announcement
- **Trading mechanism**: Binary tokens (YES/NO) with AMM pricing
- **Settlement**: Off-chain oracle submits final outcome on-chain
- **Currency**: USDC
- **Chain**: Arbitrum/other low-cost L2 (local dev uses Anvil)
- **Auth**: Privy (email/phone). Embedded wallet under-the-hood. No explicit “connect wallet” in the primary flow.

## 🏗️ Architecture

```
┌────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────────┐
│   Frontend (Next)  │──▶│  Contracts (Foundry)    │──▶│  Off-chain Oracle (Ops)  │
│  Privy auth + UI   │   │  MarketFactory/Market   │   │  cedirates.com + scripts │
└────────────────────┘   │  OutcomeToken (YES/NO)  │   └──────────────────────────┘
                         │  USDC collateral        │
                         └─────────────────────────┘
```

### Smart contracts
- `MarketFactory.sol`: Creates new markets, tracks addresses
- `Market.sol`: Binary market with AMM, fees, resolution + redemption
- `OutcomeToken.sol`: ERC20 YES/NO tokens (mint/burn by market)

### Oracle
- Off-chain script fetches data from trusted public sources
- Cedibets operator resolves a market on-chain by submitting the outcome

## 🧭 User flow

Browse Markets → Sign In (Privy) → Buy YES/NO → View Portfolio → Claim Winnings

## 🚀 Local development

Prerequisites: Foundry, Node.js 18+, Git

1) Start local environment
```bash
./start-local.sh
```
This boots Anvil, deploys Mock USDC + MarketFactory and demo markets, and prepares the frontend.

2) Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:3000`

Environment variables (not committed):
```env
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_FACTORY_ADDRESS=...
NEXT_PUBLIC_USDC_ADDRESS=...
NEXT_PUBLIC_GHS_MARKET=...
NEXT_PUBLIC_FUEL_MARKET=...
```

## 🧪 Testing contracts
```bash
forge build
forge test -vv
```

## 🛠️ Tech stack
- Contracts: Solidity (Foundry), OpenZeppelin
- Frontend: Next.js (App Router), TypeScript, Tailwind, Privy
- Blockchain client: viem/wagmi (reads/writes via embedded wallet)

## 🔮 Roadmap (short-term)
- End-to-end reads from `Market` (prices, state, liquidity)
- Privy-initiated writes: approve USDC, buy/sell, redeem
- Oracle script + resolution admin tooling
- Arbitrum/Base/Optimism deployment

## 📄 License
MIT