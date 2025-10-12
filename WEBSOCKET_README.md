# Real-time Trading System with WebSockets

This document describes the WebSocket implementation for Bitnex Global's real-time trading system.

## 🚀 Quick Start

### Running the WebSocket Server

```bash
# Install dependencies
npm install

# Run the WebSocket server
npm run dev:ws

# Or run both Next.js and WebSocket server
npm run dev & npm run dev:ws
```

The WebSocket server will run on `http://localhost:3001` with Socket.io integration.

## 📁 File Structure

```
src/
├── lib/
│   ├── websocket-server.js      # Socket.io server implementation
│   ├── websocket-client.js      # Client-side WebSocket management
│   └── websocket-integration.js  # Next.js integration
├── hooks/
│   └── useWebSocket.js          # React hooks for WebSocket
├── components/
│   ├── OrderBook.js             # Real-time order book
│   ├── TradingInterface.js       # Real-time trading interface
│   ├── LiveTrades.js            # Live trade feed
│   ├── BnxPriceChart.js         # Real-time price chart
│   └── WebSocketStatus.js       # Connection status indicator
└── app/
    └── test-websocket/          # WebSocket testing page
```

## 🔌 WebSocket Events

### Client → Server Events

| Event | Description | Parameters |
|-------|-------------|------------|
| `subscribe-orderbook` | Subscribe to order book updates | `tradingPair` |
| `subscribe-trades` | Subscribe to trade updates | `tradingPair` |
| `subscribe-price` | Subscribe to price updates | `symbol` |
| `subscribe-user-orders` | Subscribe to user order updates | `userId` |
| `join-trading-room` | Join trading room | `tradingPair` |
| `unsubscribe-orderbook` | Unsubscribe from order book | `tradingPair` |
| `unsubscribe-trades` | Unsubscribe from trades | `tradingPair` |
| `unsubscribe-price` | Unsubscribe from price | `symbol` |
| `unsubscribe-user-orders` | Unsubscribe from user orders | `userId` |

### Server → Client Events

| Event | Description | Data |
|-------|-------------|------|
| `orderbook-update` | Order book changes | `{ tradingPair, orderBook, timestamp }` |
| `trades-update` | Recent trades | `{ tradingPair, trades, timestamp }` |
| `price-update` | Price changes | `{ symbol, price, change24h, volume24h, timestamp }` |
| `new-trade` | New trade execution | `{ trade, timestamp }` |
| `user-order-update` | User order changes | `{ order, timestamp }` |
| `connection-status` | Connection status | `{ connected, reason? }` |

## 🎯 React Hooks

### `useWebSocket()`
Main hook providing all WebSocket functionality:

```javascript
const {
  isConnected,
  orderBook,
  recentTrades,
  priceData,
  userOrders,
  newTrades,
  subscribeToOrderBook,
  subscribeToTrades,
  subscribeToPrice,
  subscribeToUserOrders,
  joinTradingRoom,
  unsubscribeFromOrderBook,
  unsubscribeFromTrades,
  unsubscribeFromPrice,
  unsubscribeFromUserOrders,
  getConnectionStatus,
  disconnect
} = useWebSocket();
```

### Specialized Hooks

#### `useOrderBook(tradingPair)`
```javascript
const { orderBook, isConnected } = useOrderBook('BNX/USD');
```

#### `useTrades(tradingPair)`
```javascript
const { recentTrades, newTrades, isConnected } = useTrades('BNX/USD');
```

#### `usePrice(symbol)`
```javascript
const { priceData, isConnected } = usePrice('BNX');
```

#### `useUserOrders(userId)`
```javascript
const { userOrders, isConnected } = useUserOrders(userId);
```

## 🧪 Testing

### Test Page
Navigate to `/test-websocket` to test real-time functionality:

1. **Open Multiple Browser Tabs**
   - Open `/test-websocket` in two different tabs
   - Check connection status indicators

2. **Test Real-time Updates**
   - Go to `/user/trade` in one tab
   - Place a buy or sell order
   - Watch real-time messages appear in the test page

3. **Verify Features**
   - Order book updates instantly
   - New trades appear in real-time
   - Price changes broadcast immediately
   - Connection status shows live

### Manual Testing Steps

1. **Start WebSocket Server**
   ```bash
   npm run dev:ws
   ```

2. **Open Test Page**
   - Navigate to `http://localhost:3001/test-websocket`
   - Check connection status

3. **Test Trading Interface**
   - Go to `http://localhost:3001/user/trade`
   - Place orders and watch real-time updates

4. **Multi-session Testing**
   - Open multiple browser tabs
   - Place orders in one tab
   - Watch updates in another tab

## 🔧 Configuration

### Environment Variables

```env
# WebSocket Server
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### WebSocket Client Configuration

```javascript
// Default configuration
const serverUrl = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_WS_URL || 'wss://your-domain.com'
  : 'http://localhost:3001';
```

## 📊 Real-time Features

### Order Book Updates
- **Frequency**: Every 1 second
- **Data**: Buy/sell orders with prices and volumes
- **Rooms**: `orderbook-BNX/USD`

### Trade Updates
- **Frequency**: Every 3 seconds
- **Data**: Recent trades with prices and volumes
- **Rooms**: `trades-BNX/USD`

### Price Updates
- **Frequency**: Every 2 seconds
- **Data**: Current price, 24h change, volume
- **Rooms**: `price-BNX`

### User Order Updates
- **Frequency**: On order placement/cancellation
- **Data**: User-specific order changes
- **Rooms**: `user-orders-{userId}`

## 🚨 Error Handling

### Connection Issues
- **Auto-reconnection**: Automatic reconnection with exponential backoff
- **Fallback**: API polling when WebSocket unavailable
- **Status Indicators**: Visual connection status

### Error Recovery
- **Graceful Degradation**: Falls back to API calls
- **Error Logging**: Comprehensive error logging
- **User Feedback**: Connection status indicators

## 🔒 Security

### CORS Configuration
```javascript
cors: {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : "http://localhost:3000",
  methods: ["GET", "POST"]
}
```

### Room-based Broadcasting
- Users only receive data they're subscribed to
- Secure room management
- User-specific order updates

## 📈 Performance

### Optimizations

**Minimal Latency:**
- Direct WebSocket connections
- Efficient event broadcasting
- Optimized data serialization
- Low-latency trade execution

**Scalability:**
- Room-based broadcasting
- Efficient client management
- Memory-optimized data structures
- Connection pooling

**Reliability:**
- Automatic reconnection
- Fallback to API polling
- Error recovery mechanisms
- Connection health monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if WebSocket server is running
   - Verify CORS configuration
   - Check network connectivity

2. **No Real-time Updates**
   - Verify subscription to correct rooms
   - Check WebSocket connection status
   - Ensure server is broadcasting events

3. **High Memory Usage**
   - Check for memory leaks in event listeners
   - Verify proper cleanup on component unmount
   - Monitor connection count

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('websocket-debug', 'true');
```

## 📚 API Integration

### Order Placement
```javascript
// WebSocket automatically broadcasts on order placement
const response = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify(orderData)
});
```

### Order Cancellation
```javascript
// WebSocket automatically broadcasts on order cancellation
const response = await fetch(`/api/orders/${orderId}`, {
  method: 'DELETE'
});
```

## 🎨 UI Components

### Connection Status
```javascript
<WebSocketStatus />
```

### Live Trades
```javascript
<LiveTrades maxTrades={20} />
```

### Real-time Order Book
```javascript
<OrderBook maxOrders={10} />
```

### Price Chart
```javascript
<BnxPriceChart />
```

## 🔄 Data Flow

1. **User Action** → API Call
2. **API Processing** → Database Update
3. **WebSocket Broadcast** → All Subscribed Clients
4. **Client Update** → UI Refresh
5. **Real-time Display** → User Sees Changes

## 📝 Development Notes

### Adding New Events
1. Add event handler in `websocket-server.js`
2. Add client method in `websocket-client.js`
3. Add React hook in `useWebSocket.js`
4. Update components to use new events

### Testing New Features
1. Add test cases in `/test-websocket`
2. Verify multi-session updates
3. Check error handling
4. Test performance impact

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_WS_URL=wss://your-domain.com
```

### Server Configuration
- Use production WebSocket server
- Configure proper CORS settings
- Set up SSL/TLS for WSS
- Monitor connection limits

### Monitoring
- Track connection count
- Monitor message frequency
- Check error rates
- Performance metrics

---

**Real-time trading system is now fully operational with WebSocket integration!** 🎉

