# Individual Coin Trading System

A comprehensive individual coin trading system similar to Binance Spot pages, built for Bitnex Global.

## Features

- **Dynamic Routes**: Individual trading pages for each cryptocurrency
- **Live Market Data**: Real-time WebSocket streams for price, order book, and chart data
- **Interactive Charts**: Live candlestick charts with multiple timeframes
- **Order Book**: Live bids and asks with depth visualization
- **Trading Forms**: Buy/sell forms with multiple order types
- **Market Navigation**: Easy navigation between different trading pairs
- **Responsive Design**: Mobile-friendly layout that adapts to screen size

## URL Structure

The system uses dynamic routes for individual coin trading:

- `/trade/btcusdt` - Bitcoin trading page
- `/trade/ethusdt` - Ethereum trading page
- `/trade/bnbusdt` - BNB trading page
- `/trade/usdtusd` - USDT trading page
- And more...

## Components

### 1. Dynamic Route (`/trade/[symbol]/page.js`)
Main trading page for individual cryptocurrencies.

```jsx
// Example usage
const CoinTradingPage = () => {
  const params = useParams();
  const symbol = params.symbol?.toUpperCase() || 'BTCUSDT';
  
  return (
    <div className="min-h-screen bg-[#181A20]">
      <MarketTicker />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <OrderBook className="lg:col-span-3" />
        <PriceChart className="lg:col-span-6" />
        <TradingForm className="lg:col-span-3" />
      </div>
    </div>
  );
};
```

### 2. Enhanced WebSocket Streams (`lib/binanceStreams.js`)
Multiple stream connections for comprehensive market data.

```javascript
import { connectToSymbolStreams } from '../lib/binanceStreams';

const callbacks = {
  onTicker: (data) => console.log('Price update:', data),
  onDepth: (data) => console.log('Order book update:', data),
  onKline: (data) => console.log('Chart data update:', data),
  onTrade: (data) => console.log('Recent trade:', data)
};

const connectionId = connectToSymbolStreams('btcusdt', callbacks);
```

### 3. Order Book Component (`components/trading/OrderBook.js`)
Live order book with bids and asks.

```jsx
<OrderBook 
  symbol="BTCUSDT"
  maxOrders={15}
  showSpread={true}
  className="bg-[#1E2329] rounded-lg border border-[#2B3139]"
/>
```

### 4. Price Chart Component (`components/trading/PriceChart.js`)
Live candlestick chart with multiple timeframes.

```jsx
<PriceChart 
  symbol="BTCUSDT"
  defaultTimeframe="1h"
  showVolume={true}
  showIndicators={true}
  className="bg-[#1E2329] rounded-lg border border-[#2B3139]"
/>
```

### 5. Trading Form Component (`components/trading/TradingForm.js`)
Buy/sell form with multiple order types.

```jsx
<TradingForm 
  symbol="BTCUSDT"
  currentPrice={50000}
  onTrade={handleTrade}
  className="bg-[#1E2329] rounded-lg border border-[#2B3139]"
/>
```

### 6. Market Navigation (`components/navigation/MarketNavigation.js`)
Navigation component for accessing different trading pairs.

```jsx
<MarketNavigation 
  showFavorites={true}
  showSearch={true}
  maxItems={10}
  className="bg-[#1E2329] rounded-lg border border-[#2B3139]"
/>
```

## WebSocket Streams

The system connects to multiple Binance WebSocket streams:

### Stream Types
- `{symbol}@ticker` - Price updates
- `{symbol}@trade` - Recent trades
- `{symbol}@depth` - Order book data
- `{symbol}@kline_1m` - 1-minute candlesticks
- `{symbol}@kline_5m` - 5-minute candlesticks
- `{symbol}@kline_15m` - 15-minute candlesticks
- `{symbol}@kline_1h` - 1-hour candlesticks
- `{symbol}@kline_4h` - 4-hour candlesticks
- `{symbol}@kline_1d` - 1-day candlesticks

### Data Formatting
All incoming data is automatically formatted:

```javascript
// Ticker data
{
  symbol: 'BTCUSDT',
  lastPrice: 50000.00,
  priceChange: 1250.00,
  priceChangePercent: 2.56,
  volume: 1500000.00,
  high24h: 51000.00,
  low24h: 49000.00,
  isPositive: true,
  formattedPrice: '50,000.00',
  formattedChange: '2.56',
  formattedVolume: '1.50M'
}

// Order book data
{
  symbol: 'BTCUSDT',
  bids: [
    { price: 49950.00, quantity: 0.5, formattedPrice: '49,950.00', formattedQuantity: '0.50' }
  ],
  asks: [
    { price: 50050.00, quantity: 0.3, formattedPrice: '50,050.00', formattedQuantity: '0.30' }
  ],
  spread: 100.00,
  spreadPercent: 0.20
}

// Chart data
{
  symbol: 'BTCUSDT',
  openTime: 1640995200000,
  closeTime: 1640995260000,
  open: 50000.00,
  high: 50100.00,
  low: 49900.00,
  close: 50050.00,
  volume: 150.00,
  isClosed: true,
  interval: '1m'
}
```

## Layout Structure

### Desktop Layout (3-column)
```
┌─────────────────────────────────────────────────────────────┐
│                    Market Ticker                            │
├─────────────┬─────────────────────────┬─────────────────────┤
│             │                         │                     │
│  Order Book │      Price Chart        │   Trading Form      │
│             │                         │                     │
│  - Bids     │  - Candlestick Chart   │  - Buy/Sell Tabs    │
│  - Asks     │  - Volume Chart        │  - Order Types      │
│  - Spread   │  - Timeframe Selector  │  - Amount Input     │
│             │  - Indicators         │  - Price Input       │
│             │                         │  - Total Display    │
│             │                         │  - Submit Button    │
└─────────────┴─────────────────────────┴─────────────────────┘
```

### Mobile Layout (Stacked)
```
┌─────────────────────────────────────┐
│            Market Ticker            │
├─────────────────────────────────────┤
│            Price Chart              │
├─────────────────────────────────────┤
│            Order Book               │
├─────────────────────────────────────┤
│           Trading Form              │
└─────────────────────────────────────┘
```

## Navigation Integration

### Market Overview Page (`/user/markets`)
- Lists all available trading pairs
- Search and filter functionality
- Top gainers and losers
- Favorites management
- Direct links to individual trading pages

### Enhanced Sidebar
- Market navigation with live data
- Top gainers and losers sections
- Favorites management
- Quick access to trading pages

## Trading Form Features

### Order Types
1. **Market Orders**: Execute immediately at current market price
2. **Limit Orders**: Set your desired price
3. **Stop Orders**: Trigger when price reaches stop price

### Form Validation
- Amount validation (must be greater than 0)
- Price validation for limit orders
- Stop price validation for stop orders
- Real-time total calculation

### Quick Actions
- Percentage-based amount selection (25%, 50%, 75%, 100%)
- Real-time price updates
- Form reset after successful trade

## Performance Optimizations

### WebSocket Management
- Automatic reconnection with exponential backoff
- Connection cleanup on component unmount
- Throttled updates to prevent excessive re-renders
- Error handling and recovery

### Data Processing
- Memoized calculations for performance
- Efficient data formatting
- Optimized re-renders with React.memo
- Debounced search and filtering

### Chart Performance
- Efficient data updates
- Smooth animations
- Responsive design
- Memory management

## Styling

The system uses Binance's exact color scheme:

- **Background**: `#181A20`
- **Surface**: `#1E2329`
- **Border**: `#2B3139`
- **Text Primary**: `#EAECEF`
- **Text Secondary**: `#B7BDC6`
- **Text Tertiary**: `#848E9C`
- **Green (Profit)**: `#0ECB81`
- **Red (Loss)**: `#F6465D`
- **Warning**: `#F59E0B`
- **Primary**: `#F0B90B`

## Error Handling

### Connection Errors
- Automatic reconnection attempts
- User-friendly error messages
- Fallback to cached data when available
- Retry mechanisms

### Data Validation
- Input validation for trading forms
- Price and amount validation
- Error display with helpful messages
- Form state management

### Performance Monitoring
- Connection status indicators
- Data staleness detection
- Performance metrics
- User feedback

## Usage Examples

### Basic Trading Page
```jsx
// Navigate to Bitcoin trading page
router.push('/trade/btcusdt');

// Navigate to Ethereum trading page
router.push('/trade/ethusdt');
```

### Market Navigation
```jsx
// Market overview page
<MarketNavigation 
  showFavorites={true}
  showSearch={true}
  maxItems={20}
/>

// Enhanced sidebar
<EnhancedMarketSidebar 
  isCollapsed={false}
  onToggle={handleToggle}
  activeItem="markets"
/>
```

### Custom Trading Form
```jsx
<TradingForm 
  symbol="BTCUSDT"
  currentPrice={50000}
  onTrade={async (tradeData) => {
    console.log('Executing trade:', tradeData);
    // Handle trade execution
  }}
/>
```

## Browser Support

- Modern browsers with WebSocket support
- Chrome 16+
- Firefox 11+
- Safari 6+
- Edge 12+

## Dependencies

- React 18+
- Next.js 13+
- Framer Motion 10+
- Recharts (for charts)
- Lucide React (for icons)

## License

MIT License - See LICENSE file for details.

