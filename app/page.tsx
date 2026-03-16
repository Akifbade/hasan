import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg">QGO Relocation</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#track" className="hover:text-blue-600 transition-colors">Track Survey</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/track" className="text-sm text-gray-600 hover:text-blue-600 hidden sm:block">
                Track Survey
              </Link>
              <Link
                href="/request"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Request Survey
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Professional Relocation Services
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Move Smarter,<br />
                <span className="text-orange-400">Move Stress-Free</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Professional home survey, expert packing, and seamless international shipping.
                Get your free relocation survey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/request"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105 text-center"
                >
                  Request Free Survey
                </Link>
                <Link
                  href="/track"
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors border border-white/30 text-center"
                >
                  Track My Survey
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-blue-200">
                {['Free Survey', 'Live Tracking', 'Instant Quote'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '📦', label: 'Survey', desc: 'Room-by-room inventory' },
                    { icon: '🚛', label: 'Pack & Move', desc: 'Professional packing' },
                    { icon: '🚢', label: 'Ship', desc: '20ft / 40ft containers' },
                    { icon: '📍', label: 'Track', desc: 'Live GPS tracking' },
                  ].map(item => (
                    <div key={item.label} className="bg-white/10 rounded-2xl p-4">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs text-blue-200 mt-1">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '5,000+', label: 'Successful Moves' },
              { num: '50+', label: 'Destinations' },
              { num: '98%', label: 'Satisfaction Rate' },
              { num: '24/7', label: 'Support' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-blue-600">{stat.num}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Simple 4-step process from survey to delivery</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '📝', title: 'Request Survey', desc: 'Fill out our quick form with your move details and preferred date.' },
              { icon: '🏠', title: 'Home Visit', desc: 'Our surveyor visits your home and inventories all items room by room.' },
              { icon: '📊', title: 'Get Your Quote', desc: 'Receive a detailed quote with container options and pricing.' },
              { icon: '✅', title: 'Confirm & Move', desc: 'Approve the quote, we handle packing, shipping, and delivery.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🏠',
                title: 'Home Relocation',
                desc: 'Complete home moving service with professional survey, packing, and shipping worldwide.',
                features: ['Room-by-room inventory', 'Custom packing', 'Door-to-door delivery'],
              },
              {
                icon: '🚢',
                title: 'Container Shipping',
                desc: 'LCL groupage, 20ft or 40ft container options based on your volume needs.',
                features: ['LCL Groupage', '20ft Container (33m³)', '40ft Container (67m³)'],
              },
              {
                icon: '📱',
                title: 'Live Tracking',
                desc: 'Track your surveyor and shipment in real-time with GPS and instant notifications.',
                features: ['GPS surveyor tracking', 'Status updates', 'Email & WhatsApp alerts'],
              },
            ].map(service => (
              <div key={service.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{service.desc}</p>
                <ul className="space-y-2">
                  {service.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track Section */}
      <section id="track" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Track Your Survey</h2>
          <p className="text-gray-500 mb-8">Enter your tracking code or email to see live status.</p>
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <form action="/track" method="GET" className="flex flex-col sm:flex-row gap-3">
              <input
                name="q"
                type="text"
                placeholder="Tracking code (e.g. AB12CD34) or your email"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Track Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Move?</h2>
          <p className="text-xl text-blue-100 mb-8">Request your free home survey. No obligation, no hidden fees.</p>
          <Link
            href="/request"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all transform hover:scale-105"
          >
            Request Free Survey →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="font-bold text-white">QGO Relocation</span>
              </div>
              <p className="text-sm">Professional relocation services across the UAE and worldwide.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Home Relocation</a></li>
                <li><a href="#" className="hover:text-white">Office Moving</a></li>
                <li><a href="#" className="hover:text-white">International Shipping</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/request" className="hover:text-white">Request Survey</Link></li>
                <li><Link href="/track" className="hover:text-white">Track Survey</Link></li>
                <li><Link href="/login" className="hover:text-white">Staff Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 info@qgorelocation.com</li>
                <li>📞 +971 4 XXX XXXX</li>
                <li>📍 Dubai, UAE</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm">
            © {new Date().getFullYear()} QGO Relocation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
