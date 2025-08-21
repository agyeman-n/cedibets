import { Address } from 'viem'

// Market State enum (matching our smart contract)
export enum MarketState {
  Open = 0,
  Resolving = 1,
  Resolved = 2,
}

// Market data structure
export interface Market {
  address: Address
  question: string
  state: MarketState
  resolutionTimestamp: bigint
  oracle: Address
  collateralToken: Address
  yesToken: Address
  noToken: Address
  totalLiquidity: bigint
}

// Market with pricing information
export interface MarketWithPrices extends Market {
  yesPrice: bigint // Price in wei (scaled by 1e18)
  noPrice: bigint  // Price in wei (scaled by 1e18)
  yesSupply: bigint
  noSupply: bigint
}

// User position in a market
export interface UserPosition {
  market: Address
  yesBalance: bigint
  noBalance: bigint
  totalValue: bigint // Current value in USDC
}

// User portfolio
export interface UserPortfolio {
  totalValue: bigint
  usdcBalance: bigint
  positions: UserPosition[]
  totalPositions: number
}

// Trading data
export interface TradeData {
  tokenAddress: Address
  tokenType: 'YES' | 'NO'
  amount: bigint
  expectedPrice: bigint
  slippage: number
}

// Market creation data
export interface CreateMarketData {
  question: string
  resolutionTimestamp: bigint
  oracle?: Address
}

// Transaction states
export interface TransactionState {
  isLoading: boolean
  hash?: string
  error?: string
  success?: boolean
}

// API response types for external data
export interface PriceData {
  value: number
  timestamp: number
  source: string
}

// Market statistics
export interface MarketStats {
  totalMarkets: number
  totalLiquidity: bigint
  totalVolume: bigint
  activeMarkets: number
}

// Formatted display data
export interface FormattedMarket {
  address: string
  question: string
  state: 'Open' | 'Resolving' | 'Resolved'
  resolutionDate: Date
  yesPrice: number // 0-1 range
  noPrice: number  // 0-1 range
  totalLiquidity: string // Formatted USDC amount
  volume24h?: string
  category?: string
}

export interface FormattedPosition {
  marketQuestion: string
  yesTokens: string
  noTokens: string
  currentValue: string
  potentialPayout: string
  status: 'Active' | 'Resolved' | 'Claimable'
}

// Privy user data extensions
export interface ExtendedUser {
  id: string
  wallet?: {
    address: string
    chainId: string
  }
  email?: {
    address: string
  }
  phone?: {
    number: string
  }
}

// Contract interaction helpers
export interface ContractConfig {
  address: Address
  abi: any[]
  chainId: number
}

// Error types
export interface ContractError extends Error {
  code?: string
  data?: any
  shortMessage?: string
}

// Event types for market activity
export interface MarketCreatedEvent {
  market: Address
  question: string
  collateralToken: Address
  oracle: Address
  resolutionTimestamp: bigint
  yesToken: Address
  noToken: Address
}

export interface TokensPurchasedEvent {
  buyer: Address
  token: Address
  amountIn: bigint
  tokensOut: bigint
}

export interface MarketResolvedEvent {
  isYesOutcome: boolean
  winningToken: Address
}

// Hook return types
export interface UseMarketReturn {
  market: MarketWithPrices | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export interface UseUserPositionsReturn {
  positions: UserPosition[]
  totalValue: bigint
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Component prop types
export interface MarketCardProps {
  market: FormattedMarket
  onClick?: () => void
  showDetails?: boolean
}

export interface TradingPanelProps {
  market: MarketWithPrices
  onTrade?: (trade: TradeData) => void
}

export interface PositionCardProps {
  position: FormattedPosition
  onClaim?: () => void
}

// Form types
export interface CreateMarketForm {
  question: string
  resolutionDate: string
  resolutionTime: string
  oracle: string
  category: string
}

export interface TradeForm {
  tokenType: 'YES' | 'NO'
  amount: string
  slippage: number
}

// Configuration types
export interface AppConfig {
  chainId: number
  factoryAddress: Address
  usdcAddress: Address
  defaultSlippage: number
  maxMarketsPerPage: number
  refreshInterval: number
}

// Utility types
export type Maybe<T> = T | null | undefined
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Market categories for organization
export type MarketCategory = 
  | 'crypto'
  | 'economics'
  | 'politics'
  | 'sports'
  | 'weather'
  | 'technology'
  | 'other'

export interface CategorizedMarket extends FormattedMarket {
  category: MarketCategory
}

// Loading states
export interface LoadingState {
  markets: boolean
  positions: boolean
  trading: boolean
  creating: boolean
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
  read?: boolean
}