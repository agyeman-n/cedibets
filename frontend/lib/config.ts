import { http, createConfig } from 'wagmi'
import { arbitrumSepolia, foundry } from 'viem/chains'
import { createPublicClient } from 'viem'

// Get the chain to use based on environment
const isDevelopment = process.env.NEXT_PUBLIC_DEBUG === 'true'
const chains = isDevelopment ? [foundry, arbitrumSepolia] : [arbitrumSepolia]

// Wagmi configuration
export const config = createConfig({
  chains,
  transports: {
    [foundry.id]: http('http://localhost:8545'),
    [arbitrumSepolia.id]: http(),
  },
})

// Viem public client for read operations
export const publicClient = createPublicClient({
  chain: isDevelopment ? foundry : arbitrumSepolia,
  transport: http(isDevelopment ? 'http://localhost:8545' : undefined),
})

// App configuration
export const APP_CONFIG = {
  // Update with your Privy App ID from dashboard
  PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id',
  
  // Default insurance offer parameters
  DEFAULT_OFFER: {
    PREMIUM_AMOUNT: '5', // USDC
    PAYOUT_AMOUNT: '50', // USDC
    STRIKE_PRICE: '30.50', // GHS
    DAYS_UNTIL_EXPIRY: 30,
  },
  
  // Contract constants
  USDC_DECIMALS: 6,
  FUEL_PRICE_DECIMALS: 2, // For fixed-point representation
} as const
