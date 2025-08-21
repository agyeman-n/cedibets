'use client'

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/config'
import { APP_CONFIG } from '@/lib/config'
import { arbitrumSepolia, foundry } from 'viem/chains'

const queryClient = new QueryClient()

interface PrivyProviderProps {
  children: React.ReactNode
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  return (
    <BasePrivyProvider
      appId={APP_CONFIG.PRIVY_APP_ID}
      config={{
        // Customize the login methods
        loginMethods: ['email', 'sms'],
        
        // Customize the appearance
        appearance: {
          theme: 'light',
          accentColor: '#3b82f6', // Primary blue color
          logo: '/logo.png', // Add your logo to public folder
          showWalletLoginFirst: false, // Hide wallet options by default
        },
        
        // Embed wallets configuration
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        
        // Default chain (use foundry for local development)
        defaultChain: process.env.NEXT_PUBLIC_DEBUG === 'true' ? foundry : arbitrumSepolia,
        
        // Supported chains
        supportedChains: process.env.NEXT_PUBLIC_DEBUG === 'true' ? [foundry, arbitrumSepolia] : [arbitrumSepolia],
        
        // Additional configuration
        legal: {
          termsAndConditionsUrl: '/terms',
          privacyPolicyUrl: '/privacy',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </BasePrivyProvider>
  )
}
