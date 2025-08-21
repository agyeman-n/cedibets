import { useReadContract, useAccount } from 'wagmi'
import { MARKET_FACTORY_ABI, MARKET_ABI, ERC20_ABI, CONTRACTS, MarketState } from '@/lib/contract'
import { Market } from '@/types'
import { Address, formatUnits } from 'viem'
import { useEffect, useState } from 'react'

export function useMarkets() {
  const { address } = useAccount()

  const { data: marketsCount } = useReadContract({
    address: CONTRACTS.MARKET_FACTORY,
    abi: MARKET_FACTORY_ABI,
    functionName: 'getMarketsCount',
  })

  const { data: allMarketAddresses } = useReadContract({
    address: CONTRACTS.MARKET_FACTORY,
    abi: MARKET_FACTORY_ABI,
    functionName: 'getAllMarkets',
    query: {
      enabled: marketsCount !== undefined && marketsCount > 0,
    },
  })

  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for development when contracts aren't available
  useEffect(() => {
    const mockMarkets: Market[] = [
      {
        address: '0x1234567890123456789012345678901234567890' as Address,
        question: "Will GHS/USD exchange rate exceed 15.0 by December 31, 2024?",
        state: MarketState.Open,
        resolutionTimestamp: BigInt(Math.floor(new Date('2024-12-31').getTime() / 1000)),
        oracle: '0x0987654321098765432109876543210987654321' as Address,
        collateralToken: CONTRACTS.USDC,
        yesToken: '0x1111111111111111111111111111111111111111' as Address,
        noToken: '0x2222222222222222222222222222222222222222' as Address,
        totalLiquidity: BigInt(12500 * 1e6), // 12,500 USDC
        yesPrice: 0.653, // 65.3%
        noPrice: 0.347, // 34.7%
      },
      {
        address: '0x2345678901234567890123456789012345678901' as Address,
        question: "Will Ghana national fuel price exceed 10.0 GHS/L by June 30, 2024?",
        state: MarketState.Open,
        resolutionTimestamp: BigInt(Math.floor(new Date('2024-06-30').getTime() / 1000)),
        oracle: '0x0987654321098765432109876543210987654321' as Address,
        collateralToken: CONTRACTS.USDC,
        yesToken: '0x3333333333333333333333333333333333333333' as Address,
        noToken: '0x4444444444444444444444444444444444444444' as Address,
        totalLiquidity: BigInt(8900 * 1e6), // 8,900 USDC
        yesPrice: 0.721, // 72.1%
        noPrice: 0.279, // 27.9%
      },
      {
        address: '0x3456789012345678901234567890123456789012' as Address,
        question: "Will Bitcoin price exceed $100,000 by March 31, 2024?",
        state: MarketState.Open,
        resolutionTimestamp: BigInt(Math.floor(new Date('2024-03-31').getTime() / 1000)),
        oracle: '0x0987654321098765432109876543210987654321' as Address,
        collateralToken: CONTRACTS.USDC,
        yesToken: '0x5555555555555555555555555555555555555555' as Address,
        noToken: '0x6666666666666666666666666666666666666666' as Address,
        totalLiquidity: BigInt(15300 * 1e6), // 15,300 USDC
        yesPrice: 0.234, // 23.4%
        noPrice: 0.766, // 76.6%
      },
    ]

    setMarkets(mockMarkets)
    setIsLoading(false)
  }, [])

  return {
    markets,
    isLoading,
    marketsCount: marketsCount || BigInt(markets.length),
  }
}

export function useMarket(marketAddress: Address) {
  const [market, setMarket] = useState<Market | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = () => {
    // Mock refetch for development
    console.log('Refetching market data for:', marketAddress)
  }

  useEffect(() => {
    // Mock market data for specific address
    const mockMarket: Market = {
      address: marketAddress,
      question: "Will GHS/USD exchange rate exceed 15.0 by December 31, 2024?",
      state: MarketState.Open,
      resolutionTimestamp: BigInt(Math.floor(new Date('2024-12-31').getTime() / 1000)),
      oracle: '0x0987654321098765432109876543210987654321' as Address,
      collateralToken: CONTRACTS.USDC,
      yesToken: '0x1111111111111111111111111111111111111111' as Address,
      noToken: '0x2222222222222222222222222222222222222222' as Address,
      totalLiquidity: BigInt(12500 * 1e6),
      yesPrice: 0.653,
      noPrice: 0.347,
    }

    setMarket(mockMarket)
    setIsLoading(false)
  }, [marketAddress])

  return {
    market,
    isLoading,
    error,
    refetch,
  }
}