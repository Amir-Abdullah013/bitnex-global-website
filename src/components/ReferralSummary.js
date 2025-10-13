'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, Copy, Share2, ExternalLink } from 'lucide-react';

export default function ReferralSummary({ userId }) {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchReferralData();
    }
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch(`/api/referrals/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferralData(data.data);
        } else {
          console.error('Failed to fetch referral data:', data.error);
        }
      } else {
        console.error('Failed to fetch referral data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (referralData?.referralCode) {
      try {
        const referralUrl = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
        <div className="animate-pulse">
          <div className="h-4 bg-[#2B3139] rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-[#2B3139] rounded"></div>
            <div className="h-3 bg-[#2B3139] rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
        <h3 className="text-lg font-semibold text-white mb-2">Referral Program</h3>
        <p className="text-gray-400 text-sm">Unable to load referral data</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Referral Program</h3>
        <a
          href="/user/referrals"
          className="flex items-center space-x-1 text-[#FCD535] hover:text-[#F0B90B] transition-colors text-sm"
        >
          <span>View All</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Referral Code */}
      <div className="bg-[#0B0E11] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Your Referral Code</p>
            <p className="text-xl font-bold text-[#FCD535] font-mono">
              {referralData.referralCode}
            </p>
          </div>
          <button
            onClick={copyReferralLink}
            className="flex items-center space-x-1 bg-[#FCD535] text-black px-3 py-2 rounded-lg font-medium hover:bg-[#F0B90B] transition-colors text-sm"
          >
            {copied ? <span>Copied!</span> : <><Copy size={14} /> <span>Copy</span></>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="text-[#FCD535] mr-2" size={20} />
            <span className="text-2xl font-bold text-[#FCD535]">
              {referralData.totalReferrals}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Total Referrals</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="text-[#FCD535] mr-2" size={20} />
            <span className="text-2xl font-bold text-[#FCD535]">
              ${referralData.totalEarnings.toFixed(2)}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Total Earnings</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button
          onClick={copyReferralLink}
          className="flex-1 flex items-center justify-center space-x-2 bg-[#2B3139] text-white px-3 py-2 rounded-lg hover:bg-[#3A4049] transition-colors text-sm"
        >
          <Copy size={16} />
          <span>Copy Link</span>
        </button>
        <button
          onClick={() => window.open(`/user/referrals`, '_blank')}
          className="flex-1 flex items-center justify-center space-x-2 bg-[#FCD535] text-black px-3 py-2 rounded-lg hover:bg-[#F0B90B] transition-colors text-sm"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
