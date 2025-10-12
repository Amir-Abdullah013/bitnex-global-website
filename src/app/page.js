'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../components';
import SEO from '../components/SEO';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Features', href: '/#features' },
  ];

  return (
    <>
      <SEO
        title="Token Website - Secure Digital Wallet Platform"
        description="Experience lightning-fast crypto trading with institutional-grade security. Join thousands of traders who trust our platform for secure digital wallet management."
        keywords="digital wallet, cryptocurrency, secure trading, blockchain, crypto platform, token management"
        url="/"
        type="website"
      />
      <div className="min-h-screen bg-binance-background" style={{backgroundColor: '#1E2329'}}>
      {/* Navigation */}
      <nav className="bg-binance-surface backdrop-blur-md border-b border-binance-border" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-binance-primary rounded-xl flex items-center justify-center" style={{backgroundColor: '#F0B90B'}}>
                    <span className="text-binance-background font-bold text-sm sm:text-lg" style={{color: '#1E2329'}}>B</span>
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-binance-textPrimary" style={{color: '#EAECEF'}}>Bitnex Global</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-binance-textSecondary hover:text-binance-textPrimary px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-binance-surfaceHover"
                  style={{color: '#B7BDC6'}}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link
                href="/auth/signin"
                className="text-binance-textPrimary hover:text-binance-primary px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-binance-border hover:border-binance-primary bg-transparent hover:bg-binance-primary/10"
                style={{borderColor: '#F0B90B', color: '#F0B90B'}}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-binance-primary text-binance-background hover:bg-binance-primary/80 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-binance-textPrimary hover:text-binance-primary p-2 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-binance-surface backdrop-blur-md rounded-lg mt-2 border border-binance-border">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-binance-textSecondary hover:text-binance-textPrimary block px-3 py-2 rounded-lg text-base font-medium transition-colors hover:bg-binance-surfaceHover"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-binance-border pt-3 mt-3">
                  <Link
                    href="/auth/signin"
                    className="text-binance-textPrimary hover:text-binance-primary block px-3 py-2 rounded-lg text-base font-semibold transition-colors border border-binance-border hover:border-binance-primary bg-transparent hover:bg-binance-primary/10 mb-2"
                    style={{borderColor: '#F0B90B', color: '#F0B90B'}}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-binance-primary text-binance-background hover:bg-binance-primary/80 block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-binance-primary/20 border border-binance-primary/30 mb-8" style={{backgroundColor: 'rgba(240, 185, 11, 0.2)', borderColor: 'rgba(240, 185, 11, 0.3)'}}>
              <span className="text-binance-primary mr-2" style={{color: '#F0B90B'}}>🚀</span>
              <span className="text-binance-primary text-sm font-semibold" style={{color: '#F0B90B'}}>Next-Generation Trading Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-binance-textPrimary mb-6 leading-tight" style={{color: '#EAECEF'}}>
              Trade <span className="text-binance-primary font-bold" style={{color: '#F0B90B'}}>Crypto</span><br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Like a Pro
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-binance-textSecondary mb-12 max-w-3xl mx-auto leading-relaxed px-4" style={{color: '#B7BDC6'}}>
              Experience lightning-fast crypto trading with institutional-grade security. 
              <span className="text-binance-primary font-semibold" style={{color: '#F0B90B'}}> Join thousands of traders</span> who trust our platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full bg-binance-primary hover:bg-binance-primary/80 text-binance-background border-0 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                  style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
                >
                  Start Trading Now
                </Button>
              </Link>
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <button className="w-full bg-transparent border-2 border-binance-border text-binance-textPrimary hover:bg-binance-surface hover:text-binance-textPrimary px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center transform hover:scale-105" style={{borderColor: '#F0B90B', color: '#F0B90B', borderWidth: '2px'}}>
                  Sign In
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
              <div className="text-center p-4">
                <div className="text-3xl sm:text-4xl font-bold text-binance-primary mb-2" style={{color: '#F0B90B'}}>$2.4B+</div>
                <div className="text-binance-textSecondary text-sm sm:text-base" style={{color: '#B7BDC6'}}>Trading Volume</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl sm:text-4xl font-bold text-binance-green mb-2" style={{color: '#0ECB81'}}>50K+</div>
                <div className="text-binance-textSecondary text-sm sm:text-base" style={{color: '#B7BDC6'}}>Active Users</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl sm:text-4xl font-bold text-binance-primary mb-2" style={{color: '#F0B90B'}}>99.9%</div>
                <div className="text-binance-textSecondary text-sm sm:text-base" style={{color: '#B7BDC6'}}>Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-binance-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-binance-textPrimary mb-4" style={{color: '#EAECEF'}}>
              Why Choose <span className="text-binance-primary font-bold" style={{color: '#F0B90B'}}>Bitnex Global</span>?
            </h2>
            <p className="text-xl text-binance-textSecondary max-w-2xl mx-auto" style={{color: '#B7BDC6'}}>
              Built for serious traders who demand the best performance and security.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-binance-primary/10 to-binance-green/10 backdrop-blur-sm rounded-2xl p-8 border border-binance-primary/20 hover:border-binance-primary/40 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-binance-primary to-binance-green rounded-2xl flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-binance-textPrimary mb-4" style={{color: '#EAECEF'}}>Lightning Fast</h3>
              <p className="text-binance-textSecondary leading-relaxed" style={{color: '#B7BDC6'}}>
                Execute trades in <span className="text-binance-primary font-semibold" style={{color: '#F0B90B'}}>milliseconds</span> with our high-performance trading engine. 
                Never miss an opportunity with real-time market data.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-binance-green/10 to-binance-primary/10 backdrop-blur-sm rounded-2xl p-8 border border-binance-green/20 hover:border-binance-green/40 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-binance-green to-binance-primary rounded-2xl flex items-center justify-center mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-binance-textPrimary mb-4" style={{color: '#EAECEF'}}>Bank-Grade Security</h3>
              <p className="text-binance-textSecondary leading-relaxed" style={{color: '#B7BDC6'}}>
                Your assets are protected with <span className="text-binance-green font-semibold" style={{color: '#0ECB81'}}>military-grade encryption</span> and 
                multi-layer security protocols. Your investments are safe with us.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-binance-primary/10 to-binance-green/10 backdrop-blur-sm rounded-2xl p-8 border border-binance-primary/20 hover:border-binance-primary/40 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-binance-primary to-binance-green rounded-2xl flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-binance-textPrimary mb-4" style={{color: '#EAECEF'}}>Advanced Analytics</h3>
              <p className="text-binance-textSecondary leading-relaxed" style={{color: '#B7BDC6'}}>
                Make informed decisions with our <span className="text-binance-primary font-semibold" style={{color: '#F0B90B'}}>comprehensive charting tools</span> and 
                market analysis. Professional-grade tools for serious traders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-binance-primary/20 to-binance-green/20 backdrop-blur-sm rounded-3xl p-12 border border-binance-primary/30 text-center" style={{backgroundColor: 'rgba(240, 185, 11, 0.1)', borderColor: 'rgba(240, 185, 11, 0.3)'}}>
            <h2 className="text-4xl font-bold text-binance-textPrimary mb-6" style={{color: '#EAECEF'}}>
              Ready to Start Your <span className="text-binance-primary font-bold" style={{color: '#F0B90B'}}>Trading Journey</span>?
            </h2>
            <p className="text-xl text-binance-textSecondary mb-8 max-w-2xl mx-auto" style={{color: '#B7BDC6'}}>
              Join <span className="text-binance-primary font-semibold" style={{color: '#F0B90B'}}>thousands of successful traders</span> who trust Bitnex Global for their crypto needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full bg-binance-primary hover:bg-binance-primary/80 text-binance-background border-0 px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                  style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
                >
                  🚀 Create Free Account
                </Button>
              </Link>
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <button className="w-full bg-transparent border-2 border-binance-border text-binance-textPrimary hover:bg-binance-surface hover:text-binance-textPrimary px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center transform hover:scale-105" style={{borderColor: '#F0B90B', color: '#F0B90B', borderWidth: '2px'}}>
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-binance-surface/50 border-t border-binance-border" style={{backgroundColor: 'rgba(43, 49, 57, 0.5)', borderColor: '#3C4043'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-binance-primary rounded-lg flex items-center justify-center" style={{backgroundColor: '#F0B90B'}}>
                <span className="text-binance-background font-bold" style={{color: '#1E2329'}}>B</span>
              </div>
              <span className="text-xl font-bold text-binance-textPrimary" style={{color: '#EAECEF'}}>Bitnex Global</span>
            </div>
            <p className="text-binance-textTertiary mb-6" style={{color: '#848E9C'}}>
              The future of cryptocurrency trading is here.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-binance-textTertiary" style={{color: '#848E9C'}}>
              <Link href="/privacy" className="hover:text-binance-textPrimary transition-colors" style={{color: '#848E9C'}}>Privacy Policy</Link>
              <Link href="/terms" className="hover:text-binance-textPrimary transition-colors" style={{color: '#848E9C'}}>Terms of Service</Link>
              <Link href="/support" className="hover:text-binance-textPrimary transition-colors" style={{color: '#848E9C'}}>Support</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}