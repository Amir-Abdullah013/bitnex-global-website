# Multiple Trading Pairs Implementation

This document describes the implementation of multiple trading pairs support in Bitnex Global.

## 🚀 Quick Start

### Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Seed trading pairs
npm run seed:trading-pairs

# Seed price data
npm run seed:price-data
```

### Running the Application
```bash
# Start the development server
npm run dev

# Start WebSocket server (in another terminal)
npm run dev:ws
```

## 📁 File Structure

```
src/
├── lib/
│   └── trading-pair-context.js     # Trading pair context provider
├── components/
│   ├── TradingPairSelector.js      # Trading pair selector component
│   ├── OrderBook.js                 # Updated for multiple pairs
│   ├── TradingInterface.js         # Updated for multiple pairs
│   ├── LiveTrades.js               # Updated for multiple pairs
│   └── BnxPriceChart.js            # Updated for multiple pairs
├── app/
│   ├── api/
│   │   ├── trading-pairs/          # Trading pairs API
│   │   ├── orders/orderbook/       # Order book API
│   │   ├── orders/trades/          # Trades API
│   │   └── price/                  # Price API
│   └── user/trade/                 # Updated trade page
└── hooks/
    └── useWebSocket.js             # Updated for multiple pairs
```

## 🗄️ Database Models

### TradingPair Model
```prisma
model TradingPair {
  id              String   @id @default(cuid())
  symbol          String   @unique // "BNX/USDT", "BTC/USDT"
  baseAsset       String   // "BNX", "BTC"
  quoteAsset      String   // "USDT", "USD"
  isActive        Boolean  @default(true)
  minOrderSize    Float    @default(0.001)
  maxOrderSize    Float    @default(1000000)
  pricePrecision  Int      @default(4)
  amountPrecision Int      @default(4)
  makerFee        Float    @default(0.001)
  takerFee        Float    @default(0.001)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  orders      Order[]
  trades      Trade[]
  marketData  MarketData[]
  prices      Price[]
}
```

### MarketData Model
```prisma
model MarketData {
  id            String   @id @default(cuid())
  tradingPairId String
  tradingPair   TradingPair @relation(fields: [tradingPairId], references: [id])
  price         Float
  volume24h     Float    @default(0)
  change24h     Float    @default(0)
  high24h       Float
  low24h        Float
  marketCap     Float?
  lastUpdated   DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## 🔌 API Endpoints

### Trading Pairs API
- **GET** `/api/trading-pairs` - Get all active trading pairs
- **POST** `/api/trading-pairs` - Create new trading pair (Admin)
- **PUT** `/api/trading-pairs` - Update trading pair (Admin)

### Order Book API
- **GET** `/api/orders/orderbook?tradingPair=BNX/USDT&limit=20` - Get order book

### Trades API
- **GET** `/api/orders/trades?tradingPair=BNX/USDT&limit=20` - Get recent trades

### Price API
- **GET** `/api/price?symbol=BNX` - Get current price data

## ⚛️ React Components

### TradingPairSelector
```javascript
import TradingPairSelector from '../components/TradingPairSelector';

<TradingPairSelector 
  selectedPair={selectedPair}
  onPairChange={setSelectedPair}
/>
```

**Features:**
- Interactive pair selection
- Real-time price display
- 24h change indicators
- Volume statistics
- Market data visualization

### TradingPairProvider Context
```javascript
import { TradingPairProvider, useTradingPair } from '../lib/trading-pair-context';

const {
  selectedPair,
  tradingPairs,
  getCurrentPairData,
  getPairAssets,
  formatPrice,
  validateOrderAmount
} = useTradingPair();
```

**Context Methods:**
- `selectedPair` - Currently selected trading pair
- `tradingPairs` - Array of all available pairs
- `getCurrentPairData()` - Get current pair information
- `getPairAssets()` - Get base/quote assets
- `formatPrice(price)` - Format price with correct precision
- `validateOrderAmount(amount)` - Validate order amount

## 🎯 Usage Examples

### Switching Trading Pairs
```javascript
const { selectedPair, setSelectedPair } = useTradingPair();

// Switch to BTC/USDT
setSelectedPair('BTC/USDT');
```

### Getting Pair Information
```javascript
const { getPairAssets, getPairPrecision } = useTradingPair();

const { baseAsset, quoteAsset } = getPairAssets();
// baseAsset: "BTC", quoteAsset: "USDT"

const { pricePrecision, amountPrecision } = getPairPrecision();
// pricePrecision: 2, amountPrecision: 5
```

### Formatting Prices
```javascript
const { formatPrice, formatAmount } = useTradingPair();

const formattedPrice = formatPrice(45000.1234);
// "45000.12" (based on pair precision)

const formattedAmount = formatAmount(0.123456);
// "0.12346" (based on pair precision)
```

### Order Validation
```javascript
const { validateOrderAmount, validateOrderPrice } = useTradingPair();

const amountValidation = validateOrderAmount(0.5);
if (!amountValidation.valid) {
  console.error(amountValidation.error);
}
```

## 🔄 Real-time Updates

### WebSocket Integration
```javascript
// Order book updates per pair
const { orderBook } = useOrderBook(selectedPair);

// Trade updates per pair
const { recentTrades, newTrades } = useTrades(selectedPair);

// Price updates per asset
const { priceData } = usePrice(baseAsset);
```

### Dynamic Pair Switching
- WebSocket subscriptions automatically update when pair changes
- Order book refreshes for new pair
- Trade feed updates to show pair-specific trades
- Price charts update with new asset data

## 📊 Supported Trading Pairs

### Pre-configured Pairs
1. **BNX/USDT** - Bitnex token (Default)
2. **BTC/USDT** - Bitcoin
3. **ETH/USDT** - Ethereum
4. **BNB/USDT** - Binance Coin
5. **ADA/USDT** - Cardano
6. **SOL/USDT** - Solana

### Pair Configuration
Each pair includes:
- Order size limits (min/max)
- Decimal precision settings
- Trading fees (maker/taker)
- Market data integration
- Real-time updates

## 🛠️ Development

### Adding New Trading Pairs
```javascript
// Via API
const response = await fetch('/api/trading-pairs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'NEW/USDT',
    baseAsset: 'NEW',
    quoteAsset: 'USDT',
    minOrderSize: 0.001,
    maxOrderSize: 1000000,
    pricePrecision: 4,
    amountPrecision: 4,
    makerFee: 0.001,
    takerFee: 0.001
  })
});
```

### Updating Pair Settings
```javascript
const response = await fetch('/api/trading-pairs', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'pair_id',
    isActive: true,
    minOrderSize: 0.01,
    maxOrderSize: 500000
  })
});
```

## 🧪 Testing

### Manual Testing
1. Navigate to `/user/trade`
2. Use TradingPairSelector to switch pairs
3. Place orders for different pairs
4. Verify real-time updates per pair
5. Check order book and trade feeds

### API Testing
```bash
# Test trading pairs API
curl http://localhost:3000/api/trading-pairs

# Test order book API
curl "http://localhost:3000/api/orders/orderbook?tradingPair=BTC/USDT&limit=10"

# Test trades API
curl "http://localhost:3000/api/orders/trades?tradingPair=ETH/USDT&limit=5"

# Test price API
curl "http://localhost:3000/api/price?symbol=BTC"
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

### Pair Settings
- **Order Limits**: Min/max order sizes per pair
- **Precision**: Decimal places for price/amount
- **Fees**: Maker/taker fees per pair
- **Status**: Active/inactive pairs

## 📈 Performance

### Optimizations
- Pair-specific WebSocket subscriptions
- Efficient order book updates
- Cached market data
- Optimized database queries
- Real-time price feeds

### Monitoring
- Track pair-specific metrics
- Monitor order book depth
- Analyze trading volume
- Performance metrics per pair

## 🚨 Troubleshooting

### Common Issues

1. **Pair Not Found**
   - Check if trading pair exists in database
   - Verify pair is active
   - Check API endpoint

2. **No Real-time Updates**
   - Verify WebSocket connection
   - Check pair subscription
   - Monitor console for errors

3. **Order Validation Errors**
   - Check pair limits and precision
   - Verify order amount/price
   - Check pair status

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('trading-pair-debug', 'true');

// Check current pair
console.log('Selected pair:', selectedPair);
console.log('Pair data:', getCurrentPairData());
```

## 📚 API Reference

### Trading Pairs API
```javascript
// Get all pairs
GET /api/trading-pairs

// Create pair (Admin)
POST /api/trading-pairs
{
  "symbol": "NEW/USDT",
  "baseAsset": "NEW",
  "quoteAsset": "USDT",
  "minOrderSize": 0.001,
  "maxOrderSize": 1000000,
  "pricePrecision": 4,
  "amountPrecision": 4,
  "makerFee": 0.001,
  "takerFee": 0.001
}

// Update pair (Admin)
PUT /api/trading-pairs
{
  "id": "pair_id",
  "isActive": true,
  "minOrderSize": 0.01
}
```

### Order Book API
```javascript
GET /api/orders/orderbook?tradingPair=BNX/USDT&limit=20

Response:
{
  "success": true,
  "orderBook": {
    "buyOrders": [...],
    "sellOrders": [...]
  },
  "tradingPair": "BNX/USDT"
}
```

### Trades API
```javascript
GET /api/orders/trades?tradingPair=BTC/USDT&limit=10

Response:
{
  "success": true,
  "trades": [...],
  "tradingPair": "BTC/USDT"
}
```

### Price API
```javascript
GET /api/price?symbol=BTC

Response:
{
  "success": true,
  "price": 45000,
  "change24h": 1.2,
  "volume24h": 50000000,
  "high24h": 45500,
  "low24h": 44500
}
```

---

**Multiple trading pairs system is now fully operational!** 🎉

The system supports dynamic pair switching, real-time updates, pair-specific trading, and comprehensive market data integration with professional-grade features.


