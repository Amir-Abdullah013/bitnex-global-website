/**
 * Binance WebSocket Helper
 * Real-time cryptocurrency price data from Binance API
 */

class BinanceSocket {
  constructor() {
    this.sockets = new Map();
    this.subscribers = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to Binance WebSocket for a specific symbol
   * @param {string} symbol - Trading pair symbol (e.g., 'btcusdt')
   * @param {Function} callback - Callback function for price updates
   * @returns {string} - Connection ID for cleanup
   */
  connect(symbol, callback) {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      console.error('WebSocket is not available in this environment');
      return null;
    }
    
    // Validate input
    if (!symbol || typeof symbol !== 'string') {
      console.error('Invalid symbol provided to connect');
      return null;
    }
    
    if (typeof callback !== 'function') {
      console.error('Callback function is required for connect');
      return null;
    }
    
    const normalizedSymbol = symbol.toLowerCase().trim();
    
    if (!normalizedSymbol) {
      console.error('Empty symbol provided to connect');
      return null;
    }
    
    // Use WebSocket manager with CSP handling
    const wsUrl = `wss://stream.binance.com:9443/ws/${normalizedSymbol}@ticker`;
    console.log(`Connecting to Binance WebSocket for symbol: ${normalizedSymbol}`);
    console.log(`WebSocket URL: ${wsUrl}`);
    
    return this.connectWithFallback(wsUrl, callback, { symbol: normalizedSymbol });
  }

  /**
   * Connect to multiple symbols at once
   * @param {Array} symbols - Array of trading pair symbols
   * @param {Function} callback - Callback function for price updates
   * @returns {string} - Connection ID for cleanup
   */
  connectMultiple(symbols, callback) {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      console.error('WebSocket is not available in this environment');
      return null;
    }
    
    // Validate input
    if (!Array.isArray(symbols) || symbols.length === 0) {
      console.error('Invalid symbols array provided to connectMultiple');
      return null;
    }
    
    if (typeof callback !== 'function') {
      console.error('Callback function is required for connectMultiple');
      return null;
    }
    
    const normalizedSymbols = symbols.map(s => s.toLowerCase()).filter(s => s && s.length > 0);
    
    if (normalizedSymbols.length === 0) {
      console.error('No valid symbols provided to connectMultiple');
      return null;
    }
    
    // Use WebSocket manager with CSP handling
    const streamNames = normalizedSymbols.map(s => `${s}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;
    
    console.log(`Connecting to Binance WebSocket for symbols: ${normalizedSymbols.join(', ')}`);
    console.log(`WebSocket URL: ${wsUrl}`);
    
    return this.connectWithFallback(wsUrl, callback, { symbols: normalizedSymbols });
  }

  /**
   * Format ticker data from Binance API
   * @param {Object} data - Raw ticker data from Binance
   * @returns {Object} - Formatted ticker data
   */
  formatTickerData(data) {
    const priceChangePercent = parseFloat(data.P || '0');
    const isPositive = priceChangePercent >= 0;
    
    return {
      symbol: data.s || '',
      baseAsset: data.s?.replace('USDT', '').replace('BTC', '').replace('ETH', '') || '',
      quoteAsset: data.s?.includes('USDT') ? 'USDT' : data.s?.includes('BTC') ? 'BTC' : 'ETH',
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
   * @param {string|Array} symbols - Symbol(s) to reconnect
   * @param {Function} callback - Callback function
   */
  handleReconnect(connectionId, symbols, callback) {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, attempts);
      console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts.set(connectionId, attempts + 1);
        
        if (Array.isArray(symbols)) {
          this.connectMultiple(symbols, callback);
        } else {
          this.connect(symbols, callback);
        }
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
    const connection = this.sockets.get(connectionId);
    if (connection) {
      if (connection.type === 'polling' && connection.intervalId) {
        clearInterval(connection.intervalId);
      } else if (connection.readyState === WebSocket.OPEN) {
        connection.close();
      }
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
    for (const [connectionId, connection] of this.sockets) {
      if (connection) {
        if (connection.type === 'polling' && connection.intervalId) {
          clearInterval(connection.intervalId);
        } else if (connection.readyState === WebSocket.OPEN) {
          connection.close();
        }
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
    const connection = this.sockets.get(connectionId);
    if (!connection) {
      return { connected: false, readyState: 'CLOSED' };
    }
    
    if (connection.type === 'polling') {
      return {
        connected: true,
        readyState: 'POLLING',
        type: 'polling'
      };
    }
    
    return {
      connected: connection.readyState === WebSocket.OPEN,
      readyState: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][connection.readyState]
    };
  }

  /**
   * Connect with WebSocket fallback to HTTP polling
   */
  async connectWithFallback(wsUrl, callback, options = {}) {
    const connectionId = `${options.symbol || 'ws'}_${Date.now()}`;
    
    try {
      // Try WebSocket first
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`WebSocket connected: ${wsUrl}`);
        this.connections.set(connectionId, ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket error, falling back to HTTP polling:', error);
        this.connections.delete(connectionId);
        // Fallback to polling
        this.startPolling(options.symbol, callback, 5000);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        this.connections.delete(connectionId);
      };

      return connectionId;
    } catch (error) {
      console.warn('WebSocket connection failed, using HTTP polling:', error);
      return this.startPolling(options.symbol, callback, 5000);
    }
  }

  /**
   * Check if WebSocket connections are blocked by CSP
   * @returns {boolean} - True if WebSocket is blocked
   */
  isWebSocketBlocked() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return true; // Server-side, use polling
    }
    
    // Check for CSP violations by looking at console errors
    const originalError = console.error;
    let cspError = false;
    
    console.error = function(...args) {
      if (args.some(arg => typeof arg === 'string' && arg.includes('CSP'))) {
        cspError = true;
      }
      originalError.apply(console, args);
    };
    
    try {
      // Try to create a test WebSocket connection
      const testWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
      
      // Reset console.error
      console.error = originalError;
      
      // If we get here without CSP error, WebSocket should work
      if (cspError) {
        testWs.close();
        return true;
      }
      
      testWs.close();
      return false;
    } catch (error) {
      // Reset console.error
      console.error = originalError;
      return true;
    }
  }

  /**
   * Fallback HTTP polling method
   * @param {string|Array} symbols - Symbol(s) to poll
   * @param {Function} callback - Callback function
   * @param {number} interval - Polling interval in milliseconds
   * @returns {string} - Polling ID for cleanup
   */
  startPolling(symbols, callback, interval = 5000) {
    const pollingId = `polling_${Date.now()}`;
    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    
    const pollData = async () => {
      try {
        const promises = symbolsArray.map(async (symbol) => {
          try {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              mode: 'cors'
            });
            
            if (response.ok) {
              const data = await response.json();
              return this.formatTickerData(data);
            } else {
              console.warn(`Failed to fetch data for ${symbol}: ${response.status}`);
              return null;
            }
          } catch (fetchError) {
            console.warn(`Error fetching data for ${symbol}:`, fetchError);
            return null;
          }
        });
        
        const results = await Promise.all(promises);
        const validResults = results.filter(result => result !== null);
        
        if (validResults.length > 0) {
          validResults.forEach(result => callback(result));
        }
      } catch (error) {
        console.error('HTTP polling error:', error);
      }
    };
    
    // Start polling immediately
    pollData();
    
    // Set up interval
    const intervalId = setInterval(pollData, interval);
    
    // Store polling reference for cleanup
    this.sockets.set(pollingId, { intervalId, type: 'polling' });
    this.subscribers.set(pollingId, callback);
    
    return pollingId;
  }
}

// Create singleton instance
const binanceSocket = new BinanceSocket();

/**
 * Connect to a single symbol
 * @param {string} symbol - Trading pair symbol
 * @param {Function} callback - Callback function
 * @returns {string} - Connection ID
 */
export const connectToSymbol = (symbol, callback) => {
  return binanceSocket.connect(symbol, callback);
};

/**
 * Connect to multiple symbols
 * @param {Array} symbols - Array of trading pair symbols
 * @param {Function} callback - Callback function
 * @returns {string} - Connection ID
 */
export const connectToMultipleSymbols = (symbols, callback) => {
  return binanceSocket.connectMultiple(symbols, callback);
};

/**
 * Disconnect from a specific symbol
 * @param {string} connectionId - Connection ID
 */
export const disconnectFromSymbol = (connectionId) => {
  binanceSocket.disconnect(connectionId);
};

/**
 * Disconnect from all symbols
 */
export const disconnectFromAllSymbols = () => {
  binanceSocket.disconnectAll();
};

/**
 * Get connection status
 * @param {string} connectionId - Connection ID
 * @returns {Object} - Connection status
 */
export const getConnectionStatus = (connectionId) => {
  return binanceSocket.getConnectionStatus(connectionId);
};

export default binanceSocket;
