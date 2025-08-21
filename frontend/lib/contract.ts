import { Address } from 'viem'

// Import ABIs for Prediction Markets
import MarketFactoryABI from './abis/MarketFactory.json'
import MarketABI from './abis/Market.json'
import OutcomeTokenABI from './abis/OutcomeToken.json'
import CedibetsABI from './abis/Cedibets.json'

// Prediction Market ABIs
export const MARKET_FACTORY_ABI = MarketFactoryABI as const
export const MARKET_ABI = MarketABI as const
export const OUTCOME_TOKEN_ABI = OutcomeTokenABI as const

// Legacy insurance contract ABI (for backward compatibility)
export const CEDIBETS_ABI = CedibetsABI as const

// ERC20 ABI for USDC and token interactions
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

// Contract addresses (update these with your deployed addresses)
export const CONTRACTS = {
  // Prediction Market Factory
  MARKET_FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
  // USDC token address
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
  // Sample Markets for Testing
  GHS_MARKET: process.env.NEXT_PUBLIC_GHS_MARKET as Address || '0x0000000000000000000000000000000000000000',
  FUEL_MARKET: process.env.NEXT_PUBLIC_FUEL_MARKET as Address || '0x0000000000000000000000000000000000000000',
  // Legacy insurance contract (for backward compatibility)
  CEDIBETS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
} as const

// Market States enum
export enum MarketState {
  Open = 0,
  Resolving = 1,
  Resolved = 2,
}

// Chain configuration
export const SUPPORTED_CHAINS = {
  foundry: {
    id: 31337,
    name: 'Local Anvil',
    network: 'foundry',
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
    id: 421614,
    name: 'Arbitrum Sepolia',
    network: 'arbitrum-sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['https://sepolia-rollup.arbitrum.io/rpc'],
      },
      public: {
        http: ['https://sepolia-rollup.arbitrum.io/rpc'],
      },
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
    },
    testnet: true,
  },
} as const