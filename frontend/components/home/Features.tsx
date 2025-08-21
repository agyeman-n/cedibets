'use client'

import { Shield, Smartphone, Zap, Globe, Lock, Users } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Designed for mobile browsers. Works perfectly on any device.',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'Automatic payouts when conditions are met. No waiting for claims.',
    },
    {
      icon: Lock,
      title: 'Secure & Audited',
      description: 'Smart contracts audited and secured by blockchain technology.',
    },
    {
      icon: Globe,
      title: 'No Bank Account Needed',
      description: 'Just your phone or email. No traditional banking required.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Built for Ghanaians, by people who understand local needs.',
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Smart risk pooling ensures sustainable protection for all users.',
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-mobile">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built for Ghana
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We understand the challenges of fuel price volatility in Ghana and built a solution that works for everyone
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-primary-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Protect Yourself?
            </h3>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              Join the growing community of Ghanaians taking control of fuel price volatility
            </p>
            <a
              href="#insurance-offer"
              className="inline-block bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Protected Now
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
