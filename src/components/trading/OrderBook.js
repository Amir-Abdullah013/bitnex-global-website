/**
 * Live Order Book Component
 * Real-time order book with bids and asks
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const OrderBook = ({ 
  symbol = 'BTCUSDT',
  maxOrders = 20,
  showSpread = true,
  className = ''
}) => {
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
    spread: 0,
    spreadPercent: 0,
    lastUpdateId: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Memoized order book data for performance
  const processedOrderBook = useMemo(() => {
    const { bids, asks, spread, spreadPercent } = orderBook;
    
    // Calculate cumulative quantities for visualization
    const processedBids = bids.slice(0, maxOrders).map((bid, index) => {
      const cumulative = bids.slice(0, index + 1).reduce((sum, b) => sum + b.quantity, 0);
      return {
        ...bid,
        cumulative,
        percentage: (bid.quantity / cumulative) * 100
      };
    });

    const processedAsks = asks.slice(0, maxOrders).map((ask, index) => {
      const cumulative = asks.slice(0, index + 1).reduce((sum, a) => sum + a.quantity, 0);
      return {
        ...ask,
        cumulative,
        percentage: (ask.quantity / cumulative) * 100
      };
    });

    return {
      bids: processedBids,
      asks: processedAsks,
      spread,
      spreadPercent
    };
  }, [orderBook, maxOrders]);

  const getPriceColor = (isBid) => {
    return isBid ? '#0ECB81' : '#F6465D';
  };

  const getQuantityColor = (isBid) => {
    return isBid ? '#0ECB81' : '#F6465D';
  };

  const formatPrice = (price) => {
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
  };

  const formatQuantity = (quantity) => {
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
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`
        bg-[#1E2329] rounded-lg border border-[#2B3139]
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2B3139]">
        <div className="flex items-center space-x-2">
          <Activity size={16} className="text-[#EAECEF]" />
          <span className="text-sm font-medium text-[#EAECEF]">
            Order Book
          </span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
        </div>
        
        {showSpread && (
          <div className="text-right">
            <div className="text-xs text-[#B7BDC6]">Spread</div>
            <div className="text-sm font-medium text-[#EAECEF]">
              {formatPrice(orderBook.spread)}
            </div>
            <div className="text-xs text-[#B7BDC6]">
              ({orderBook.spreadPercent.toFixed(2)}%)
            </div>
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs text-[#B7BDC6] border-b border-[#2B3139]">
        <div className="text-right">Price</div>
        <div className="text-right">Quantity</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="space-y-0">
        {processedOrderBook.asks.map((ask, index) => (
          <motion.div
            key={`ask-${ask.price}-${index}}`}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            transition={{ delay: index * 0.01 }}
            className="
              grid grid-cols-3 gap-4 px-4 py-1 
              hover:bg-[#2B3139]/50 transition-colors
              cursor-pointer group relative
            "
            style={{
              background: `linear-gradient(to right, rgba(246, 70, 93, 0.1) ${ask.percentage}%, transparent ${ask.percentage}%)`
            }}
          >
            <div className="text-right text-[#F6465D] font-medium group-hover:text-white">
              {formatPrice(ask.price)}
            </div>
            <div className="text-right text-[#EAECEF] group-hover:text-white">
              {formatQuantity(ask.quantity)}
            </div>
            <div className="text-right text-[#B7BDC6] group-hover:text-[#EAECEF]">
              {formatQuantity(ask.cumulative)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Spread Line */}
      {showSpread && orderBook.spread > 0 && (
        <div className="border-t border-b border-[#2B3139] py-2">
          <div className="text-center text-xs text-[#B7BDC6]">
            Spread: {formatPrice(orderBook.spread)} ({orderBook.spreadPercent.toFixed(2)}%)
          </div>
        </div>
      )}

      {/* Bids (Buy Orders) */}
      <div className="space-y-0">
        {processedOrderBook.bids.map((bid, index) => (
          <motion.div
            key={`bid-${bid.price}-${index}`}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            transition={{ delay: index * 0.01 }}
            className="
              grid grid-cols-3 gap-4 px-4 py-1 
              hover:bg-[#2B3139]/50 transition-colors
              cursor-pointer group relative
            "
            style={{
              background: `linear-gradient(to right, rgba(14, 203, 129, 0.1) ${bid.percentage}%, transparent ${bid.percentage}%)`
            }}
          >
            <div className="text-right text-[#0ECB81] font-medium group-hover:text-white">
              {formatPrice(bid.price)}
            </div>
            <div className="text-right text-[#EAECEF] group-hover:text-white">
              {formatQuantity(bid.quantity)}
            </div>
            <div className="text-right text-[#B7BDC6] group-hover:text-[#EAECEF]">
              {formatQuantity(bid.cumulative)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#2B3139]">
        <div className="flex items-center justify-between text-xs text-[#B7BDC6]">
          <span>Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</span>
          <span>{processedOrderBook.bids.length + processedOrderBook.asks.length} orders</span>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderBook;


