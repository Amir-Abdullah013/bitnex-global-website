# Markets Page Integration Example

This document shows how to integrate the Markets page with your existing navigation system.

## 1. Basic Markets Page

The main markets page is located at `/src/app/markets/page.js` and includes:

- Live WebSocket data from Binance
- Responsive table with all trading pairs
- Search and filter functionality
- Top gainers and losers sections
- Direct links to individual trading pages

## 2. Navigation Integration

### Enhanced Navbar Component

```jsx
// src/components/navigation/EnhancedNavbar.js
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  TrendingUp, 
  User, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Activity
} from 'lucide-react';

const EnhancedNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'markets', label: 'Markets', icon: BarChart3, path: '/markets' },
    { id: 'trade', label: 'Trade', icon: TrendingUp, path: '/user/trade' },
    { id: 'dashboard', label: 'Dashboard', icon: User, path: '/user/dashboard' }
  ];

  const handleNavClick = (path) => {
    router.push(path);
  };

  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-[#0B0E11] border-b border-[#1E2329] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#F0B90B] rounded-lg flex items-center justify-center">
              <span className="text-[#0B0E11] font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-bold text-[#EAECEF]">Bitnex</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg
                    transition-all duration-200
                    ${active 
                      ? 'bg-[#F0B90B]/20 text-[#F0B90B]' 
                      : 'text-[#B7BDC6] hover:bg-[#181A20] hover:text-[#EAECEF]'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden sm:block relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B7BDC6]" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-[#181A20] border border-[#2B3139] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0B90B] text-[#EAECEF] placeholder-[#B7BDC6] w-64"
              />
            </div>

            {/* Notifications */}
            <button className="p-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors">
              <Bell size={18} />
            </button>

            {/* Settings */}
            <button className="p-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default EnhancedNavbar;
```

### Layout Integration

```jsx
// src/app/layout.js
import EnhancedNavbar from '../components/navigation/EnhancedNavbar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <EnhancedNavbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

## 3. Markets Page Features

### Live WebSocket Data

```jsx
// Connect to multiple trading pairs
const tradingPairs = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOTUSDT', 'LINKUSDT', 'UNIUSDT', 'LTCUSDT', 'MATICUSDT', 'AVAXUSDT'
];

useEffect(() => {
  const handlePriceUpdate = (data) => {
    setMarketData(prevData => {
      const newData = new Map(prevData);
      newData.set(data.symbol, {
        ...data,
        lastUpdate: Date.now()
      });
      return newData;
    });
    setLastUpdate(Date.now());
  };

  const connectionId = connectToMultipleSymbols(tradingPairs, handlePriceUpdate);
  setIsConnected(true);
  
  return () => {
    disconnectFromAllSymbols();
    setIsConnected(false);
  };
}, []);
```

### Responsive Table

```jsx
// Markets table with live data
<table className="w-full">
  <thead>
    <tr className="border-b border-[#2B3139]">
      <th className="text-left p-4 text-sm font-medium text-[#B7BDC6]">Pair</th>
      <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">Last Price</th>
      <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">24h Change</th>
      <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">24h Volume</th>
      <th className="text-center p-4 text-sm font-medium text-[#B7BDC6]">Action</th>
    </tr>
  </thead>
  <tbody>
    {filteredAndSortedData.map((symbol) => (
      <tr 
        key={symbol.symbol}
        className="border-b border-[#2B3139] hover:bg-[#1E2329] transition-colors cursor-pointer group"
        onClick={() => handleSymbolClick(symbol.symbol)}
      >
        <td className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-[#EAECEF] group-hover:text-[#F0B90B]">
              {symbol.symbol.replace('USDT', '/USDT')}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(symbol.symbol);
              }}
              className="p-1 rounded hover:bg-[#3C4043] transition-colors"
            >
              {favorites.has(symbol.symbol) ? (
                <Star size={14} className="text-[#F0B90B]" />
              ) : (
                <StarOff size={14} className="text-[#B7BDC6]" />
              )}
            </button>
          </div>
        </td>
        <td className="p-4 text-right">
          <span className="text-sm font-medium text-[#EAECEF]">
            ${formatPrice(symbol.lastPrice)}
          </span>
        </td>
        <td className="p-4 text-right">
          <span 
            className="text-sm font-medium"
            style={{ color: getChangeColor(symbol.isPositive) }}
          >
            {symbol.priceChange >= 0 ? '+' : ''}{symbol.priceChangePercent.toFixed(2)}%
          </span>
        </td>
        <td className="p-4 text-right">
          <span className="text-sm text-[#B7BDC6]">
            {formatVolume(symbol.volume)}
          </span>
        </td>
        <td className="p-4 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSymbolClick(symbol.symbol);
            }}
            className="px-4 py-2 bg-[#F0B90B] text-[#0B0E11] rounded text-sm font-medium hover:bg-[#FCD535] transition-colors"
          >
            Trade
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## 4. Styling

### Binance Dark Theme

```css
/* Main background */
background-color: #0B0E11;

/* Surface colors */
background-color: #181A20; /* Cards, modals */
background-color: #1E2329; /* Hover states */

/* Border colors */
border-color: #2B3139; /* Default borders */
border-color: #3C4043; /* Hover borders */

/* Text colors */
color: #EAECEF; /* Primary text */
color: #B7BDC6; /* Secondary text */
color: #848E9C; /* Tertiary text */

/* Accent colors */
color: #0ECB81; /* Green for positive changes */
color: #F6465D; /* Red for negative changes */
color: #F0B90B; /* Yellow for primary actions */
```

### Responsive Design

```css
/* Mobile-first approach */
@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
  }
  
  .nav-mobile {
    display: block;
  }
  
  .nav-desktop {
    display: none;
  }
}

@media (min-width: 769px) {
  .nav-mobile {
    display: none;
  }
  
  .nav-desktop {
    display: flex;
  }
}
```

## 5. Usage Examples

### Basic Integration

```jsx
// pages/_app.js
import EnhancedNavbar from '../components/navigation/EnhancedNavbar';

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <EnhancedNavbar />
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
```

### Custom Navigation

```jsx
// Custom navigation with Markets link
const CustomNavbar = () => {
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Markets', path: '/markets' },
    { label: 'Trade', path: '/trade' },
    { label: 'Dashboard', path: '/dashboard' }
  ];

  return (
    <nav className="bg-[#0B0E11] border-b border-[#1E2329]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                className="text-[#B7BDC6] hover:text-[#EAECEF] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
```

### Markets Page with Custom Styling

```jsx
// Custom markets page
const CustomMarketsPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0E11]">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-[#EAECEF] mb-6">Markets</h1>
        
        {/* Search and Filters */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search markets..."
            className="w-full max-w-md px-4 py-2 bg-[#181A20] border border-[#2B3139] rounded-lg text-[#EAECEF] placeholder-[#B7BDC6]"
          />
        </div>
        
        {/* Markets Table */}
        <div className="bg-[#181A20] rounded-lg border border-[#2B3139] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2B3139]">
                <th className="text-left p-4 text-sm font-medium text-[#B7BDC6]">Pair</th>
                <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">Last Price</th>
                <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">24h Change</th>
                <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">24h Volume</th>
              </tr>
            </thead>
            <tbody>
              {/* Market data rows */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

## 6. Features

### Live Data Updates
- Real-time price updates via WebSocket
- Automatic reconnection on connection loss
- Error handling and recovery

### Search and Filter
- Search by symbol or base asset
- Filter by favorites, gainers, losers
- Sort by price, change, volume, name

### Responsive Design
- Mobile-friendly table with horizontal scroll
- Collapsible navigation on mobile
- Touch-friendly interactions

### Performance
- Memoized calculations
- Efficient re-renders
- Optimized WebSocket connections

## 7. Browser Support

- Modern browsers with WebSocket support
- Chrome 16+
- Firefox 11+
- Safari 6+
- Edge 12+

## 8. Dependencies

- React 18+
- Next.js 13+
- Framer Motion 10+
- Lucide React (for icons)
- Custom WebSocket library

## 9. License

MIT License - See LICENSE file for details.


