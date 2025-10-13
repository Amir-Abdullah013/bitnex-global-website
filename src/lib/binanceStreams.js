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
   * Connect to a single stream for a symbol (maintains original functionality)
   * @param {string} symbol - Trading pair symbol (e.g., 'btcusdt')
   * @param {Object} callbacks - Callback functions for different data types
   * @returns {string} - Connection ID for cleanup
   */
  connectToSymbol(symbol, callbacks = {}) {
    const normalizedSymbol = symbol.toLowerCase();
    const connectionId = `${normalizedSymbol}_${Date.now()}`;
    
    // Store callbacks
    this.subscribers.set(connectionId, callbacks);
    
    // Create streams array for ONE symbol
    const streams = [
      `${normalizedSymbol}@ticker`,      // Price updates
      `${normalizedSymbol}@trade`,       // Recent trades
      `${normalizedSymbol}@depth`,       // Order book
      `${normalizedSymbol}@kline_1m`,    // 1-minute klines
      `${normalizedSymbol}@kline_5m`,    // 5-minute klines
      `${normalizedSymbol}@kline_15m`,   // 15-minute klines
      `${normalizedSymbol}@kline_1h`,   // 1-hour klines
      `${normalizedSymbol}@kline_4h`,    // 4-hour klines
      `${normalizedSymbol}@kline_1d`     // 1-day klines
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
          // Pass the connectionId's callbacks to handle the data
          this.handleStreamData(connectionId, data.stream, data.data, this.subscribers.get(connectionId));
        }
      } catch (error) {
        console.error('Error parsing stream data:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`Stream closed for ${normalizedSymbol}:`, event.code, event.reason);
      this.handleReconnect(connectionId, normalizedSymbol, this.subscribers.get(connectionId));
    };
    
    ws.onerror = (error) => {
      console.error(`Stream error for ${normalizedSymbol}:`, error);
    };
    
    return connectionId;
  }

  // --- NEW METHOD FOR FIXING THE MULTIPLE SYMBOLS ISSUE ---
  /**
   * Connect to one stream (e.g., @ticker) for multiple symbols.
   * This is the function you should use to populate your 'Top Gainers' table.
   * @param {Array<string>} symbols - Array of trading pair symbols (e.g., ['BTCUSDT', 'ETHUSDT'])
   * @param {Object} callbacks - Callback functions (should primarily use onTicker)
   * @returns {string} - Connection ID for cleanup
   */
  connectToMultipleSymbols(symbols, callbacks = {}) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
        console.error('Invalid symbols array provided to connectToMultipleSymbols');
        return null;
    }

    // Create a unique connection ID based on the first symbol
    const normalizedSymbols = symbols.map(s => s.toLowerCase());
    const connectionId = `multi_${normalizedSymbols[0]}_${Date.now()}`;
    
    // Store callbacks
    this.subscribers.set(connectionId, callbacks);
    
    // Create ONE combined stream array for the @ticker stream for all symbols
    const streamNames = normalizedSymbols
        .map(s => `${s}@ticker`)
        .join('/');

    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;
    const ws = new new WebSocket(wsUrl); // <-- Assuming you have WebSocket defined globally
    
    this.sockets.set(connectionId, ws);
    this.reconnectAttempts.set(connectionId, 0);
    
    ws.onopen = () => {
      console.log(`Connected to Binance multi-ticker stream for ${normalizedSymbols.length} symbols.`);
      this.reconnectAttempts.set(connectionId, 0);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data) {
          // Use the central handler to parse and distribute the data
          this.handleStreamData(connectionId, data.stream, data.data, this.subscribers.get(connectionId));
        }
      } catch (error) {
        console.error('Error parsing multi-stream data:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`Multi-stream closed:`, event.code, event.reason);
      // For simplicity, we only try to reconnect the single stream in the original design.
      // A more robust solution would track all symbols for reconnection here.
      // Reconnecting to the single combined stream URL is the easiest fix:
      this.handleReconnect(connectionId, symbols, this.subscribers.get(connectionId)); 
    };
    
    ws.onerror = (error) => {
      console.error(`Multi-stream error:`, error);
    };
    
    return connectionId;
  }
  // --- END OF NEW METHOD ---


  /**
   * Handle incoming stream data
   * @param {string} connectionId - Connection ID
   * @param {string} stream - Stream name
   * @param {Object} data - Stream data
   * @param {Object} callbacks - Callback functions
   */
  handleStreamData(connectionId, stream, data, callbacks) {
    // The symbol is inside the data payload for all streams
    const symbol = data.s || data.symbol; 
    
    if (!callbacks) {
        console.warn(`No callbacks found for connection ${connectionId}`);
        return;
    }

    if (stream.includes('@ticker')) {
      const tickerData = this.formatTickerData(data);
      // The callback needs to handle the ticker data for ANY symbol on the stream
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

  // ... (formatTickerData, formatTradeData, formatDepthData, formatKlineData, formatPrice, formatQuantity, formatVolume, handleReconnect, disconnect, cleanup, disconnectAll, getConnectionStatus methods remain the same) ...

  // To save space, I'll only show the handleReconnect function with the array check update

  /**
   * Handle reconnection logic (Updated to handle Array for multi-stream)
   * @param {string} connectionId - Connection ID
   * @param {string | Array<string>} symbolOrSymbols - Symbol or Array of Symbols to reconnect
   * @param {Object} callbacks - Callback functions
   */
  handleReconnect(connectionId, symbolOrSymbols, callbacks) {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, attempts);
      console.log(`Reconnecting streams in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts.set(connectionId, attempts + 1);
        
        if (Array.isArray(symbolOrSymbols)) {
            // Reconnect using the new multi-symbol function
            this.connectToMultipleSymbols(symbolOrSymbols, callbacks); 
        } else {
            // Reconnect using the original single symbol function
            this.connectToSymbol(symbolOrSymbols, callbacks); 
        }
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${connectionId}`);
      this.cleanup(connectionId);
    }
  }

  // --------------------------------------------------------------------------------------------------------------------------------------------------
  // NOTE: All other methods (formatTickerData, formatTradeData, etc.) are assumed to be pasted here exactly as they were, 
  // but with the updated handleReconnect replacing the original one.
  // --------------------------------------------------------------------------------------------------------------------------------------------------
}

// Create singleton instance
const binanceStreams = new BinanceStreams();

/**
 * Connect to all streams for a single symbol
 * @param {string} symbol - Trading pair symbol
 * @param {Object} callbacks - Callback functions
 * @returns {string} - Connection ID
 */
export const connectToSymbolStreams = (symbol, callbacks) => {
  return binanceStreams.connectToSymbol(symbol, callbacks);
};

// --- NEW EXPORT FOR FIXING THE UI ISSUE ---
/**
 * Connect to a single @ticker stream for multiple symbols (use for Top Gainers list).
 * @param {Array<string>} symbols - Array of trading pair symbols
 * @param {Object} callbacks - Callback functions (use onTicker)
 * @returns {string} - Connection ID
 */
export const connectToMultipleTickerStreams = (symbols, callbacks) => {
    return binanceStreams.connectToMultipleSymbols(symbols, callbacks);
};
// --- END NEW EXPORT ---


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
