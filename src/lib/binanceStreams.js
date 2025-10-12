/**
 * Enhanced Binance WebSocket Streams
 * Multiple stream connections for comprehensive market data
 */

class BinanceStreams {
  constructor() {
    this.sockets = new Map();
    this.subscribers = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to multiple streams for a symbol
   * @param {string} symbol - Trading pair symbol (e.g., 'btcusdt')
   * @param {Object} callbacks - Callback functions for different data types
   * @returns {string} - Connection ID for cleanup
   */
  connectToSymbol(symbol, callbacks = {}) {
    const normalizedSymbol = symbol.toLowerCase();
    const connectionId = `${normalizedSymbol}_${Date.now()}`;
    
    // Store callbacks
    this.subscribers.set(connectionId, callbacks);
    
    // Create streams array
    const streams = [
      `${normalizedSymbol}@ticker`,      // Price updates
      `${normalizedSymbol}@trade`,       // Recent trades
      `${normalizedSymbol}@depth`,       // Order book
      `${normalizedSymbol}@kline_1m`,    // 1-minute klines
      `${normalizedSymbol}@kline_5m`,    // 5-minute klines
      `${normalizedSymbol}@kline_15m`,   // 15-minute klines
      `${normalizedSymbol}@kline_1h`,   // 1-hour klines
      `${normalizedSymbol}@kline_4h`,    // 4-hour klines
      `${normalizedSymbol}@kline_1d`     // 1-day klines
    ];
    
    const streamNames = streams.join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;
    const ws = new WebSocket(wsUrl);
    
    this.sockets.set(connectionId, ws);
    this.reconnectAttempts.set(connectionId, 0);
    
    ws.onopen = () => {
      console.log(`Connected to Binance streams for ${normalizedSymbol}`);
      this.reconnectAttempts.set(connectionId, 0);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data) {
          this.handleStreamData(connectionId, data.stream, data.data, callbacks);
        }
      } catch (error) {
        console.error('Error parsing stream data:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`Stream closed for ${normalizedSymbol}:`, event.code, event.reason);
      this.handleReconnect(connectionId, normalizedSymbol, callbacks);
    };
    
    ws.onerror = (error) => {
      console.error(`Stream error for ${normalizedSymbol}:`, error);
    };
    
    return connectionId;
  }

  /**
   * Handle incoming stream data
   * @param {string} connectionId - Connection ID
   * @param {string} stream - Stream name
   * @param {Object} data - Stream data
   * @param {Object} callbacks - Callback functions
   */
  handleStreamData(connectionId, stream, data, callbacks) {
    const symbol = data.s || data.symbol;
    
    if (stream.includes('@ticker')) {
      const tickerData = this.formatTickerData(data);
      callbacks.onTicker?.(tickerData);
    } else if (stream.includes('@trade')) {
      const tradeData = this.formatTradeData(data);
      callbacks.onTrade?.(tradeData);
    } else if (stream.includes('@depth')) {
      const depthData = this.formatDepthData(data);
      callbacks.onDepth?.(depthData);
    } else if (stream.includes('@kline')) {
      const klineData = this.formatKlineData(data);
      callbacks.onKline?.(klineData);
    }
  }

  /**
   * Format ticker data
   * @param {Object} data - Raw ticker data
   * @returns {Object} - Formatted ticker data
   */
  formatTickerData(data) {
    const priceChangePercent = parseFloat(data.P || '0');
    const isPositive = priceChangePercent >= 0;
    
    return {
      symbol: data.s || '',
      lastPrice: parseFloat(data.c || '0'),
      priceChange: parseFloat(data.P || '0'),
      priceChangePercent: priceChangePercent,
      volume: parseFloat(data.v || '0'),
      high24h: parseFloat(data.h || '0'),
      low24h: parseFloat(data.l || '0'),
      isPositive,
      formattedPrice: this.formatPrice(parseFloat(data.c || '0')),
      formattedChange: this.formatPrice(parseFloat(data.P || '0')),
      formattedVolume: this.formatVolume(parseFloat(data.v || '0'))
    };
  }

  /**
   * Format trade data
   * @param {Object} data - Raw trade data
   * @returns {Object} - Formatted trade data
   */
  formatTradeData(data) {
    return {
      symbol: data.s || '',
      price: parseFloat(data.p || '0'),
      quantity: parseFloat(data.q || '0'),
      time: data.T || Date.now(),
      isBuyerMaker: data.m || false,
      tradeId: data.t || '',
      formattedPrice: this.formatPrice(parseFloat(data.p || '0')),
      formattedQuantity: this.formatQuantity(parseFloat(data.q || '0'))
    };
  }

  /**
   * Format depth data
   * @param {Object} data - Raw depth data
   * @returns {Object} - Formatted depth data
   */
  formatDepthData(data) {
    return {
      symbol: data.s || '',
      bids: (data.b || []).map(bid => ({
        price: parseFloat(bid[0]),
        quantity: parseFloat(bid[1]),
        formattedPrice: this.formatPrice(parseFloat(bid[0])),
        formattedQuantity: this.formatQuantity(parseFloat(bid[1]))
      })),
      asks: (data.a || []).map(ask => ({
        price: parseFloat(ask[0]),
        quantity: parseFloat(ask[1]),
        formattedPrice: this.formatPrice(parseFloat(ask[0])),
        formattedQuantity: this.formatQuantity(parseFloat(ask[1]))
      })),
      lastUpdateId: data.u || 0
    };
  }

  /**
   * Format kline data
   * @param {Object} data - Raw kline data
   * @returns {Object} - Formatted kline data
   */
  formatKlineData(data) {
    const k = data.k;
    return {
      symbol: k.s || '',
      openTime: k.t || 0,
      closeTime: k.T || 0,
      open: parseFloat(k.o || '0'),
      high: parseFloat(k.h || '0'),
      low: parseFloat(k.l || '0'),
      close: parseFloat(k.c || '0'),
      volume: parseFloat(k.v || '0'),
      quoteVolume: parseFloat(k.q || '0'),
      trades: k.n || 0,
      isClosed: k.x || false,
      interval: k.i || '1m',
      formattedOpen: this.formatPrice(parseFloat(k.o || '0')),
      formattedHigh: this.formatPrice(parseFloat(k.h || '0')),
      formattedLow: this.formatPrice(parseFloat(k.l || '0')),
      formattedClose: this.formatPrice(parseFloat(k.c || '0')),
      formattedVolume: this.formatVolume(parseFloat(k.v || '0'))
    };
  }

  /**
   * Format price with appropriate decimal places
   * @param {number} price - Price value
   * @returns {string} - Formatted price string
   */
  formatPrice(price) {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 4 
      });
    } else {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 8 
      });
    }
  }

  /**
   * Format quantity with appropriate decimal places
   * @param {number} quantity - Quantity value
   * @returns {string} - Formatted quantity string
   */
  formatQuantity(quantity) {
    if (quantity >= 1000) {
      return quantity.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else if (quantity >= 1) {
      return quantity.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 4 
      });
    } else {
      return quantity.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 8 
      });
    }
  }

  /**
   * Format volume with appropriate units
   * @param {number} volume - Volume value
   * @returns {string} - Formatted volume string
   */
  formatVolume(volume) {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    } else {
      return volume.toFixed(2);
    }
  }

  /**
   * Handle reconnection logic
   * @param {string} connectionId - Connection ID
   * @param {string} symbol - Symbol to reconnect
   * @param {Object} callbacks - Callback functions
   */
  handleReconnect(connectionId, symbol, callbacks) {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, attempts);
      console.log(`Reconnecting streams in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts.set(connectionId, attempts + 1);
        this.connectToSymbol(symbol, callbacks);
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${connectionId}`);
      this.cleanup(connectionId);
    }
  }

  /**
   * Disconnect and cleanup a specific connection
   * @param {string} connectionId - Connection ID to cleanup
   */
  disconnect(connectionId) {
    const ws = this.sockets.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    
    this.cleanup(connectionId);
  }

  /**
   * Cleanup connection resources
   * @param {string} connectionId - Connection ID to cleanup
   */
  cleanup(connectionId) {
    this.sockets.delete(connectionId);
    this.subscribers.delete(connectionId);
    this.reconnectAttempts.delete(connectionId);
  }

  /**
   * Disconnect all connections
   */
  disconnectAll() {
    for (const [connectionId, ws] of this.sockets) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    
    this.sockets.clear();
    this.subscribers.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Get connection status
   * @param {string} connectionId - Connection ID
   * @returns {Object} - Connection status
   */
  getConnectionStatus(connectionId) {
    const ws = this.sockets.get(connectionId);
    if (!ws) {
      return { connected: false, readyState: 'CLOSED' };
    }
    
    return {
      connected: ws.readyState === WebSocket.OPEN,
      readyState: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState]
    };
  }
}

// Create singleton instance
const binanceStreams = new BinanceStreams();

/**
 * Connect to all streams for a symbol
 * @param {string} symbol - Trading pair symbol
 * @param {Object} callbacks - Callback functions
 * @returns {string} - Connection ID
 */
export const connectToSymbolStreams = (symbol, callbacks) => {
  return binanceStreams.connectToSymbol(symbol, callbacks);
};

/**
 * Disconnect from symbol streams
 * @param {string} connectionId - Connection ID
 */
export const disconnectFromSymbolStreams = (connectionId) => {
  binanceStreams.disconnect(connectionId);
};

/**
 * Disconnect from all streams
 */
export const disconnectFromAllStreams = () => {
  binanceStreams.disconnectAll();
};

/**
 * Get connection status
 * @param {string} connectionId - Connection ID
 * @returns {Object} - Connection status
 */
export const getStreamConnectionStatus = (connectionId) => {
  return binanceStreams.getConnectionStatus(connectionId);
};

export default binanceStreams;


