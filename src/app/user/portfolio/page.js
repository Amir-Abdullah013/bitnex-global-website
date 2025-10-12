'use client';

import { useState } from 'react';
import Layout from '../../../components/Layout';
import PortfolioOverview from '../../../components/PortfolioOverview';
import TradingAnalytics from '../../../components/TradingAnalytics';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Portfolio Overview', component: PortfolioOverview },
    { id: 'analytics', label: 'Trading Analytics', component: TradingAnalytics }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <Layout>
      <div className="min-h-screen bg-binance-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-binance-textPrimary mb-2">Portfolio</h1>
            <p className="text-binance-textSecondary">
              Track your investments, analyze performance, and manage your trading portfolio
            </p>
          </div>

          {/* Navigation Tabs */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="flex border-b border-binance-border">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-binance-primary border-b-2 border-binance-primary'
                        : 'text-binance-textSecondary hover:text-binance-textPrimary hover:bg-binance-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Tab Content */}
          {ActiveComponent && (
            <ActiveComponent />
          )}

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-binance-textPrimary text-lg">Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-binance-surface hover:bg-binance-surfaceHover rounded-lg transition-colors">
                    <div className="font-medium text-binance-textPrimary">Start Trading</div>
                    <div className="text-sm text-binance-textSecondary">Place new orders</div>
                  </button>
                  <button className="w-full text-left p-3 bg-binance-surface hover:bg-binance-surfaceHover rounded-lg transition-colors">
                    <div className="font-medium text-binance-textPrimary">Deposit Funds</div>
                    <div className="text-sm text-binance-textSecondary">Add money to your account</div>
                  </button>
                  <button className="w-full text-left p-3 bg-binance-surface hover:bg-binance-surfaceHover rounded-lg transition-colors">
                    <div className="font-medium text-binance-textPrimary">Withdraw Funds</div>
                    <div className="text-sm text-binance-textSecondary">Cash out your profits</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-binance-textPrimary text-lg">Market Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-binance-textSecondary">BNX/USDT</span>
                    <div className="text-right">
                      <div className="text-binance-textPrimary font-medium">$0.50</div>
                      <div className="text-binance-green text-sm">+2.5%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-binance-textSecondary">BTC/USDT</span>
                    <div className="text-right">
                      <div className="text-binance-textPrimary font-medium">$45,230</div>
                      <div className="text-binance-red text-sm">-1.2%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-binance-textSecondary">ETH/USDT</span>
                    <div className="text-right">
                      <div className="text-binance-textPrimary font-medium">$3,120</div>
                      <div className="text-binance-green text-sm">+0.8%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-binance-textPrimary text-lg">Trading Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-binance-surface rounded-lg">
                    <div className="font-medium text-binance-textPrimary mb-1">Diversify Your Portfolio</div>
                    <div className="text-binance-textSecondary">
                      Spread your investments across different assets to reduce risk.
                    </div>
                  </div>
                  <div className="p-3 bg-binance-surface rounded-lg">
                    <div className="font-medium text-binance-textPrimary mb-1">Set Stop Losses</div>
                    <div className="text-binance-textSecondary">
                      Always set stop-loss orders to limit potential losses.
                    </div>
                  </div>
                  <div className="p-3 bg-binance-surface rounded-lg">
                    <div className="font-medium text-binance-textPrimary mb-1">Monitor Performance</div>
                    <div className="text-binance-textSecondary">
                      Regularly review your trading performance and adjust strategies.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioPage;


