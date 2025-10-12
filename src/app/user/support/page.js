'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../../components/Layout';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Search,
  Filter,
  Book,
  MessageCircle,
  Mail,
  Phone,
  AlertCircle,
  Ticket,
  TrendingUp,
  BarChart3,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { authHelpers } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function UserSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [user, setUser] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    loadUserAndTickets();
  }, []);

  const loadUserAndTickets = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      
      // Mock tickets for demo
      const mockTickets = [
        {
          $id: '1',
          subject: 'Withdrawal Issue - Transaction Pending',
          status: 'open',
          priority: 'high',
          category: 'withdrawal',
          messages: [
            { message: 'I initiated a withdrawal 24 hours ago but it\'s still pending. Can you please check?', sender: 'user', timestamp: new Date(Date.now() - 86400000) }
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          $id: '2',
          subject: 'Question about Trading Fees',
          status: 'responded',
          priority: 'medium',
          category: 'trading',
          messages: [
            { message: 'What are the trading fees for BNX/USDT pair?', sender: 'user', timestamp: new Date(Date.now() - 172800000) },
            { message: 'The trading fee is 0.1% for maker and taker orders.', sender: 'support', timestamp: new Date(Date.now() - 86400000) }
          ],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          $id: '3',
          subject: 'Account Verification Status',
          status: 'closed',
          priority: 'low',
          category: 'account',
          messages: [
            { message: 'How long does account verification take?', sender: 'user', timestamp: new Date(Date.now() - 259200000) },
            { message: 'Verification typically takes 24-48 hours.', sender: 'support', timestamp: new Date(Date.now() - 172800000) }
          ],
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      showNotif('Failed to load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (message, type = 'success') => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleCreateTicket = () => {
    router.push('/user/support/create');
  };

  const handleViewTicket = (ticketId) => {
    router.push(`/user/support/${ticketId}`);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'open':
        return {
          color: 'text-[#F0B90B]',
          bg: 'bg-[#F0B90B]/10',
          icon: Clock,
          label: 'Open'
        };
      case 'responded':
        return {
          color: 'text-[#0ECB81]',
          bg: 'bg-[#0ECB81]/10',
          icon: MessageCircle,
          label: 'Responded'
        };
      case 'closed':
        return {
          color: 'text-[#848E9C]',
          bg: 'bg-[#2B3139]',
          icon: CheckCircle,
          label: 'Closed'
        };
      default:
        return {
          color: 'text-[#848E9C]',
          bg: 'bg-[#2B3139]',
          icon: AlertCircle,
          label: status
        };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high':
        return { color: 'text-[#F6465D]', label: 'High' };
      case 'medium':
        return { color: 'text-[#F0B90B]', label: 'Medium' };
      case 'low':
        return { color: 'text-[#0ECB81]', label: 'Low' };
      default:
        return { color: 'text-[#848E9C]', label: 'Normal' };
    }
  };

  const getLastMessage = (messages) => {
    if (!messages || messages.length === 0) return 'No messages';
    const lastMessage = messages[messages.length - 1];
    return lastMessage.message.length > 100 
      ? `${lastMessage.message.substring(0, 100)}...` 
      : lastMessage.message;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getLastMessage(ticket.messages).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    responded: tickets.filter(t => t.status === 'responded').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  const quickLinks = [
    {
      icon: Book,
      title: 'Help Center',
      description: 'Browse FAQs and guides',
      href: '/help',
      color: '#0ECB81'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with support (24/7)',
      href: '#',
      color: '#3861FB'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@bitnexglobal.com',
      href: 'mailto:support@bitnexglobal.com',
      color: '#F0B90B'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+1 (555) 123-4567',
      href: 'tel:+15551234567',
      color: '#F6465D'
    }
  ];

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-[#0B0E11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <MessageSquare className="text-[#F0B90B]" size={32} />
                  <h1 className="text-3xl font-bold text-[#EAECEF]">Support Center</h1>
                </div>
                <p className="text-[#B7BDC6]">
                  Get help with your account, transactions, and trading
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateTicket}
                className="flex items-center space-x-2 px-6 py-3 bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11] font-semibold rounded-lg transition-all shadow-lg shadow-[#F0B90B]/20"
              >
                <Plus size={20} />
                <span>Create Ticket</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Tickets', value: stats.total, icon: Ticket, color: '#3861FB' },
              { label: 'Open', value: stats.open, icon: Clock, color: '#F0B90B' },
              { label: 'Responded', value: stats.responded, icon: MessageCircle, color: '#0ECB81' },
              { label: 'Closed', value: stats.closed, icon: CheckCircle, color: '#848E9C' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#1E2329] rounded-lg border border-[#2B3139] p-6 hover:border-[#F0B90B]/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon size={24} style={{ color: stat.color }} />
                    </div>
                    <TrendingUp size={16} className="text-[#0ECB81]" />
                  </div>
                  <div className="text-3xl font-bold text-[#EAECEF] mb-1">{stat.value}</div>
                  <div className="text-sm text-[#848E9C]">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1E2329] rounded-lg border border-[#2B3139] p-4 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" size={20} />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] placeholder-[#848E9C] focus:outline-none focus:border-[#F0B90B] transition-colors"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="text-[#848E9C]" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B] transition-colors cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Tickets List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B]"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1E2329] rounded-lg border border-[#2B3139] p-12 text-center"
            >
              <div className="mb-6">
                <MessageSquare size={64} className="text-[#848E9C] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#EAECEF] mb-2">
                  {searchQuery || filterStatus !== 'all' ? 'No tickets found' : 'No support tickets yet'}
                </h3>
                <p className="text-[#848E9C] mb-6">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter' 
                    : 'Create your first support ticket to get help with your account'}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateTicket}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11] font-semibold rounded-lg transition-all"
              >
                <Plus size={20} />
                <span>Create Your First Ticket</span>
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredTickets.map((ticket, index) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const priorityConfig = getPriorityConfig(ticket.priority);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={ticket.$id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleViewTicket(ticket.$id)}
                      className="bg-[#1E2329] rounded-lg border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all cursor-pointer group"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-[#EAECEF] group-hover:text-[#F0B90B] transition-colors">
                                {ticket.subject}
                              </h3>
                              <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                <StatusIcon size={14} />
                                <span>{statusConfig.label}</span>
                              </div>
                              <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
                                {priorityConfig.label} Priority
                              </div>
                            </div>
                            
                            <p className="text-[#B7BDC6] text-sm mb-3 line-clamp-2">
                              {getLastMessage(ticket.messages)}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#848E9C]">
                              <div className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle size={14} />
                                <span>{ticket.messages?.length || 0} message{(ticket.messages?.length || 0) !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Ticket size={14} />
                                <span className="uppercase">{ticket.category}</span>
                              </div>
                            </div>
                          </div>
                          
                          <ChevronRight 
                            className="text-[#848E9C] group-hover:text-[#F0B90B] transition-colors flex-shrink-0 ml-4" 
                            size={20} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <div className="bg-[#1E2329] rounded-lg border border-[#2B3139] p-6">
              <div className="flex items-center space-x-2 mb-6">
                <HelpCircle className="text-[#F0B90B]" size={24} />
                <h3 className="text-xl font-semibold text-[#EAECEF]">Quick Help</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <motion.a
                      key={link.title}
                      href={link.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="flex flex-col items-center p-4 bg-[#0B0E11] rounded-lg border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all group"
                    >
                      <div 
                        className="p-3 rounded-full mb-3 transition-all"
                        style={{ backgroundColor: `${link.color}15` }}
                      >
                        <Icon size={24} style={{ color: link.color }} />
                      </div>
                      <h4 className="font-medium text-[#EAECEF] mb-1 text-center group-hover:text-[#F0B90B] transition-colors">
                        {link.title}
                      </h4>
                      <p className="text-xs text-[#848E9C] text-center">
                        {link.description}
                      </p>
                      <ExternalLink size={12} className="text-[#848E9C] mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Common Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <div className="bg-[#1E2329] rounded-lg border border-[#2B3139] p-6">
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-4">Common Issues</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'How to verify my account?',
                  'Withdrawal taking too long',
                  'Trading fee calculation',
                  'Enable two-factor authentication',
                  'Reset my password',
                  'Update profile information'
                ].map((issue, index) => (
                  <motion.button
                    key={issue}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-2 px-4 py-3 bg-[#0B0E11] rounded-lg border border-[#2B3139] hover:border-[#F0B90B]/50 text-left text-[#B7BDC6] hover:text-[#EAECEF] transition-all group"
                  >
                    <ChevronRight size={16} className="text-[#848E9C] group-hover:text-[#F0B90B] transition-colors" />
                    <span className="text-sm">{issue}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Notification Toast */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="fixed bottom-8 right-8 bg-[#0ECB81] text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 z-50"
            >
              <CheckCircle size={20} />
              <span className="font-medium">{notificationMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
