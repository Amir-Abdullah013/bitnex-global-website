const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3001;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Initialize Socket.io server
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // WebSocket server setup
  io.on('connection', (socket) => {
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
    });

    // Handle trades subscription
    socket.on('subscribe-trades', (tradingPair) => {
      socket.join(`trades-${tradingPair}`);
      console.log(`Client ${socket.id} subscribed to trades: ${tradingPair}`);
    });

    // Handle price updates subscription
    socket.on('subscribe-price', (symbol) => {
      socket.join(`price-${symbol}`);
      console.log(`Client ${socket.id} subscribed to price: ${symbol}`);
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

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server running on ws://${hostname}:${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
});


