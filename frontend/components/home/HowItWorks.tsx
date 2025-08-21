'use client'

import { CreditCard, Shield, TrendingUp, Gift } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: CreditCard,
      title: 'Pay Premium',
      description: 'Pay a small premium (5 USDC) to purchase your fuel price protection policy.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Shield,
      title: 'Get Protected',
      description: 'Your policy is active immediately. You\'re now protected against fuel price increases.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: TrendingUp,
      title: 'Price Monitoring',
      description: 'We continuously monitor official fuel prices until your policy expires.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Gift,
      title: 'Automatic Payout',
      description: 'If fuel prices exceed your strike price, you automatically receive 50 USDC.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container-mobile">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How Cedibets Works
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our simple 4-step process makes fuel price protection accessible to everyone
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="text-center relative">
                {/* Connection Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-200 transform -translate-y-1/2 z-0">
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                )}

                <div className="relative z-10">
                  {/* Step Number */}
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-900 text-white text-sm font-bold rounded-full mb-4">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-lg ${step.bgColor} mb-4`}>
                    <Icon className={`h-8 w-8 ${step.color}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Why Choose Cedibets?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Transparent</h4>
                <p className="text-sm text-gray-600">
                  All terms are clear upfront. No hidden fees or complex conditions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure</h4>
                <p className="text-sm text-gray-600">
                  Built on blockchain technology with smart contracts for automatic execution.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Simple</h4>
                <p className="text-sm text-gray-600">
                  No complicated forms or lengthy processes. Get protected in minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
