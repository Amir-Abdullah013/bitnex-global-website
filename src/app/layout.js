/**
 * Root Layout with Enhanced Navigation
 * Main layout component with navigation and theme integration
 */

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../lib/theme-context';
import { UniversalProvider } from '../lib/universal-context';
import ConditionalNavbar from '../components/navigation/ConditionalNavbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Bitnex Global - Advanced Trading Platform',
  description: 'Professional cryptocurrency trading platform with live market data, advanced charts, and real-time trading capabilities.',
  keywords: 'cryptocurrency, trading, bitcoin, ethereum, binance, live trading, market data',
  authors: [{ name: 'Bitnex Global Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F0B90B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="connect-src 'self' wss://stream.binance.com:9443 wss://stream.binance.com wss://data-stream.binance.vision https://api.binance.com https://api1.binance.com https://api2.binance.com https://api3.binance.com;" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#F0B90B" />
      </head>
      <body className={`${inter.className} bg-[#0B0E11] text-[#EAECEF] antialiased`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <UniversalProvider>
            <div className="min-h-screen bg-[#0B0E11]">
              <ConditionalNavbar />
              <main className="relative">
                {children}
              </main>
            </div>
          </UniversalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}