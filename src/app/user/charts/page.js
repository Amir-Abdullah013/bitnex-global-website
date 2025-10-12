'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { TradingPairProvider } from '../../../lib/trading-pair-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import AdvancedChart from '../../../components/AdvancedChart';
import Button from '../../../components/Button';

export default function ChartsPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Initialize component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/user/charts');
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Show loading state
  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-binance-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-binance-primary mx-auto mb-4"></div>
            <p className="text-binance-textSecondary">Loading charts...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-binance-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-binance-primary mx-auto mb-4"></div>
            <p className="text-binance-textSecondary">Redirecting to sign in...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <TradingPairProvider>
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-binance-background">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-binance-textPrimary mb-2">Advanced Charts</h1>
            <p className="text-binance-textSecondary">Professional trading charts with real-time data and technical indicators</p>
          </div>

          {/* Chart Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-binance-primary/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-binance-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-binance-textPrimary">Real-time Data</p>
                    <p className="text-xs text-binance-textSecondary">Live price updates via WebSocket</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-binance-green/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-binance-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-binance-textPrimary">Technical Indicators</p>
                    <p className="text-xs text-binance-textSecondary">EMA, RSI, MACD, Bollinger Bands</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-binance-red/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-binance-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-binance-textPrimary">Multiple Timeframes</p>
                    <p className="text-xs text-binance-textSecondary">1m, 5m, 15m, 1h, 4h, 1d, 1w</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <div className="mb-6">
            <AdvancedChart 
              height={600}
              showIndicators={true}
              showVolume={true}
              showTimeframes={true}
              showIndicatorsPanel={true}
            />
          </div>

          {/* Chart Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-binance-textPrimary">Chart Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-binance-textSecondary">TradingView Integration</span>
                    <span className="text-sm text-binance-green">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-binance-textSecondary">Real-time Updates</span>
                    <span className="text-sm text-binance-green">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-binance-textSecondary">Technical Indicators</span>
                    <span className="text-sm text-binance-green">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-binance-textSecondary">Volume Analysis</span>
                    <span className="text-sm text-binance-green">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-binance-textSecondary">Multiple Timeframes</span>
                    <span className="text-sm text-binance-green">✓</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-binance-textPrimary">Available Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-binance-primary rounded-full"></div>
                    <span className="text-sm text-binance-textSecondary">EMA (9, 21, 50)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-binance-green rounded-full"></div>
                    <span className="text-sm text-binance-textSecondary">SMA (20, 50, 200)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-binance-red rounded-full"></div>
                    <span className="text-sm text-binance-textSecondary">RSI (14)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-binance-textTertiary rounded-full"></div>
                    <span className="text-sm text-binance-textSecondary">MACD (12, 26, 9)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-binance-textSecondary">Bollinger Bands (20, 2)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-binance-textSecondary">Stochastic (14, 3, 3)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </TradingPairProvider>
  );
}
