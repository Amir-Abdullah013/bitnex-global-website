'use client';

import { useState, useEffect } from 'react';
import { Copy, Share2, Users, DollarSign, TrendingUp, ExternalLink, CheckCircle, Clock, X, RefreshCw } from 'lucide-react';
import ReferralSidebar from '../../../components/ReferralSidebar';
import AuthCheck from '../../../components/AuthCheck';

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchReferralData();
    
    // Handle tab changes from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'referrals', 'earnings'].includes(tab)) {
      setActiveTab(tab);
    }
    
    // Listen for tab changes from sidebar
    const handleTabChange = (event) => {
      setActiveTab(event.detail.tab);
    };
    
    window.addEventListener('referralTabChange', handleTabChange);
    return () => window.removeEventListener('referralTabChange', handleTabChange);
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get user ID from multiple sources
      let userId = localStorage.getItem('userId') || 
                   sessionStorage.getItem('userId') || 
                   localStorage.getItem('user_id') || 
                   sessionStorage.getItem('user_id');
      
      // If no userId found, try to get from session or use a default for demo
      if (!userId) {
        // For demo purposes, use a default user ID
        userId = 'demo-user-123';
        console.warn('No user ID found, using demo user for testing');
        // Set demo user ID in localStorage for consistency
        localStorage.setItem('userId', userId);
      }
      
      // Fetch real referral data from API
      const response = await fetch(`/api/referrals/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          // Redirect to login after a delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        if (response.status === 404) {
          // User not found, use demo data
          console.warn('User not found in database, using demo data');
          setReferralData(getMockReferralData());
          setError('Using demo data - User not found in database');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReferralData(data.data);
        setSuccessMessage('Referral data loaded successfully');
      } else {
        throw new Error(data.error || 'Failed to fetch referral data');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setError(`Failed to load referral data: ${error.message}`);
      
      // Always provide fallback data for better UX
      console.warn('Using fallback data for better user experience');
      setReferralData(getMockReferralData());
      setError('Using demo data - API not available');
    } finally {
      setLoading(false);
    }
  };

  const getMockReferralData = () => {
    const referralCode = 'BNX' + Math.random().toString(36).substr(2, 6).toUpperCase();
    return {
      referralCode,
      totalReferrals: 5,
      totalEarnings: 125.50,
      referralLevel: 2,
      referralUrl: `${window.location.origin}/signup?ref=${referralCode}`,
      referralTree: [
        {
          id: '1',
          referredId: 'user1',
          level: 1,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          name: 'John Doe',
          email: 'john@example.com',
          referralCode: 'BNX123'
        },
        {
          id: '2',
          referredId: 'user2',
          level: 1,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          name: 'Jane Smith',
          email: 'jane@example.com',
          referralCode: 'BNX456'
        },
        {
          id: '3',
          referredId: 'user3',
          level: 1,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          name: 'Mike Johnson',
          email: 'mike@example.com',
          referralCode: 'BNX789'
        }
      ],
      recentRewards: [
        {
          id: '1',
          amount: 25.00,
          percentage: 10.0,
          sourceType: 'DEPOSIT',
          level: 1,
          status: 'PAID',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          amount: 12.50,
          percentage: 5.0,
          sourceType: 'TRADE',
          level: 2,
          status: 'PAID',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '3',
          amount: 8.75,
          percentage: 10.0,
          sourceType: 'INVESTMENT',
          level: 1,
          status: 'PAID',
          createdAt: new Date(Date.now() - 10800000).toISOString()
        }
      ],
      earningsByLevel: {
        level1: 75.00,
        level2: 25.50,
        level3: 15.00,
        level4: 10.00
      }
    };
  };

  const copyReferralLink = async () => {
    if (referralData?.referralCode) {
      try {
        const referralUrl = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setSuccessMessage('Referral link copied to clipboard!');
        setTimeout(() => {
          setCopied(false);
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Failed to copy:', error);
        setError('Failed to copy referral link');
      }
    } else {
      setError('No referral code available');
    }
  };

  const shareReferralLink = async () => {
    if (referralData?.referralCode) {
      const referralUrl = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join Bitnex Global Trading Platform',
            text: 'Start trading with me on Bitnex Global and earn rewards!',
            url: referralUrl
          });
          setSuccessMessage('Referral link shared successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
          console.error('Error sharing:', error);
          // Fallback to copy
          copyReferralLink();
        }
      } else {
        // Fallback to copy if share API not available
        copyReferralLink();
      }
    } else {
      setError('No referral code available');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCD535] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Referral Data</h2>
          <p className="text-gray-400 mb-6">Unable to load your referral information.</p>
          <button
            onClick={fetchReferralData}
            className="bg-[#FCD535] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#F0B90B] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthCheck 
      fallback={
        <div className="min-h-screen bg-[#0B0E11] text-white flex">
          {/* Sidebar */}
          <ReferralSidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:ml-0">
            <div className="bg-[#1E2329] border-b border-[#2B3139]">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white">Referral Program</h1>
                    <p className="text-gray-400 mt-2">Earn commissions by referring friends to Bitnex Global</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 lg:px-6 py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-yellow-500 text-2xl">🔒</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Demo Mode</h2>
                <p className="text-gray-400 mb-6">You're viewing the referral program in demo mode.</p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-[#FCD535] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#F0B90B] transition-colors"
                >
                  Login to Access Full Features
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-[#0B0E11] text-white flex">
        {/* Sidebar */}
        <ReferralSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <div className="bg-[#1E2329] border-b border-[#2B3139]">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Referral Program</h1>
              <p className="text-gray-400 mt-2">Earn commissions by referring friends to Bitnex Global</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchReferralData}
                className="flex items-center space-x-2 bg-[#2B3139] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#3A4049] transition-colors"
              >
                <RefreshCw size={20} />
                <span>Refresh</span>
              </button>
              <button
                onClick={copyReferralLink}
                className="flex items-center space-x-2 bg-[#FCD535] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#F0B90B] transition-colors"
                disabled={!referralData?.referralCode}
              >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={shareReferralLink}
                className="flex items-center space-x-2 bg-[#2B3139] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#3A4049] transition-colors"
                disabled={!referralData?.referralCode}
              >
                <Share2 size={20} />
                <span>Share</span>
              </button>
            </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 lg:px-6 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X size={20} />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-green-500 bg-opacity-10 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-green-400 hover:text-green-300">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-[#1E2329] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#FCD535] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'referrals'
                  ? 'bg-[#FCD535] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Referrals
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'earnings'
                  ? 'bg-[#FCD535] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Earnings
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Referral Code Card */}
            <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Your Referral Code</h2>
                <div className="flex items-center space-x-2 text-[#FCD535]">
                  <TrendingUp size={20} />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
              
              <div className="bg-[#0B0E11] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Referral Code</p>
                    <p className="text-2xl font-bold text-[#FCD535] font-mono">
                      {referralData.referralCode}
                    </p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="flex items-center space-x-2 bg-[#FCD535] text-black px-3 py-2 rounded-lg font-medium hover:bg-[#F0B90B] transition-colors"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#0B0E11] rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Referral Link</p>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono text-sm flex-1 truncate">
                    {`${window.location.origin}/signup?ref=${referralData.referralCode}`}
                  </p>
                  <button
                    onClick={copyReferralLink}
                    className="text-[#FCD535] hover:text-[#F0B90B] transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#FCD535] bg-opacity-10 rounded-lg">
                    <Users className="text-[#FCD535]" size={24} />
                  </div>
                  <span className="text-2xl font-bold text-[#FCD535]">
                    {referralData.totalReferrals}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">Total Referrals</h3>
                <p className="text-gray-400 text-sm">Users you've referred</p>
              </div>

              <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#FCD535] bg-opacity-10 rounded-lg">
                    <DollarSign className="text-[#FCD535]" size={24} />
                  </div>
                  <span className="text-2xl font-bold text-[#FCD535]">
                    ${referralData.totalEarnings.toFixed(2)}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">Total Earnings</h3>
                <p className="text-gray-400 text-sm">Commission earned</p>
              </div>

              <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#FCD535] bg-opacity-10 rounded-lg">
                    <TrendingUp className="text-[#FCD535]" size={24} />
                  </div>
                  <span className="text-2xl font-bold text-[#FCD535]">
                    Level {referralData.referralLevel || 0}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">Your Level</h3>
                <p className="text-gray-400 text-sm">In referral hierarchy</p>
              </div>
            </div>

            {/* Commission Structure */}
            <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
              <h3 className="text-xl font-semibold text-white mb-4">Commission Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { level: 1, percentage: '10%', description: 'Direct referrals' },
                  { level: 2, percentage: '5%', description: 'Second level' },
                  { level: 3, percentage: '2%', description: 'Third level' },
                  { level: 4, percentage: '1%', description: 'Fourth level' }
                ].map((tier) => (
                  <div key={tier.level} className="bg-[#0B0E11] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#FCD535] mb-2">
                      {tier.percentage}
                    </div>
                    <div className="text-white font-medium mb-1">
                      Level {tier.level}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {tier.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="bg-[#1E2329] rounded-xl border border-[#2B3139]">
            <div className="p-6 border-b border-[#2B3139]">
              <h3 className="text-xl font-semibold text-white">My Referrals</h3>
              <p className="text-gray-400 mt-1">Users you've successfully referred</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B0E11]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Level</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Earnings Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {referralData.referralTree.length > 0 ? (
                    referralData.referralTree.map((referral) => (
                      <tr key={referral.id} className="hover:bg-[#0B0E11] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white font-medium">{referral.name}</div>
                            <div className="text-gray-400 text-sm">{referral.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCD535] bg-opacity-10 text-[#FCD535]">
                            Level {referral.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 bg-opacity-10 text-green-400">
                            <CheckCircle size={12} className="mr-1" />
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#FCD535] font-medium">
                            ${(Math.random() * 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <Users size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No referrals yet</p>
                          <p className="text-sm">Start sharing your referral link to earn commissions!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Recent Rewards */}
            <div className="bg-[#1E2329] rounded-xl border border-[#2B3139]">
              <div className="p-6 border-b border-[#2B3139]">
                <h3 className="text-xl font-semibold text-white">Recent Rewards</h3>
                <p className="text-gray-400 mt-1">Your latest commission earnings</p>
              </div>
              
              <div className="divide-y divide-[#2B3139]">
                {referralData.recentRewards.length > 0 ? (
                  referralData.recentRewards.map((reward) => (
                    <div key={reward.id} className="p-6 hover:bg-[#0B0E11] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-[#FCD535] bg-opacity-10 rounded-lg">
                            <DollarSign className="text-[#FCD535]" size={20} />
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {reward.sourceType} Commission
                            </div>
                            <div className="text-gray-400 text-sm">
                              Level {reward.level} • {reward.percentage}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#FCD535] font-semibold text-lg">
                            +${reward.amount.toFixed(2)}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {new Date(reward.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-gray-400">
                      <Clock size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No rewards yet</p>
                      <p className="text-sm">Earn commissions when your referrals make profitable actions!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Earnings by Level */}
            <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
              <h3 className="text-xl font-semibold text-white mb-4">Earnings by Level</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { level: 1, earnings: 45.50, percentage: '10%' },
                  { level: 2, earnings: 22.75, percentage: '5%' },
                  { level: 3, earnings: 9.10, percentage: '2%' },
                  { level: 4, earnings: 4.55, percentage: '1%' }
                ].map((tier) => (
                  <div key={tier.level} className="bg-[#0B0E11] rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#FCD535] mb-2">
                        ${tier.earnings.toFixed(2)}
                      </div>
                      <div className="text-white font-medium mb-1">
                        Level {tier.level}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {tier.percentage} commission
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    </AuthCheck>
  );
}
