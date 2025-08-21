'use client'

import { usePrivy } from '@privy-io/react-auth'
import { TrendingUp, BarChart3, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  const { ready, authenticated, login } = usePrivy()

  const handleGetStarted = () => {
    if (!authenticated) {
      login()
    } else {
      // User is already authenticated, scroll to markets
      window.scrollTo({ 
        top: window.innerHeight,
        behavior: 'smooth' 
      })
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] sm:bg-grid-slate-100/50"></div>
      
      <div className="relative container-mobile py-20 sm:py-24 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-8">
            <BarChart3 className="h-4 w-4 mr-2" />
            Decentralized Prediction Markets
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Trade on the Future of
            <span className="text-primary-600"> Ghana's Economy</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Buy YES or NO tokens on future events like GHS/USD exchange rates and fuel prices. 
            Earn rewards when your predictions are correct.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {ready && (
              <button
                onClick={handleGetStarted}
                className="btn-primary text-lg px-8 py-4"
              >
{authenticated ? 'Start Trading' : 'Get Started'}
              </button>
            )}
            <Link 
              href="/how-it-works"
              className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
            >
              Learn How It Works
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <CheckCircle className="h-6 w-6 text-success-500" />
              <span className="text-gray-700 font-medium">Blockchain Secured</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <TrendingUp className="h-6 w-6 text-success-500" />
              <span className="text-gray-700 font-medium">Automated Market Maker</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Users className="h-6 w-6 text-success-500" />
              <span className="text-gray-700 font-medium">Peer-to-Peer Trading</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 text-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M1200 120L0 16.48C0 16.48 254.24 80.48 600 80.48C945.76 80.48 1200 16.48 1200 16.48V120Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}
