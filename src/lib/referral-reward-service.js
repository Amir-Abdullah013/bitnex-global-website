/**
 * Referral Reward Service
 * Handles referral reward distribution when users perform profitable actions
 */

import databaseHelpers from './database';

class ReferralRewardService {
  constructor() {
    this.defaultCommissionRates = [0.10, 0.05, 0.02, 0.01]; // 10%, 5%, 2%, 1%
    this.maxLevels = 4;
  }

  /**
   * Get current commission rates from database settings
   * @returns {Promise<Array>} - Array of commission rates
   */
  async getCommissionRates() {
    try {
      const settings = await databaseHelpers.system.getSetting('REFERRAL_SETTINGS');
      if (settings) {
        const referralSettings = JSON.parse(settings.value);
        return [
          (referralSettings.commissionRates.level1 || 10) / 100,
          (referralSettings.commissionRates.level2 || 5) / 100,
          (referralSettings.commissionRates.level3 || 2) / 100,
          (referralSettings.commissionRates.level4 || 1) / 100
        ];
      }
      return this.defaultCommissionRates;
    } catch (error) {
      console.error('Error getting commission rates:', error);
      return this.defaultCommissionRates;
    }
  }

  /**
   * Trigger referral rewards for a user action
   * @param {string} userId - User who performed the action
   * @param {number} amount - Transaction amount
   * @param {string} sourceType - Type of action (DEPOSIT, TRADE, INVESTMENT, STAKING)
   * @param {string} sourceId - ID of the source transaction/action
   * @returns {Promise<Object>} - Result of reward distribution
   */
  async triggerReferralRewards(userId, amount, sourceType, sourceId) {
    try {
      console.log(`🎯 Triggering referral rewards for user ${userId}, amount: ${amount}, type: ${sourceType}`);

      // Check if user has a referrer
      const user = await databaseHelpers.user.getUserById(userId);
      if (!user || !user.referredBy) {
        console.log(`ℹ️ User ${userId} has no referrer, skipping referral rewards`);
        return {
          success: true,
          message: 'No referrer found',
          rewardsDistributed: 0,
          totalRewardsAmount: 0,
          rewards: []
        };
      }

      // Get referral chain
      const referralChain = await this.getReferralChain(userId);
      if (referralChain.length === 0) {
        console.log(`ℹ️ No referral chain found for user ${userId}`);
        return {
          success: true,
          message: 'No referral chain found',
          rewardsDistributed: 0,
          totalRewardsAmount: 0,
          rewards: []
        };
      }

      // Get current commission rates
      const commissionRates = await this.getCommissionRates();
      
      // Distribute rewards
      const rewards = await this.distributeRewards(userId, amount, sourceType, sourceId, referralChain, commissionRates);
      
      console.log(`✅ Referral rewards distributed: ${rewards.length} rewards, total amount: $${rewards.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}`);

      return {
        success: true,
        message: 'Referral rewards distributed successfully',
        rewardsDistributed: rewards.length,
        totalRewardsAmount: rewards.reduce((sum, r) => sum + r.amount, 0),
        rewards: rewards
      };

    } catch (error) {
      console.error('❌ Error triggering referral rewards:', error);
      throw error;
    }
  }

  /**
   * Get referral chain for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of referrers in the chain
   */
  async getReferralChain(userId) {
    try {
      const chain = [];
      let currentUserId = userId;
      let level = 0;

      while (level < this.maxLevels) {
        // Get the referrer of current user
        const referrerResult = await databaseHelpers.pool.query(`
          SELECT r."referrerId", u.id, u.name, u.email, u."referralCode", u."referralLevel"
          FROM referrals r
          JOIN users u ON r."referrerId" = u.id
          WHERE r."referredId" = $1 AND r.status = 'ACTIVE'
        `, [currentUserId]);

        if (referrerResult.rows.length === 0) break;

        const referrer = referrerResult.rows[0];
        chain.push({
          level: level + 1,
          userId: referrer.id,
          name: referrer.name,
          email: referrer.email,
          referralCode: referrer.referralCode,
          referralLevel: referrer.referralLevel
        });

        currentUserId = referrer.id;
        level++;
      }

      return chain;
    } catch (error) {
      console.error('Error getting referral chain:', error);
      return [];
    }
  }

  /**
   * Distribute rewards to referrers in the chain
   * @param {string} userId - User who performed the action
   * @param {number} amount - Transaction amount
   * @param {string} sourceType - Type of action
   * @param {string} sourceId - Source transaction ID
   * @param {Array} referralChain - Chain of referrers
   * @param {Array} commissionRates - Commission rates for each level
   * @returns {Promise<Array>} - Array of distributed rewards
   */
  async distributeRewards(userId, amount, sourceType, sourceId, referralChain, commissionRates) {
    const rewards = [];

    for (let i = 0; i < referralChain.length && i < this.maxLevels; i++) {
      const referrer = referralChain[i];
      const commissionRate = commissionRates[i] || 0;
      const rewardAmount = amount * commissionRate;

      if (rewardAmount > 0) {
        try {
          // Create reward record
          const rewardId = require('crypto').randomUUID();
          await databaseHelpers.pool.query(`
            INSERT INTO referral_rewards (
              id, "userId", amount, percentage, "sourceType", "sourceId", 
              level, status, "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PAID', NOW(), NOW())
          `, [rewardId, referrer.userId, rewardAmount, commissionRate * 100, sourceType, sourceId, i + 1]);

          // Update user's referral earnings
          await databaseHelpers.pool.query(`
            UPDATE users 
            SET "referralEarnings" = "referralEarnings" + $1, "updatedAt" = NOW()
            WHERE id = $2
          `, [rewardAmount, referrer.userId]);

          // Update user's wallet balance
          await databaseHelpers.pool.query(`
            UPDATE wallets 
            SET balance = balance + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
            WHERE "userId" = $2
          `, [rewardAmount, referrer.userId]);

          // Create transaction record for the reward
          await databaseHelpers.transaction.createTransaction({
            userId: referrer.userId,
            type: 'DEPOSIT',
            amount: rewardAmount,
            currency: 'USD',
            status: 'COMPLETED',
            description: `Referral reward from ${sourceType.toLowerCase()} - Level ${i + 1}`
          });

          // Create referral transaction record
          await this.createReferralTransaction(userId, referrer.userId, rewardAmount, i + 1);

          rewards.push({
            userId: referrer.userId,
            name: referrer.name,
            amount: rewardAmount,
            percentage: commissionRate * 100,
            level: i + 1
          });

          console.log(`💰 Distributed $${rewardAmount.toFixed(2)} to ${referrer.name} (Level ${i + 1})`);

        } catch (error) {
          console.error(`❌ Error distributing reward to ${referrer.name}:`, error);
          // Continue with other rewards even if one fails
        }
      }
    }

    return rewards;
  }

  /**
   * Create referral transaction record
   * @param {string} fromUserId - User who triggered the reward
   * @param {string} toUserId - User who received the reward
   * @param {number} amount - Reward amount
   * @param {number} level - Level in referral chain
   */
  async createReferralTransaction(fromUserId, toUserId, amount, level) {
    try {
      const transactionId = require('crypto').randomUUID();
      await databaseHelpers.pool.query(`
        INSERT INTO referral_transactions (
          id, "fromUserId", "toUserId", amount, level, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [transactionId, fromUserId, toUserId, amount, level]);
    } catch (error) {
      console.error('Error creating referral transaction:', error);
      // Don't throw error as this is optional tracking
    }
  }

  /**
   * Get referral transaction history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} - Array of referral transactions
   */
  async getReferralTransactions(userId, limit = 20) {
    try {
      const result = await databaseHelpers.pool.query(`
        SELECT rt.*, 
               from_user.name as "fromUserName", 
               to_user.name as "toUserName"
        FROM referral_transactions rt
        LEFT JOIN users from_user ON rt."fromUserId" = from_user.id
        LEFT JOIN users to_user ON rt."toUserId" = to_user.id
        WHERE rt."toUserId" = $1 OR rt."fromUserId" = $1
        ORDER BY rt."createdAt" DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error getting referral transactions:', error);
      return [];
    }
  }

  /**
   * Get referral statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Referral statistics
   */
  async getReferralStats(userId) {
    try {
      // Get total earnings
      const earningsResult = await databaseHelpers.pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_earnings
        FROM referral_rewards 
        WHERE "userId" = $1 AND status = 'PAID'
      `, [userId]);

      // Get total referrals
      const referralsResult = await databaseHelpers.pool.query(`
        SELECT COUNT(*) as total_referrals
        FROM referrals 
        WHERE "referrerId" = $1 AND status = 'ACTIVE'
      `, [userId]);

      // Get earnings by level
      const levelEarningsResult = await databaseHelpers.pool.query(`
        SELECT level, COALESCE(SUM(amount), 0) as earnings
        FROM referral_rewards 
        WHERE "userId" = $1 AND status = 'PAID'
        GROUP BY level
        ORDER BY level
      `, [userId]);

      return {
        totalEarnings: parseFloat(earningsResult.rows[0].total_earnings),
        totalReferrals: parseInt(referralsResult.rows[0].total_referrals),
        earningsByLevel: levelEarningsResult.rows.map(row => ({
          level: row.level,
          earnings: parseFloat(row.earnings)
        }))
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return {
        totalEarnings: 0,
        totalReferrals: 0,
        earningsByLevel: []
      };
    }
  }
}

// Create singleton instance
const referralRewardService = new ReferralRewardService();

export default referralRewardService;
