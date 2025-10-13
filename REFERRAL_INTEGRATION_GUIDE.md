# Referral System Integration Guide

## Frontend Integration

### 1. Signup Page Integration

Update your signup page to handle referral codes from URL parameters:

```javascript
// In your signup page component
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [referrerInfo, setReferrerInfo] = useState(null);

  useEffect(() => {
    // Check for referral code in URL
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      validateReferralCode(ref);
    }
  }, [searchParams]);

  const validateReferralCode = async (code) => {
    try {
      const response = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code })
      });
      
      const data = await response.json();
      if (data.valid) {
        setReferrerInfo(data.data.referrer);
      } else {
        setReferralCode(''); // Clear invalid code
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
    }
  };

  const handleSignup = async (userData) => {
    try {
      // Include referral code in signup data
      const signupData = {
        ...userData,
        referralCode: referralCode || null
      };

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      const result = await response.json();
      
      if (result.success && referralCode) {
        // Register the referral
        await fetch('/api/referrals/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.user.id,
            referralCode: referralCode
          })
        });
      }

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  return (
    <div>
      {/* Your signup form */}
      {referralCode && referrerInfo && (
        <div className="referral-notice">
          <p>You were referred by {referrerInfo.name}!</p>
          <p>You'll both earn rewards when you start trading.</p>
        </div>
      )}
    </div>
  );
}
```

### 2. User Dashboard Integration

Add referral section to user dashboard:

```javascript
// Referral dashboard component
import { useState, useEffect } from 'react';

export default function ReferralDashboard({ userId }) {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch(`/api/referrals/${userId}`);
      const data = await response.json();
      setReferralData(data.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading referral data...</div>;
  if (!referralData) return <div>No referral data found</div>;

  return (
    <div className="referral-dashboard">
      <h2>Referral Program</h2>
      
      <div className="referral-stats">
        <div className="stat">
          <h3>Your Referral Code</h3>
          <p className="referral-code">{referralData.referralCode}</p>
          <button onClick={() => copyReferralLink()}>
            Copy Referral Link
          </button>
        </div>
        
        <div className="stat">
          <h3>Total Referrals</h3>
          <p className="number">{referralData.totalReferrals}</p>
        </div>
        
        <div className="stat">
          <h3>Total Earnings</h3>
          <p className="number">${referralData.totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="referral-tree">
        <h3>Your Referrals</h3>
        {referralData.referralTree.map((referral) => (
          <div key={referral.id} className="referral-item">
            <p>{referral.name} ({referral.email})</p>
            <p>Joined: {new Date(referral.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      <div className="recent-rewards">
        <h3>Recent Rewards</h3>
        {referralData.recentRewards.map((reward) => (
          <div key={reward.id} className="reward-item">
            <p>${reward.amount.toFixed(2)} from {reward.sourceType}</p>
            <p>Level {reward.level} ({reward.percentage}%)</p>
          </div>
        ))}
      </div>
    </div>
  );

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData.referralUrl);
    // Show success message
  };
}
```

### 3. Transaction Integration

Update your transaction processing to trigger referral rewards:

```javascript
// In your transaction processing code
import databaseHelpers from '../lib/database';

export async function processDeposit(userId, amount, transactionId) {
  try {
    // Process the deposit
    const result = await databaseHelpers.wallet.updateBalance(userId, amount);
    
    // Trigger referral rewards
    await fetch('/api/referrals/reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        amount: amount,
        sourceType: 'DEPOSIT',
        sourceId: transactionId
      })
    });

    return result;
  } catch (error) {
    console.error('Error processing deposit:', error);
    throw error;
  }
}

export async function processTrade(userId, tradeAmount, tradeId) {
  try {
    // Process the trade
    const result = await processTradeLogic(userId, tradeAmount);
    
    // Trigger referral rewards
    await fetch('/api/referrals/reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        amount: tradeAmount,
        sourceType: 'TRADE',
        sourceId: tradeId
      })
    });

    return result;
  } catch (error) {
    console.error('Error processing trade:', error);
    throw error;
  }
}
```

## Database Migration

Run the following SQL to add referral fields to existing users:

```sql
-- Add referral fields to users table
ALTER TABLE users 
ADD COLUMN "referralCode" VARCHAR UNIQUE,
ADD COLUMN "referredBy" VARCHAR,
ADD COLUMN "referralLevel" INTEGER DEFAULT 0,
ADD COLUMN "referralEarnings" DECIMAL DEFAULT 0;

-- Create referrals table
CREATE TABLE referrals (
  id VARCHAR PRIMARY KEY,
  "referrerId" VARCHAR NOT NULL,
  "referredId" VARCHAR NOT NULL,
  "referralCode" VARCHAR NOT NULL,
  level INTEGER NOT NULL,
  status VARCHAR DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  UNIQUE("referrerId", "referredId"),
  FOREIGN KEY ("referrerId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("referredId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create referral_rewards table
CREATE TABLE referral_rewards (
  id VARCHAR PRIMARY KEY,
  "userId" VARCHAR NOT NULL,
  "referralId" VARCHAR,
  amount DECIMAL NOT NULL,
  percentage DECIMAL NOT NULL,
  "sourceType" VARCHAR NOT NULL,
  "sourceId" VARCHAR,
  level INTEGER NOT NULL,
  status VARCHAR DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("referralId") REFERENCES referrals(id) ON DELETE SET NULL
);

-- Generate referral codes for existing users
UPDATE users 
SET "referralCode" = 'BNX' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE "referralCode" IS NULL;
```

## Testing

### Test Referral Flow

1. **Create test users:**
```javascript
// Test user 1 (referrer)
const referrer = await databaseHelpers.user.createUser({
  email: 'referrer@test.com',
  password: 'password123',
  name: 'Test Referrer'
});

// Test user 2 (referred)
const referred = await databaseHelpers.user.createUser({
  email: 'referred@test.com',
  password: 'password123',
  name: 'Test Referred',
  referredBy: referrer.referralCode
});
```

2. **Test reward distribution:**
```javascript
// Simulate a deposit by the referred user
const response = await fetch('/api/referrals/reward', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: referred.id,
    amount: 1000,
    sourceType: 'DEPOSIT',
    sourceId: 'test_transaction_123'
  })
});

const result = await response.json();
console.log('Rewards distributed:', result.data.rewards);
```

## Environment Variables

Add these to your `.env.local`:

```env
# Referral system configuration
REFERRAL_COMMISSION_LEVEL_1=10
REFERRAL_COMMISSION_LEVEL_2=5
REFERRAL_COMMISSION_LEVEL_3=2
REFERRAL_COMMISSION_LEVEL_4=1
REFERRAL_MAX_LEVELS=4
```

## Monitoring

Set up monitoring for:
- Referral registration success rate
- Reward distribution success rate
- Average referral earnings per user
- Referral conversion rates
- System performance metrics

## Security Checklist

- [ ] Validate all referral codes before use
- [ ] Prevent users from referring themselves
- [ ] Implement rate limiting on referral endpoints
- [ ] Validate all amounts before processing
- [ ] Log all referral activities for audit
- [ ] Implement proper error handling
- [ ] Test edge cases (invalid codes, network failures)
- [ ] Monitor for abuse patterns
