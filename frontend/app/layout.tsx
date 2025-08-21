import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cedibets - Fuel Price Protection',
  description: 'Simple insurance protection against rising fuel prices in Ghana. Pay a small premium to receive a fixed payout if petrol prices exceed your strike price.',
  keywords: ['insurance', 'fuel', 'petrol', 'Ghana', 'blockchain', 'DeFi', 'protection'],
  authors: [{ name: 'Cedibets Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#3b82f6',
  openGraph: {
    title: 'Cedibets - Fuel Price Protection',
    description: 'Simple insurance protection against rising fuel prices in Ghana',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cedibets - Fuel Price Protection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cedibets - Fuel Price Protection',
    description: 'Simple insurance protection against rising fuel prices in Ghana',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full flex flex-col`}>
        <ErrorBoundary>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
