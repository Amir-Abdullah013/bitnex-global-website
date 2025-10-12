'use client';

import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import { useToast, ToastContainer } from '../../../components/Toast';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('status', filter);
      }
      
      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        addToast(data.error || 'Failed to fetch orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        addToast('Order cancelled successfully', 'success');
        fetchOrders(); // Refresh orders
      } else {
        addToast(data.error || 'Failed to cancel order', 'error');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      addToast('Network error. Please try again.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'FILLED':
        return 'text-binance-green';
      case 'PARTIALLY_FILLED':
        return 'text-binance-primary';
      case 'PENDING':
        return 'text-binance-textSecondary';
      case 'CANCELLED':
        return 'text-binance-textTertiary';
      case 'REJECTED':
        return 'text-binance-red';
      default:
        return 'text-binance-textSecondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'FILLED':
        return '✅';
      case 'PARTIALLY_FILLED':
        return '⏳';
      case 'PENDING':
        return '⏳';
      case 'CANCELLED':
        return '❌';
      case 'REJECTED':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true;
    return order.status === filter;
  });

  if (isLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-binance-surface rounded w-64 mb-6"></div>
            <div className="h-96 bg-binance-surface rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-binance-textPrimary">My Orders</h1>
          <p className="text-binance-textSecondary mt-2">Manage your trading orders</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status)}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-binance-textTertiary text-lg mb-2">No orders found</div>
                <div className="text-binance-textSecondary text-sm">
                  {filter === 'ALL' 
                    ? 'You haven\'t placed any orders yet'
                    : `No ${filter.toLowerCase().replace('_', ' ')} orders`
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-binance-border rounded-lg p-4 hover:bg-binance-surfaceHover transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          order.side === 'BUY' ? 'bg-binance-green' : 'bg-binance-red'
                        }`}></div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-binance-textPrimary">
                              {order.side} {order.type}
                            </span>
                            <span className={`text-sm ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)} {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-binance-textSecondary">
                            {order.amount} BNX {order.price && `@ ${formatCurrency(order.price)}`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-binance-textPrimary">
                          {order.filledAmount > 0 && (
                            <div>
                              Filled: {order.filledAmount.toFixed(2)} / {order.amount} BNX
                            </div>
                          )}
                          <div className="text-binance-textSecondary">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(order.status === 'PENDING' || order.status === 'PARTIALLY_FILLED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-binance-red border-binance-red hover:bg-binance-red/10"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    {order.trades && order.trades.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-binance-border">
                        <div className="text-sm text-binance-textSecondary mb-2">Trades:</div>
                        <div className="space-y-2">
                          {order.trades.map((trade) => (
                            <div key={trade.id} className="flex justify-between text-sm">
                              <span className="text-binance-textPrimary">
                                {trade.amount} BNX @ {formatCurrency(trade.price)}
                              </span>
                              <span className="text-binance-textSecondary">
                                {formatDate(trade.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
};

export default OrdersPage;

