'use client'

import { useState, useEffect } from 'react'
import { CONTRACTS } from '@/lib/contract'
import { usePrivySafe } from './usePrivySafe'

export interface Market {
  address: string
  question: string
  state: 'Open' | 'Resolving' | 'Resolved'
  resolutionTimestamp: number
  oracle: string
  yesToken: string
  noToken: string
  yesPrice: number // 0.0 to 1.0
  noPrice: number // 0.0 to 1.0
  totalLiquidity: number
  userYesBalance?: number
  userNoBalance?: number
  winningToken?: string
}

export function usePredictionMarkets() {
  const { address, isPrivyReady } = usePrivySafe()
  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize with static market data for now
  useEffect(() => {
    async function loadMarkets() {
      try {
        setIsLoading(true)
        setError(null)

        // For now, use static data for the two deployed markets
        const marketData: Market[] = [
          {
            address: CONTRACTS.GHS_MARKET,
            question: "Will the GHS/USD exchange rate reported by cedirates.com be above 16.50 at 5 PM on the last day of this month?",
            state: 'Open',
            resolutionTimestamp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            oracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            yesToken: '0x8e80ffe6dc044f4a766afd6e5a8732fe0977a493',
            noToken: '0x06cd7788d77332cf1156f1e327ebc090b5ff16a3',
            yesPrice: 0.52,
            noPrice: 0.48,
            totalLiquidity: 0,
          },
          {
            address: CONTRACTS.FUEL_MARKET,
            question: "Will the official price of Petrol be above 35.00 GHS at the next National Petroleum Authority announcement?",
            state: 'Open',
            resolutionTimestamp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            oracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            yesToken: '0x400890feb77e0e555d02f8969ca00850f65b96d2',
            noToken: '0x4432ac580b4147d8ecd7cfeafab98564d9881632',
            yesPrice: 0.68,
            noPrice: 0.32,
            totalLiquidity: 0,
          }
        ]

        setMarkets(marketData)
      } catch (err) {
        console.error('Error loading market data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load market data')
      } finally {
        setIsLoading(false)
      }
    }

    loadMarkets()
  }, [isPrivyReady])

  const getMarketByAddress = (address: string) => {
    return markets.find(market => market.address.toLowerCase() === address.toLowerCase())
  }

  const getOpenMarkets = () => {
    return markets.filter(market => market.state === 'Open')
  }

  const getUserMarkets = () => {
    return markets.filter(market => 
      (market.userYesBalance && market.userYesBalance > 0) || 
      (market.userNoBalance && market.userNoBalance > 0)
    )
  }

  return {
    markets,
    isLoading,
    error,
    totalMarkets: markets.length,
    getMarketByAddress,
    getOpenMarkets,
    getUserMarkets,
    refresh: () => {
      // Trigger re-fetch by updating a dependency
      setIsLoading(true)
    }
  }
}