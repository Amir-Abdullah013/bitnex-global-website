import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { orderMatchingEngine } from './order-matching-engine';
import chartDataService from './chart-data-service';

const prisma = new PrismaClient();

class WebSocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.FRONTEND_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    this.startPeriodicUpdates();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle room joins for specific trading pairs
      socket.on('join-trading-room', (tradingPair) => {
        socket.join(`trading-${tradingPair}`);
        console.log(`Client ${socket.id} joined trading room: ${tradingPair}`);
      });

      // Handle order book subscription
      socket.on('subscribe-orderbook', (tradingPair) => {
        socket.join(`orderbook-${tradingPair}`);
        console.log(`Client ${socket.id} subscribed to orderbook: ${tradingPair}`);
        // Send current order book immediately
        this.sendOrderBook(tradingPair);
      });

      // Handle trades subscription
      socket.on('subscribe-trades', (tradingPair) => {
        socket.join(`trades-${tradingPair}`);
        console.log(`Client ${socket.id} subscribed to trades: ${tradingPair}`);
        // Send recent trades immediately
        this.sendRecentTrades(tradingPair);
      });

      // Handle price updates subscription
      socket.on('subscribe-price', (symbol) => {
        socket.join(`price-${symbol}`);
        console.log(`Client ${socket.id} subscribed to price: ${symbol}`);
        // Send current price immediately
        this.sendCurrentPrice(symbol);
      });

      // Handle chart data subscription
      socket.on('subscribe-chart', (data) => {
        const { symbol, timeframe } = data;
        const roomName = `chart-${symbol}-${timeframe}`;
        socket.join(roomName);
        console.log(`Client ${socket.id} subscribed to chart: ${symbol} ${timeframe}`);
        // Send current chart data immediately
        this.sendChartData(symbol, timeframe);
      });

      // Handle user-specific order updates
      socket.on('subscribe-user-orders', (userId) => {
        socket.join(`user-orders-${userId}`);
        console.log(`Client ${socket.id} subscribed to user orders: ${userId}`);
      });

      // Handle unsubscribe events
      socket.on('unsubscribe-orderbook', (tradingPair) => {
        socket.leave(`orderbook-${tradingPair}`);
        console.log(`Client ${socket.id} unsubscribed from orderbook: ${tradingPair}`);
      });

      socket.on('unsubscribe-trades', (tradingPair) => {
        socket.leave(`trades-${tradingPair}`);
        console.log(`Client ${socket.id} unsubscribed from trades: ${tradingPair}`);
      });

      socket.on('unsubscribe-price', (symbol) => {
        socket.leave(`price-${symbol}`);
        console.log(`Client ${socket.id} unsubscribed from price: ${symbol}`);
      });

      socket.on('unsubscribe-user-orders', (userId) => {
        socket.leave(`user-orders-${userId}`);
        console.log(`Client ${socket.id} unsubscribed from user orders: ${userId}`);
      });

      socket.on('unsubscribe-chart', (data) => {
        const { symbol, timeframe } = data;
        const roomName = `chart-${symbol}-${timeframe}`;
        socket.leave(roomName);
        console.log(`Client ${socket.id} unsubscribed from chart: ${symbol} ${timeframe}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Start periodic updates for real-time data
  startPeriodicUpdates() {
    // Update order book every 1 second
    setInterval(() => {
      this.broadcastOrderBook('BNX/USD');
    }, 1000);

    // Update price every 2 seconds
    setInterval(() => {
      this.broadcastPrice('BNX');
    }, 2000);

    // Update recent trades every 3 seconds
    setInterval(() => {
      this.broadcastRecentTrades('BNX/USD');
    }, 3000);

    // Update chart data every 5 seconds for active symbols
    setInterval(() => {
      this.broadcastChartUpdates();
    }, 5000);
  }

  // Broadcast order book updates
  async broadcastOrderBook(tradingPair) {
    try {
      const orderBook = await orderMatchingEngine.getOrderBook(20);
      this.io.to(`orderbook-${tradingPair}`).emit('orderbook-update', {
        tradingPair,
        orderBook,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting order book:', error);
    }
  }

  // Send order book to specific room
  async sendOrderBook(tradingPair) {
    try {
      const orderBook = await orderMatchingEngine.getOrderBook(20);
      this.io.to(`orderbook-${tradingPair}`).emit('orderbook-update', {
        tradingPair,
        orderBook,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending order book:', error);
    }
  }

  // Broadcast price updates
  async broadcastPrice(symbol) {
    try {
      const currentPrice = await this.getCurrentPrice(symbol);
      this.io.to(`price-${symbol}`).emit('price-update', {
        symbol,
        price: currentPrice.price,
        change24h: currentPrice.change24h,
        volume24h: currentPrice.volume24h,
        high24h: currentPrice.high24h,
        low24h: currentPrice.low24h,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting price:', error);
    }
  }

  // Send current price to specific room
  async sendCurrentPrice(symbol) {
    try {
      const currentPrice = await this.getCurrentPrice(symbol);
      this.io.to(`price-${symbol}`).emit('price-update', {
        symbol,
        price: currentPrice.price,
        change24h: currentPrice.change24h,
        volume24h: currentPrice.volume24h,
        high24h: currentPrice.high24h,
        low24h: currentPrice.low24h,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending current price:', error);
    }
  }

  // Get current price data
  async getCurrentPrice(symbol) {
    try {
      const latestPrice = await prisma.price.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' }
      });

      if (latestPrice) {
        // Calculate 24h change
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayPrice = await prisma.price.findFirst({
          where: {
            symbol,
            timestamp: { gte: yesterday }
          },
          orderBy: { timestamp: 'asc' }
        });

        const change24h = yesterdayPrice 
          ? ((latestPrice.price - yesterdayPrice.price) / yesterdayPrice.price) * 100
          : 0;

        return {
          price: latestPrice.price,
          change24h,
          volume24h: latestPrice.volume || 0,
          high24h: latestPrice.price, // Simplified - in real implementation, calculate from 24h data
          low24h: latestPrice.price
        };
      }

      return {
        price: 0.0035, // Default price
        change24h: 0,
        volume24h: 0,
        high24h: 0.0035,
        low24h: 0.0035
      };
    } catch (error) {
      console.error('Error getting current price:', error);
      return {
        price: 0.0035,
        change24h: 0,
        volume24h: 0,
        high24h: 0.0035,
        low24h: 0.0035
      };
    }
  }

  // Broadcast recent trades
  async broadcastRecentTrades(tradingPair) {
    try {
      const trades = await orderMatchingEngine.getRecentTrades(20);
      this.io.to(`trades-${tradingPair}`).emit('trades-update', {
        tradingPair,
        trades,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting recent trades:', error);
    }
  }

  // Send recent trades to specific room
  async sendRecentTrades(tradingPair) {
    try {
      const trades = await orderMatchingEngine.getRecentTrades(20);
      this.io.to(`trades-${tradingPair}`).emit('trades-update', {
        tradingPair,
        trades,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending recent trades:', error);
    }
  }

  // Broadcast new trade
  broadcastNewTrade(trade) {
    this.io.emit('new-trade', {
      trade,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast order book change
  broadcastOrderBookChange(tradingPair) {
    this.broadcastOrderBook(tradingPair);
  }

  // Broadcast user order update
  broadcastUserOrderUpdate(userId, order) {
    this.io.to(`user-orders-${userId}`).emit('user-order-update', {
      order,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast order book change after order placement
  async onOrderPlaced(order, trades) {
    // Broadcast order book update
    this.broadcastOrderBookChange('BNX/USD');
    
    // Broadcast new trades if any
    if (trades && trades.length > 0) {
      trades.forEach(trade => {
        this.broadcastNewTrade(trade);
      });
    }

    // Broadcast user order update
    this.broadcastUserOrderUpdate(order.userId, order);
  }

  // Broadcast order book change after order cancellation
  async onOrderCancelled(order) {
    this.broadcastOrderBookChange('BNX/USD');
    this.broadcastUserOrderUpdate(order.userId, order);
  }

  // Get connected clients count
  getConnectedClientsCount() {
    return this.io.engine.clientsCount;
  }

  // Send chart data to specific room
  async sendChartData(symbol, timeframe) {
    try {
      const chartData = await chartDataService.fetchHistoricalData(symbol, timeframe, 100);
      const roomName = `chart-${symbol}-${timeframe}`;
      
      this.io.to(roomName).emit('chart-data-update', {
        symbol,
        timeframe,
        data: chartData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending chart data:', error);
    }
  }

  // Broadcast chart updates to all active chart rooms
  async broadcastChartUpdates() {
    try {
      const rooms = Array.from(this.io.sockets.adapter.rooms.keys());
      const chartRooms = rooms.filter(room => room.startsWith('chart-'));
      
      for (const room of chartRooms) {
        const [, symbol, timeframe] = room.split('-');
        await this.sendChartData(symbol, timeframe);
      }
    } catch (error) {
      console.error('Error broadcasting chart updates:', error);
    }
  }

  // Broadcast new candle data
  broadcastNewCandle(symbol, timeframe, candleData) {
    const roomName = `chart-${symbol}-${timeframe}`;
    this.io.to(roomName).emit('new-candle', {
      symbol,
      timeframe,
      candle: candleData,
      timestamp: new Date().toISOString()
    });
  }

  // Get rooms info
  getRoomsInfo() {
    return Array.from(this.io.sockets.adapter.rooms.keys());
  }
}

export default WebSocketServer;
