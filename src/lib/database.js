import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Parse DATABASE_URL to handle special characters in password
const parseDatabaseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      database: urlObj.pathname.slice(1),
      user: urlObj.username,
      password: urlObj.password,
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
};

// Database connection pool with improved configuration
const createPool = () => {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔗 DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 50) + '...');
  
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (!dbConfig) {
    console.error('❌ Failed to parse DATABASE_URL');
    throw new Error('Invalid DATABASE_URL configuration');
  }

  console.log('✅ Database configuration parsed successfully');
  console.log('   Host:', dbConfig.host);
  console.log('   Port:', dbConfig.port);
  console.log('   Database:', dbConfig.database);
  console.log('   User:', dbConfig.user);

  return new Pool({
    ...dbConfig,
    max: 5, // Reduced max connections for better stability
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
    acquireTimeoutMillis: 15000, // 15 seconds
    allowExitOnIdle: true
  });
};

const pool = createPool();

// Test database connection with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
};

// Initialize connection
testConnection();

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

export const databaseHelpers = {
  // Export pool for direct queries
  pool,
  
  // User operations
  user: {
    async getUserByEmail(email) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user by email:', error);
        throw error;
      }
    },

    async getUserById(id) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user by id:', error);
        throw error;
      }
    },

    async createUser(userData) {
      try {
        const { email, password, name, emailVerified = false, role = 'USER', referralCode = null, referredBy = null } = userData;
        const id = randomUUID();
        
        // Generate unique referral code if not provided
        const userReferralCode = referralCode || `BNX${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Determine referral level
        let referralLevel = 0;
        if (referredBy) {
          // Get the referrer's level and add 1
          const referrerResult = await pool.query('SELECT "referralLevel" FROM users WHERE "referralCode" = $1', [referredBy]);
          if (referrerResult.rows.length > 0) {
            referralLevel = (referrerResult.rows[0].referralLevel || 0) + 1;
          }
        }
        
        const result = await pool.query(`
          INSERT INTO users (id, email, password, name, "emailVerified", role, "referralCode", "referredBy", "referralLevel", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING *
        `, [id, email, password, name, emailVerified, role, userReferralCode, referredBy, referralLevel]);
        
        // If user was referred, create referral record
        if (referredBy) {
          const referrerResult = await pool.query('SELECT id FROM users WHERE "referralCode" = $1', [referredBy]);
          if (referrerResult.rows.length > 0) {
            await pool.query(`
              INSERT INTO referrals (id, "referrerId", "referredId", "referralCode", level, status, "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
            `, [randomUUID(), referrerResult.rows[0].id, id, referredBy, referralLevel]);
          }
        }
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    async updateUser(userId, updateData) {
      try {
        const fields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            fields.push(`"${key}" = $${paramCount}`);
            values.push(value);
            paramCount++;
          }
        }

        if (fields.length === 0) {
          throw new Error('No fields to update');
        }

        fields.push(`"updatedAt" = NOW()`);
        values.push(userId);

        const query = `
          UPDATE users 
          SET ${fields.join(', ')} 
          WHERE id = $${paramCount}
          RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },

    async getAllUsers() {
      try {
        const result = await pool.query('SELECT * FROM users ORDER BY "createdAt" DESC');
        return result.rows;
      } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
      }
    },

    async updateLastLogin(userId) {
      try {
        const result = await pool.query(`
          UPDATE users 
          SET "lastLogin" = NOW(), "updatedAt" = NOW() 
          WHERE id = $1 
          RETURNING *
        `, [userId]);
        
        console.log('✅ Last login updated for user:', userId);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating last login:', error);
        throw error;
      }
    },

    async deleteUser(userId) {
      try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
        console.log('✅ User deleted:', userId);
        return result.rows[0];
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },

    async updateUserStatus(userId, status) {
      try {
        const result = await pool.query(`
          UPDATE users 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [status, userId]);
        
        console.log('✅ User status updated:', userId, 'to', status);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    }
  },

  // Token stats operations
  tokenStats: {
    async getTokenStats() {
      try {
        const result = await pool.query('SELECT * FROM "TokenStats" ORDER BY "createdAt" DESC LIMIT 1');
        return result.rows[0] || {
          totalTokens: 100000000,
          totalInvestment: 350000,
          currentPrice: 0.0035,
          lastUpdated: new Date(),
          createdAt: new Date()
        };
      } catch (error) {
        console.error('Error getting token stats:', error);
        return {
          totalTokens: 100000000,
          totalInvestment: 350000,
          currentPrice: 0.0035,
          lastUpdated: new Date(),
          createdAt: new Date()
        };
      }
    },

    async getCurrentPrice() {
      try {
        const stats = await this.getTokenStats();
        return stats.currentPrice;
      } catch (error) {
        console.error('Error getting current price:', error);
        return 0.0035;
      }
    },

    async updateTokenStats(investmentChange) {
      try {
        const result = await pool.query(`
          UPDATE "TokenStats" 
          SET "totalInvestment" = "totalInvestment" + $1,
              "currentPrice" = ("totalInvestment" + $1) / "totalTokens",
              "lastUpdated" = NOW()
          RETURNING *
        `, [investmentChange]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating token stats:', error);
        throw error;
      }
    }
  },

  // Wallet operations
  wallet: {
    async getUserWallet(userId) {
      try {
        const result = await pool.query('SELECT * FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user wallet:', error);
        return null;
      }
    },

    async createWallet(userId, currency = 'USD') {
      try {
        // Generate a CUID for the wallet ID
        const walletId = randomUUID();
        
        console.log('🔧 Creating wallet with ID:', walletId, 'for user:', userId);
        
        // First check if wallet already exists
        const existingWallet = await pool.query('SELECT * FROM wallets WHERE "userId" = $1', [userId]);
        if (existingWallet.rows.length > 0) {
          console.log('⚠️ Wallet already exists for user:', userId);
          return existingWallet.rows[0];
        }
        
        // Create wallet without foreign key constraint check for now
        const result = await pool.query(`
          INSERT INTO wallets (id, "userId", balance, "bnxBalance", currency, "lastUpdated", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
          RETURNING *
        `, [walletId, userId, 0, 0, currency]);
        
        if (result.rows.length === 0) {
          throw new Error('Wallet creation failed - no rows returned');
        }
        
        console.log('✅ Wallet created successfully:', { 
          walletId: result.rows[0].id, 
          userId: result.rows[0].userId, 
          currency: result.rows[0].currency 
        });
        return result.rows[0];
      } catch (error) {
        console.error('❌ Error creating wallet:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          constraint: error.constraint,
          detail: error.detail
        });
        
        // If it's a foreign key constraint error, try to create the user first
        if (error.constraint && error.constraint.includes('userId')) {
          console.log('🔧 Foreign key constraint error, attempting to create user first...');
          try {
            // Create a basic user record
            const userResult = await pool.query(`
              INSERT INTO users (id, email, name, "emailVerified", role, "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
              RETURNING *
            `, [userId, 'user@example.com', 'User', true, 'USER']);
            
            console.log('✅ User created for wallet:', userId);
            
            // Try creating wallet again
            const retryResult = await pool.query(`
              INSERT INTO wallets (id, "userId", balance, "bnxBalance", currency, "lastUpdated", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
              RETURNING *
            `, [randomUUID(), userId, 0, 0, currency]);
            
            if (retryResult.rows.length > 0) {
              console.log('✅ Wallet created on retry:', retryResult.rows[0].id);
              return retryResult.rows[0];
            }
          } catch (retryError) {
            console.error('❌ Retry failed:', retryError);
          }
        }
        
        throw error;
      }
    },

    async updateWallet(userId, balance, bnxBalance) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = $1, "bnxBalance" = $2, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $3
          RETURNING *
        `, [balance, bnxBalance, userId]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating wallet:', error);
        throw error;
      }
    },

    async updateBothBalances(userId, usdBalance, bnxBalance) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = $1, "bnxBalance" = $2, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $3
          RETURNING *
        `, [usdBalance, bnxBalance, userId]);
        
        console.log('✅ Wallet balances updated:', { userId, usdBalance, bnxBalance });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating both balances:', error);
        throw error;
      }
    },

    async updateBalance(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = balance + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ Balance updated:', userId, { amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating balance:', error);
        throw error;
      }
    },

    async getWalletByUserId(userId) {
      try {
        const result = await pool.query('SELECT * FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting wallet by user ID:', error);
        return null;
      }
    },

    async getTikiBalance(userId) {
      try {
        const result = await pool.query('SELECT "bnxBalance" FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0]?.bnxBalance || 0;
      } catch (error) {
        console.error('Error getting TIKI balance:', error);
        return 0;
      }
    },

    async updateTikiBalance(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET "bnxBalance" = "bnxBalance" + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ TIKI balance updated:', userId, { amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating TIKI balance:', error);
        throw error;
      }
    }
  },

  // Transaction operations
  transaction: {
    async createTransaction(transactionData) {
      let client;
      try {
        const { userId, type, amount, currency = 'USD', status = 'PENDING', description = null, gateway = null, binanceAddress = null, screenshot = null } = transactionData;
        const id = randomUUID();
        
        // Validate required fields
        if (!userId || !type || !amount) {
          throw new Error('Missing required fields for transaction');
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid amount for transaction');
        }

        client = await pool.connect();
        
        const result = await client.query(`
          INSERT INTO transactions (id, "userId", type, amount, currency, status, description, gateway, "binanceAddress", screenshot, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING *
        `, [id, userId, type, amount, currency, status, description, gateway, binanceAddress, screenshot]);
        
        console.log('✅ Transaction created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating transaction:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error('Transaction with this ID already exists');
        } else if (error.code === '23503') {
          throw new Error('User not found for transaction');
        } else if (error.code === '23514') {
          throw new Error('Invalid data for transaction');
        } else if (error.message.includes('SASL')) {
          throw new Error('Database authentication failed. Please check your database credentials.');
        } else if (error.message.includes('connection')) {
          throw new Error('Database connection failed. Please try again.');
        }
        
        throw error;
      } finally {
        if (client) {
          client.release();
        }
      }
    },

    async getUserTransactions(userId, limit = 10) {
      try {
        const result = await pool.query(`
          SELECT * FROM transactions 
          WHERE "userId" = $1 
          ORDER BY "createdAt" DESC 
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting user transactions:', error);
        return [];
      }
    },

    async getTransactionStats(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as totalTransactions,
            SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as totalDeposits,
            SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END) as totalWithdrawals,
            SUM(CASE WHEN type = 'BUY' THEN amount ELSE 0 END) as totalBuys,
            SUM(CASE WHEN type = 'SELL' THEN amount ELSE 0 END) as totalSells
          FROM transactions 
          WHERE "userId" = $1
        `, [userId]);
        
        return result.rows[0] || {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      } catch (error) {
        console.error('Error getting transaction stats:', error);
        return {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      }
    },

    async getUserTransactionStats(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as totalTransactions,
            SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as totalDeposits,
            SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END) as totalWithdrawals,
            SUM(CASE WHEN type = 'BUY' THEN amount ELSE 0 END) as totalBuys,
            SUM(CASE WHEN type = 'SELL' THEN amount ELSE 0 END) as totalSells
          FROM transactions 
          WHERE "userId" = $1
        `, [userId]);
        
        return result.rows[0] || {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      } catch (error) {
        console.error('Error getting user transaction stats:', error);
        return {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      }
    },

    async getAllTransactions({ type = null, page = 1, limit = 10, status = '' } = {}) {
      try {
        let query = `
          SELECT t.*, u.name as "userName", u.email as "userEmail"
          FROM transactions t
          LEFT JOIN users u ON t."userId" = u.id
          WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (type) {
          paramCount++;
          query += ` AND t.type = $${paramCount}`;
          params.push(type);
        }

        if (status) {
          paramCount++;
          query += ` AND t.status = $${paramCount}`;
          params.push(status);
        }

        query += ` ORDER BY t."createdAt" DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);
        
        // Transform the data to include user information in the expected format
        const transformedData = result.rows.map(row => ({
          ...row,
          user: {
            id: row.userId,
            name: row.userName,
            email: row.userEmail
          }
        }));
        
        // Get total count for pagination
        let countQuery = `
          SELECT COUNT(*) as total
          FROM transactions t
          WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 0;

        if (type) {
          countParamCount++;
          countQuery += ` AND t.type = $${countParamCount}`;
          countParams.push(type);
        }

        if (status) {
          countParamCount++;
          countQuery += ` AND t.status = $${countParamCount}`;
          countParams.push(status);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        return {
          data: transformedData,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all transactions:', error);
        throw error;
      }
    },

    async updateTransactionStatus(transactionId, status) {
      try {
        const result = await pool.query(`
          UPDATE transactions 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [status, transactionId]);
        
        console.log('✅ Transaction status updated:', transactionId, 'to', status);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating transaction status:', error);
        throw error;
      }
    },

    async getTransactionById(transactionId) {
      try {
        const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting transaction by ID:', error);
        return null;
      }
    },

    async getUserTransactions(userId, type = null) {
      try {
        let query = `
          SELECT * FROM transactions 
          WHERE "userId" = $1
        `;
        let params = [userId];
        
        if (type) {
          query += ` AND type = $2`;
          params.push(type);
        }
        
        query += ` ORDER BY "createdAt" DESC`;
        
        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Error getting user transactions:', error);
        return [];
      }
    },

    async getTransactionStats(type = null) {
      try {
        let whereClause = '';
        let params = [];
        
        if (type) {
          whereClause = 'WHERE type = $1';
          params.push(type);
        }

        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount END), 0) as totalCompletedAmount
          FROM transactions
          ${whereClause}
        `, params);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting transaction stats:', error);
        return {
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
          totalCompletedAmount: 0
        };
      }
    }
  },

  // Notification operations
  notification: {
    async createNotification(notificationData) {
      try {
        const { userId, title, message, type, isGlobal = false, createdBy } = notificationData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO notifications (id, "userId", title, message, type, "isGlobal", "createdBy", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `, [id, userId, title, message, type, isGlobal, createdBy]);
        
        console.log('✅ Notification created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
    },

    async createGlobalNotification(notificationData) {
      try {
        const { title, message, type, createdBy } = notificationData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO notifications (id, "userId", title, message, type, "isGlobal", "createdBy", "createdAt", "updatedAt")
          VALUES ($1, NULL, $2, $3, $4, true, $5, NOW(), NOW())
          RETURNING *
        `, [id, title, message, type, createdBy]);
        
        console.log('✅ Global notification created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating global notification:', error);
        throw error;
      }
    },

    async getUserNotifications(userId, limit = 20) {
      try {
        const result = await pool.query(`
          SELECT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n."createdBy" = u.id
          WHERE n."userId" = $1 OR n."isGlobal" = true
          ORDER BY n."createdAt" DESC
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting user notifications:', error);
        return [];
      }
    },

    async getAllNotifications(limit = 50) {
      try {
        const result = await pool.query(`
          SELECT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n."createdBy" = u.id
          ORDER BY n."createdAt" DESC
          LIMIT $1
        `, [limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting all notifications:', error);
        return [];
      }
    },

    async updateNotificationStatus(notificationId, status) {
      try {
        const result = await pool.query(`
          UPDATE notifications 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [status, notificationId]);
        
        console.log('✅ Notification status updated:', notificationId, 'to', status);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating notification status:', error);
        throw error;
      }
    },

    async deleteNotification(notificationId) {
      try {
        const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [notificationId]);
        console.log('✅ Notification deleted:', notificationId);
        return result.rows[0];
      } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    },

    async updateNotification(notificationId, updateData) {
      try {
        const { title, message, type } = updateData;
        const result = await pool.query(`
          UPDATE notifications 
          SET title = $1, message = $2, type = $3, "updatedAt" = NOW()
          WHERE id = $4
          RETURNING *
        `, [title, message, type, notificationId]);
        
        console.log('✅ Notification updated:', notificationId);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating notification:', error);
        throw error;
      }
    },

    async getNotificationById(notificationId) {
      try {
        const result = await pool.query(`
          SELECT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n."createdBy" = u.id
          WHERE n.id = $1
        `, [notificationId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting notification by ID:', error);
        return null;
      }
    },

    async getUnreadCount(userId) {
      try {
        const result = await pool.query(`
          SELECT COUNT(*) as count
          FROM notifications
          WHERE ("userId" = $1 OR "userId" IS NULL) AND status = 'UNREAD'
        `, [userId]);
        return parseInt(result.rows[0].count) || 0;
      } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }
    },

    async markAsRead(notificationId) {
      try {
        const result = await pool.query(`
          UPDATE notifications 
          SET status = 'READ', "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `, [notificationId]);
        
        console.log('✅ Notification marked as read:', notificationId);
        return result.rows[0];
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    },

    async markAllAsRead(userId) {
      try {
        const result = await pool.query(`
          UPDATE notifications 
          SET status = 'READ', "updatedAt" = NOW()
          WHERE ("userId" = $1 OR "userId" IS NULL) AND status = 'UNREAD'
          RETURNING COUNT(*) as updated
        `, [userId]);
        
        const updated = result.rowCount || 0;
        console.log('✅ All notifications marked as read for user:', userId, 'Updated:', updated);
        return { updated };
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    }
  },

  // Deposit operations
  deposit: {
    async createDepositRequest(depositData) {
      let client;
      try {
        const { userId, amount, screenshot, binanceAddress } = depositData;
        const id = randomUUID();
        
        // Validate required fields
        if (!userId || !amount || !screenshot || !binanceAddress) {
          throw new Error('Missing required fields for deposit request');
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid amount for deposit request');
        }

        // Verify user exists before creating deposit request
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
          throw new Error(`User with ID ${userId} not found in database`);
        }

        client = await pool.connect();
        
        const result = await client.query(`
          INSERT INTO deposit_requests (id, "userId", amount, screenshot, "binanceAddress", status, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW())
          RETURNING *
        `, [id, userId, amount, screenshot, binanceAddress]);
        
        console.log('✅ Deposit request created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating deposit request:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error('Deposit request with this ID already exists');
        } else if (error.code === '23503') {
          throw new Error('User not found for deposit request');
        } else if (error.code === '23514') {
          throw new Error('Invalid data for deposit request');
        } else if (error.message.includes('SASL')) {
          throw new Error('Database authentication failed. Please check your database credentials.');
        } else if (error.message.includes('connection')) {
          throw new Error('Database connection failed. Please try again.');
        }
        
        throw error;
      } finally {
        if (client) {
          client.release();
        }
      }
    },

    async getUserDepositRequests(userId, limit = 20) {
      try {
        const result = await pool.query(`
          SELECT * FROM deposit_requests 
          WHERE "userId" = $1 
          ORDER BY "createdAt" DESC 
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting user deposit requests:', error);
        return [];
      }
    },

    async getAllDepositRequests({ page = 1, limit = 10, status = '' } = {}) {
      try {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [limit, offset];
        
        if (status) {
          whereClause = 'WHERE dr.status = $3';
          params.push(status);
        }

        const result = await pool.query(`
          SELECT dr.*, u.name as user_name, u.email as user_email
          FROM deposit_requests dr
          LEFT JOIN users u ON dr."userId" = u.id
          ${whereClause}
          ORDER BY dr."createdAt" DESC
          LIMIT $1 OFFSET $2
        `, params);

        // Get total count
        const countResult = await pool.query(`
          SELECT COUNT(*) as total FROM deposit_requests dr
          ${whereClause}
        `, status ? [status] : []);

        const total = parseInt(countResult.rows[0].total);
        
        return {
          data: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all deposit requests:', error);
        return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
      }
    },

    async getDepositRequestById(depositId) {
      try {
        const result = await pool.query(`
          SELECT dr.*, u.name as user_name, u.email as user_email
          FROM deposit_requests dr
          LEFT JOIN users u ON dr."userId" = u.id
          WHERE dr.id = $1
        `, [depositId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting deposit request by ID:', error);
        return null;
      }
    },

    async updateDepositRequest(depositId, updateData) {
      try {
        const { status, adminNotes } = updateData;
        const result = await pool.query(`
          UPDATE deposit_requests 
          SET status = $1, "adminNotes" = $2, "updatedAt" = NOW()
          WHERE id = $3
          RETURNING *
        `, [status, adminNotes, depositId]);
        
        console.log('✅ Deposit request updated:', depositId);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating deposit request:', error);
        throw error;
      }
    },

    async getDepositStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as rejected,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount END), 0) as totalApprovedAmount
          FROM deposit_requests
        `);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting deposit stats:', error);
        return {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalApprovedAmount: 0
        };
      }
    }
  },

  // Transfer operations
  transfer: {
    async createTransfer(transferData) {
      try {
        const { senderId, recipientId, senderEmail, recipientEmail, amount, note } = transferData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO transfers (id, "senderId", "recipientId", "senderEmail", "recipientEmail", amount, note, status, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', NOW(), NOW())
          RETURNING *
        `, [id, senderId, recipientId, senderEmail, recipientEmail, amount, note]);

        console.log('✅ Transfer created:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating transfer:', error);
        throw error;
      }
    },

    async getUserTransfers(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            t.*,
            sender.name as sender_name,
            recipient.name as recipient_name
          FROM transfers t
          LEFT JOIN users sender ON t."senderId" = sender.id
          LEFT JOIN users recipient ON t."recipientId" = recipient.id
          WHERE t."senderId" = $1 OR t."recipientId" = $1
          ORDER BY t."createdAt" DESC
        `, [userId]);

        return result.rows;
      } catch (error) {
        console.error('Error getting user transfers:', error);
        throw error;
      }
    },

    async getAllTransfers({ page = 1, limit = 10, status = '' } = {}) {
      try {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [limit, offset];
        
        if (status) {
          whereClause = 'WHERE t.status = $3';
          params.push(status);
        }

        const result = await pool.query(`
          SELECT 
            t.*,
            sender.name as sender_name,
            sender.email as sender_email,
            recipient.name as recipient_name,
            recipient.email as recipient_email
          FROM transfers t
          LEFT JOIN users sender ON t."senderId" = sender.id
          LEFT JOIN users recipient ON t."recipientId" = recipient.id
          ${whereClause}
          ORDER BY t."createdAt" DESC
          LIMIT $1 OFFSET $2
        `, params);

        const countResult = await pool.query(`
          SELECT COUNT(*) as total
          FROM transfers t
          ${whereClause}
        `, status ? [status] : []);

        return {
          data: result.rows,
          pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(countResult.rows[0].total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all transfers:', error);
        throw error;
      }
    },

    async getTransferById(transferId) {
      try {
        const result = await pool.query(`
          SELECT 
            t.*,
            sender.name as sender_name,
            recipient.name as recipient_name
          FROM transfers t
          LEFT JOIN users sender ON t."senderId" = sender.id
          LEFT JOIN users recipient ON t."recipientId" = recipient.id
          WHERE t.id = $1
        `, [transferId]);

        return result.rows[0];
      } catch (error) {
        console.error('Error getting transfer by ID:', error);
        throw error;
      }
    },

    async getTransferStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
            COALESCE(SUM(amount), 0) as totalAmount
          FROM transfers
        `);

        return result.rows[0];
      } catch (error) {
        console.error('Error getting transfer stats:', error);
        throw error;
      }
    }
  },

  // System settings operations
  system: {
    async getSetting(key) {
      try {
        const result = await pool.query('SELECT * FROM system_settings WHERE key = $1', [key]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting system setting:', error);
        return null;
      }
    },

    async setSetting(key, value, description = null) {
      try {
        const result = await pool.query(`
          INSERT INTO system_settings (id, key, value, description, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (key) 
          DO UPDATE SET value = $3, description = $4, "updatedAt" = NOW()
          RETURNING *
        `, [randomUUID(), key, value, description]);
        
        console.log('✅ System setting updated:', key);
        return result.rows[0];
      } catch (error) {
        console.error('Error setting system setting:', error);
        throw error;
      }
    }
  },

  staking: {
    async createStaking(stakingData) {
      try {
        const { userId, amountStaked, durationDays, rewardPercent, startDate, endDate } = stakingData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO staking (id, "userId", "amountStaked", "durationDays", "rewardPercent", "startDate", "endDate", status, claimed, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', false, NOW(), NOW())
          RETURNING *
        `, [id, userId, amountStaked, durationDays, rewardPercent, startDate, endDate]);

        console.log('✅ Staking created:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating staking:', error);
        throw error;
      }
    },

    async getUserStakings(userId) {
      let client;
      try {
        console.log('🔍 Database: Getting stakings for user:', userId);
        
        // Get a client from the pool with timeout
        client = await pool.connect();
        
        const result = await client.query(`
          SELECT s.*, u.name as user_name, u.email as user_email
          FROM staking s
          LEFT JOIN users u ON s."userId" = u.id
          WHERE s."userId" = $1
          ORDER BY s."createdAt" DESC
        `, [userId]);

        console.log('📊 Database: Found stakings:', result.rows.length);
        if (result.rows.length > 0) {
          console.log('📋 Sample staking:', {
            id: result.rows[0].id,
            userId: result.rows[0].userId,
            amountStaked: result.rows[0].amountStaked,
            status: result.rows[0].status
          });
        }
        return result.rows;
      } catch (error) {
        console.error('Error getting user stakings:', error);
        
        // If it's a connection error, return empty array instead of throwing
        if (error.message.includes('Connection terminated') || 
            error.message.includes('timeout') ||
            error.message.includes('ECONNRESET')) {
          console.log('🔄 Connection error - returning empty stakings array');
          return [];
        }
        
        throw error;
      } finally {
        if (client) {
          client.release();
        }
      }
    },

    async getAllStakings({ page = 1, limit = 10, status = '' } = {}) {
      try {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [limit, offset];
        
        if (status) {
          whereClause = 'WHERE s.status = $3';
          params.push(status);
        }

        const result = await pool.query(`
          SELECT s.*, u.name as user_name, u.email as user_email
          FROM staking s
          LEFT JOIN users u ON s."userId" = u.id
          ${whereClause}
          ORDER BY s."createdAt" DESC
          LIMIT $1 OFFSET $2
        `, params);

        // Get total count
        const countResult = await pool.query(`
          SELECT COUNT(*) as total FROM staking s
          ${whereClause}
        `, status ? [status] : []);

        const total = parseInt(countResult.rows[0].total);
        
        return {
          data: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all stakings:', error);
        return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
      }
    },

    async getStakingById(stakingId) {
      try {
        const result = await pool.query(`
          SELECT s.*, u.name as user_name, u.email as user_email
          FROM staking s
          LEFT JOIN users u ON s."userId" = u.id
          WHERE s.id = $1
        `, [stakingId]);

        return result.rows[0];
      } catch (error) {
        console.error('Error getting staking by ID:', error);
        throw error;
      }
    },

    async updateStakingStatus(stakingId, status, rewardAmount = null) {
      try {
        let query = 'UPDATE staking SET status = $2, "updatedAt" = NOW()';
        let params = [stakingId, status];
        
        if (rewardAmount !== null) {
          query += ', "rewardAmount" = $3';
          params.push(rewardAmount);
        }
        
        query += ' WHERE id = $1 RETURNING *';
        
        const result = await pool.query(query, params);
        console.log('✅ Staking status updated:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating staking status:', error);
        throw error;
      }
    },

    async claimStaking(stakingId) {
      try {
        const result = await pool.query(`
          UPDATE staking 
          SET status = 'CLAIMED', claimed = true, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `, [stakingId]);

        console.log('✅ Staking claimed:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error claiming staking:', error);
        throw error;
      }
    },

    async getStakingStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'CLAIMED' THEN 1 END) as claimed,
            COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN "amountStaked" END), 0) as totalStaked,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' OR status = 'CLAIMED' THEN "rewardAmount" END), 0) as totalRewards
          FROM staking
        `);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting staking stats:', error);
        return {
          total: 0,
          active: 0,
          completed: 0,
          claimed: 0,
          totalStaked: 0,
          totalRewards: 0
        };
      }
    }
  },

  // Admin logs database helpers
  admin: {
    async getAdminLogs(queryParams = {}) {
      try {
        const {
          page = 1,
          limit = 20,
          search = '',
          admin = '',
          action = '',
          severity = ''
        } = queryParams;

        const offset = (page - 1) * limit;
        
        // Build WHERE clause
        let whereConditions = [];
        let params = [];
        let paramCount = 0;

        if (search) {
          paramCount++;
          whereConditions.push(`(
            action ILIKE $${paramCount} OR 
            details ILIKE $${paramCount} OR 
            message ILIKE $${paramCount} OR 
            "adminName" ILIKE $${paramCount}
          )`);
          params.push(`%${search}%`);
        }

        if (admin && admin !== 'all') {
          paramCount++;
          whereConditions.push(`"adminId" = $${paramCount}`);
          params.push(admin);
        }

        if (action && action !== 'all') {
          paramCount++;
          whereConditions.push(`action ILIKE $${paramCount}`);
          params.push(`%${action}%`);
        }

        if (severity && severity !== 'all') {
          paramCount++;
          whereConditions.push(`severity = $${paramCount}`);
          params.push(severity);
        }

        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

        // Get logs with pagination
        const logsQuery = `
          SELECT 
            id,
            action,
            "actionType",
            "adminId",
            "adminName",
            "adminEmail",
            "targetType",
            "targetId",
            severity,
            details,
            message,
            "ipAddress",
            "createdAt"
          FROM admin_logs 
          ${whereClause}
          ORDER BY "createdAt" DESC
          LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        // Get total count
        const countQuery = `
          SELECT COUNT(*) as total
          FROM admin_logs 
          ${whereClause}
        `;

        const [logsResult, countResult] = await Promise.all([
          pool.query(logsQuery, [...params, limit, offset]),
          pool.query(countQuery, params)
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return {
          logs: logsResult.rows,
          pagination: {
            total,
            totalPages,
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      } catch (error) {
        console.error('Error getting admin logs:', error);
        throw error;
      }
    },

    async getAdminLogStats() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN "createdAt" >= $1 THEN 1 END) as today,
            COUNT(CASE WHEN "createdAt" >= $2 THEN 1 END) as this_week,
            COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
            COUNT(CASE WHEN severity = 'WARNING' THEN 1 END) as warnings,
            COUNT(CASE WHEN severity = 'INFO' THEN 1 END) as info
          FROM admin_logs
        `, [today, weekAgo]);

        const stats = result.rows[0];
        return {
          total: parseInt(stats.total),
          today: parseInt(stats.today),
          thisWeek: parseInt(stats.this_week),
          critical: parseInt(stats.critical),
          warnings: parseInt(stats.warnings),
          info: parseInt(stats.info)
        };
      } catch (error) {
        console.error('Error getting admin log stats:', error);
        throw error;
      }
    },

    async getAdminLogFilters() {
      try {
        // Get unique admins
        const adminsResult = await pool.query(`
          SELECT DISTINCT "adminId", "adminName", "adminEmail"
          FROM admin_logs 
          WHERE "adminId" IS NOT NULL
          ORDER BY "adminName"
        `);

        // Get unique actions
        const actionsResult = await pool.query(`
          SELECT DISTINCT action
          FROM admin_logs 
          WHERE action IS NOT NULL
          ORDER BY action
        `);

        return {
          admins: adminsResult.rows,
          actions: actionsResult.rows.map(row => row.action)
        };
      } catch (error) {
        console.error('Error getting admin log filters:', error);
        throw error;
      }
    },

    async createAdminLog(logData) {
      try {
        const {
          adminId,
          adminName,
          adminEmail,
          action,
          actionType,
          targetType,
          targetId,
          severity = 'INFO',
          details,
          message,
          ipAddress
        } = logData;

        const result = await pool.query(`
          INSERT INTO admin_logs (
            id,
            action,
            "actionType",
            "adminId",
            "adminName",
            "adminEmail",
            "targetType",
            "targetId",
            severity,
            details,
            message,
            "ipAddress",
            "createdAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
          ) RETURNING *
        `, [
          randomUUID(),
          action,
          actionType,
          adminId,
          adminName,
          adminEmail,
          targetType,
          targetId,
          severity,
          details,
          message,
          ipAddress
        ]);

        console.log('✅ Admin log created:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating admin log:', error);
        throw error;
      }
    }
  },

  // Referral system operations
  referral: {
    async getUserReferralSummary(userId) {
      try {
        // Get user's referral code and basic info
        const userResult = await pool.query(`
          SELECT "referralCode", "referralEarnings", "referralLevel" 
          FROM users WHERE id = $1
        `, [userId]);
        
        if (userResult.rows.length === 0) {
          return null;
        }
        
        const user = userResult.rows[0];
        
        // Get total referrals count
        const referralsResult = await pool.query(`
          SELECT COUNT(*) as total_referrals
          FROM referrals 
          WHERE "referrerId" = $1 AND status = 'ACTIVE'
        `, [userId]);
        
        // Get total earnings from referral rewards
        const earningsResult = await pool.query(`
          SELECT COALESCE(SUM(amount), 0) as total_earnings
          FROM referral_rewards 
          WHERE "userId" = $1 AND status = 'PAID'
        `, [userId]);
        
        // Get referral tree (direct referrals)
        const treeResult = await pool.query(`
          SELECT r.id, r."referredId", r.level, r."createdAt",
                 u.name, u.email, u."referralCode"
          FROM referrals r
          JOIN users u ON r."referredId" = u.id
          WHERE r."referrerId" = $1 AND r.status = 'ACTIVE'
          ORDER BY r."createdAt" DESC
        `, [userId]);
        
        return {
          referralCode: user.referralCode,
          totalReferrals: parseInt(referralsResult.rows[0].total_referrals),
          totalEarnings: parseFloat(earningsResult.rows[0].total_earnings),
          referralLevel: user.referralLevel,
          referralTree: treeResult.rows
        };
      } catch (error) {
        console.error('Error getting user referral summary:', error);
        throw error;
      }
    },

    async getReferralChain(userId, maxLevel = 4) {
      try {
        const chain = [];
        let currentUserId = userId;
        let level = 0;
        
        while (level < maxLevel) {
          const result = await pool.query(`
            SELECT u.id, u.name, u.email, u."referralCode", u."referralLevel"
            FROM users u
            WHERE u.id = $1
          `, [currentUserId]);
          
          if (result.rows.length === 0) break;
          
          const user = result.rows[0];
          chain.push({
            level: level + 1,
            userId: user.id,
            name: user.name,
            email: user.email,
            referralCode: user.referralCode,
            referralLevel: user.referralLevel
          });
          
          // Get the referrer of current user
          const referrerResult = await pool.query(`
            SELECT "referrerId" FROM referrals 
            WHERE "referredId" = $1 AND status = 'ACTIVE'
          `, [currentUserId]);
          
          if (referrerResult.rows.length === 0) break;
          
          currentUserId = referrerResult.rows[0].referrerId;
          level++;
        }
        
        return chain;
      } catch (error) {
        console.error('Error getting referral chain:', error);
        throw error;
      }
    },

    async distributeReferralRewards(userId, amount, sourceType, sourceId) {
      try {
        const referralChain = await this.getReferralChain(userId, 4);
        const rewards = [];
        
        // Commission percentages for each level
        const commissionRates = [0.10, 0.05, 0.02, 0.01]; // 10%, 5%, 2%, 1%
        
        for (let i = 0; i < referralChain.length && i < 4; i++) {
          const referrer = referralChain[i];
          const commissionRate = commissionRates[i];
          const rewardAmount = amount * commissionRate;
          
          if (rewardAmount > 0) {
            // Create reward record
            const rewardId = randomUUID();
            await pool.query(`
              INSERT INTO referral_rewards (
                id, "userId", amount, percentage, "sourceType", "sourceId", 
                level, status, "createdAt", "updatedAt"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW())
            `, [rewardId, referrer.userId, rewardAmount, commissionRate * 100, sourceType, sourceId, i + 1]);
            
            // Update user's referral earnings
            await pool.query(`
              UPDATE users 
              SET "referralEarnings" = "referralEarnings" + $1, "updatedAt" = NOW()
              WHERE id = $2
            `, [rewardAmount, referrer.userId]);
            
            // Update user's wallet balance
            await pool.query(`
              UPDATE wallets 
              SET balance = balance + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
              WHERE "userId" = $2
            `, [rewardAmount, referrer.userId]);
            
            // Create transaction record for the reward
            await pool.query(`
              INSERT INTO transactions (
                id, "userId", type, amount, currency, status, description, 
                "createdAt", "updatedAt"
              ) VALUES ($1, $2, 'DEPOSIT', $3, 'USD', 'COMPLETED', 
                'Referral reward from ${sourceType.toLowerCase()}', NOW(), NOW())
            `, [randomUUID(), referrer.userId, rewardAmount]);
            
            rewards.push({
              userId: referrer.userId,
              amount: rewardAmount,
              percentage: commissionRate * 100,
              level: i + 1
            });
          }
        }
        
        return rewards;
      } catch (error) {
        console.error('Error distributing referral rewards:', error);
        throw error;
      }
    },

    async getReferralRewards(userId, limit = 20) {
      try {
        const result = await pool.query(`
          SELECT rr.*, u.name as "referrerName", u.email as "referrerEmail"
          FROM referral_rewards rr
          LEFT JOIN referrals r ON rr."referralId" = r.id
          LEFT JOIN users u ON r."referrerId" = u.id
          WHERE rr."userId" = $1
          ORDER BY rr."createdAt" DESC
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting referral rewards:', error);
        return [];
      }
    },

    async validateReferralCode(referralCode) {
      try {
        const result = await pool.query(`
          SELECT id, name, email, "referralCode" 
          FROM users 
          WHERE "referralCode" = $1 AND status = 'active'
        `, [referralCode]);
        
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error validating referral code:', error);
        return null;
      }
    }
  },

  // Market data helpers
  market: {
    async getCurrentPrice(symbol) {
      try {
        const result = await pool.query(`
          SELECT price FROM prices 
          WHERE symbol = $1 
          ORDER BY timestamp DESC 
          LIMIT 1
        `, [symbol]);
        
        return result.rows[0]?.price || null;
      } catch (error) {
        console.error('Error getting current price:', error);
        return null;
      }
    },

    async getPriceAtTime(symbol, timestamp) {
      try {
        const result = await pool.query(`
          SELECT price FROM prices 
          WHERE symbol = $1 AND timestamp <= $2
          ORDER BY timestamp DESC 
          LIMIT 1
        `, [symbol, timestamp]);
        
        return result.rows[0]?.price || null;
      } catch (error) {
        console.error('Error getting price at time:', error);
        return null;
      }
    },

    async get24hVolume(symbol) {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const result = await pool.query(`
          SELECT SUM(volume) as total_volume FROM prices 
          WHERE symbol = $1 AND timestamp >= $2
        `, [symbol, yesterday]);
        
        return result.rows[0]?.total_volume || 0;
      } catch (error) {
        console.error('Error getting 24h volume:', error);
        return 0;
      }
    },

    async get24hHigh(symbol) {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const result = await pool.query(`
          SELECT MAX(price) as high_price FROM prices 
          WHERE symbol = $1 AND timestamp >= $2
        `, [symbol, yesterday]);
        
        return result.rows[0]?.high_price || null;
      } catch (error) {
        console.error('Error getting 24h high:', error);
        return null;
      }
    },

    async get24hLow(symbol) {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const result = await pool.query(`
          SELECT MIN(price) as low_price FROM prices 
          WHERE symbol = $1 AND timestamp >= $2
        `, [symbol, yesterday]);
        
        return result.rows[0]?.low_price || null;
      } catch (error) {
        console.error('Error getting 24h low:', error);
        return null;
      }
    }
  },

  // Portfolio helpers
  portfolio: {
    async getUserPortfolio(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            id,
            "userId",
            "totalValue",
            "totalInvested",
            "totalProfit",
            "profitPercentage",
            "lastUpdated"
          FROM portfolios 
          WHERE "userId" = $1
        `, [userId]);
        
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user portfolio:', error);
        return null;
      }
    },

    async getPortfolioMetrics(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as trade_count,
            SUM(amount) as total_volume,
            SUM(fee) as total_fees,
            AVG(amount) as avg_trade_size
          FROM transactions 
          WHERE "userId" = $1 AND status = 'completed'
        `, [userId]);
        
        return result.rows[0] || {};
      } catch (error) {
        console.error('Error getting portfolio metrics:', error);
        return {};
      }
    }
  },

  // Investment helpers
  investment: {
    async getUserInvestments(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            id,
            "planName",
            amount,
            status,
            "expectedReturn",
            "actualReturn",
            "createdAt"
          FROM investments 
          WHERE "userId" = $1
          ORDER BY "createdAt" DESC
        `, [userId]);
        
        return result.rows || [];
      } catch (error) {
        console.error('Error getting user investments:', error);
        return [];
      }
    }
  },

  // Trade helpers
  trade: {
    async getUserRecentTrades(userId, limit = 5) {
      try {
        const result = await pool.query(`
          SELECT 
            id,
            price,
            amount,
            side,
            timestamp,
            "buyerId",
            "sellerId"
          FROM trades 
          WHERE "buyerId" = $1 OR "sellerId" = $1
          ORDER BY timestamp DESC
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows || [];
      } catch (error) {
        console.error('Error getting user recent trades:', error);
        return [];
      }
    }
  }
};

export default databaseHelpers;