import { io } from 'socket.io-client';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.pendingSubscriptions = [];
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Try to connect to WebSocket server, fallback to polling if not available
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_WS_URL || 'wss://your-domain.com'
      : 'http://localhost:3001';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection-status', { connected: true });
      
      // Process pending subscriptions
      this.processPendingSubscriptions();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection-status', { connected: false, reason });
      
      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error (falling back to API polling):', error.message);
      this.emit('connection-error', error);
      // Don't attempt reconnection if server is not available
      this.reconnectAttempts = this.maxReconnectAttempts;
    });

    // Order book updates
    this.socket.on('orderbook-update', (data) => {
      this.emit('orderbook-update', data);
    });

    // Price updates
    this.socket.on('price-update', (data) => {
      this.emit('price-update', data);
    });

    // Trades updates
    this.socket.on('trades-update', (data) => {
      this.emit('trades-update', data);
    });

    // New trade
    this.socket.on('new-trade', (data) => {
      this.emit('new-trade', data);
    });

    // User order updates
    this.socket.on('user-order-update', (data) => {
      this.emit('user-order-update', data);
    });
  }

  // Process pending subscriptions when connection is established
  processPendingSubscriptions() {
    while (this.pendingSubscriptions.length > 0) {
      const { type, ...params } = this.pendingSubscriptions.shift();
      this.socket.emit(type, Object.values(params)[0]);
    }
  }

  // Subscribe to order book updates
  subscribeToOrderBook(tradingPair = 'BNX/USD') {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-orderbook', tradingPair);
    } else {
      this.pendingSubscriptions.push({ type: 'subscribe-orderbook', tradingPair });
    }
  }

  // Subscribe to trades updates
  subscribeToTrades(tradingPair = 'BNX/USD') {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-trades', tradingPair);
    } else {
      this.pendingSubscriptions.push({ type: 'subscribe-trades', tradingPair });
    }
  }

  // Subscribe to price updates
  subscribeToPrice(symbol = 'BNX') {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-price', symbol);
    } else {
      this.pendingSubscriptions.push({ type: 'subscribe-price', symbol });
    }
  }

  // Subscribe to user order updates
  subscribeToUserOrders(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-user-orders', userId);
    } else {
      this.pendingSubscriptions.push({ type: 'subscribe-user-orders', userId });
    }
  }

  // Join trading room
  joinTradingRoom(tradingPair = 'BNX/USD') {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-trading-room', tradingPair);
    } else {
      this.pendingSubscriptions.push({ type: 'join-trading-room', tradingPair });
    }
  }

  // Unsubscribe from order book
  unsubscribeFromOrderBook(tradingPair = 'BNX/USD') {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-orderbook', tradingPair);
    }
  }

  // Unsubscribe from trades
  unsubscribeFromTrades(tradingPair = 'BNX/USD') {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-trades', tradingPair);
    }
  }

  // Unsubscribe from price
  unsubscribeFromPrice(symbol = 'BNX') {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-price', symbol);
    }
  }

  // Unsubscribe from user orders
  unsubscribeFromUserOrders(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-user-orders', userId);
    }
  }

  // Subscribe to chart data
  subscribeToChart(symbol, timeframe) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-chart', { symbol, timeframe });
    } else {
      this.pendingSubscriptions.push({ type: 'subscribe-chart', symbol, timeframe });
    }
  }

  // Unsubscribe from chart data
  unsubscribeFromChart(symbol, timeframe) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-chart', { symbol, timeframe });
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const webSocketClient = new WebSocketClient();

export default webSocketClient;
