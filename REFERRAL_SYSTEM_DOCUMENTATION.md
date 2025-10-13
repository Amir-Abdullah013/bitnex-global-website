# Bitnex Global Referral System Documentation

## Overview
The referral system allows users to refer others and earn commissions based on a tiered structure. When a referred user performs profitable actions (deposits, trades, investments, staking), commissions are distributed up the referral chain.

## Database Schema

### Updated User Model
```sql
-- New fields added to users table
referralCode     String?  UNIQUE  -- User's unique referral code (e.g., BNX123)
referredBy       String?          -- Referral code of the user who referred this user
referralLevel    Int?     DEFAULT(0) -- Level in referral hierarchy
referralEarnings Float   DEFAULT(0) -- Total earnings from referrals
```

### New Tables

#### Referrals Table
```sql
CREATE TABLE referrals (
  id            VARCHAR PRIMARY KEY,
  referrerId    VARCHAR NOT NULL,  -- User who made the referral
  referredId    VARCHAR NOT NULL,  -- User who was referred
  referralCode  VARCHAR NOT NULL, -- Referral code used
  level         INTEGER NOT NULL,  -- Level in hierarchy (1 = direct, 2 = indirect, etc.)
  status        VARCHAR DEFAULT 'ACTIVE',
  createdAt     TIMESTAMP DEFAULT NOW(),
  updatedAt     TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(referrerId, referredId),
  FOREIGN KEY (referrerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referredId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Referral Rewards Table
```sql
CREATE TABLE referral_rewards (
  id            VARCHAR PRIMARY KEY,
  userId        VARCHAR NOT NULL,  -- User who earned the reward
  referralId    VARCHAR,           -- Associated referral
  amount        DECIMAL NOT NULL,  -- Reward amount
  percentage    DECIMAL NOT NULL,  -- Commission percentage applied
  sourceType    VARCHAR NOT NULL,  -- What action triggered the reward
  sourceId      VARCHAR,           -- ID of the source transaction/action
  level         INTEGER NOT NULL,  -- Level in referral chain (1-4)
  status        VARCHAR DEFAULT 'PENDING',
  createdAt     TIMESTAMP DEFAULT NOW(),
  updatedAt     TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referralId) REFERENCES referrals(id) ON DELETE SET NULL
);
```

## API Endpoints

### 1. Register Referral
**POST** `/api/referrals/register`

Registers a referral when a new user signs up using someone's code.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "referralCode": "BNX123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral registered successfully",
  "data": {
    "referralId": "referral_id",
    "referrer": {
      "id": "referrer_id",
      "name": "Referrer Name",
      "email": "referrer@example.com",
      "referralCode": "BNX123"
    },
    "referredUser": {
      "id": "user_id",
      "referralLevel": 1
    }
  }
}
```

### 2. Get User Referral Summary
**GET** `/api/referrals/:userId`

Returns the user's referral summary including total referred users, earnings, and referral tree.

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "BNX456",
    "totalReferrals": 5,
    "totalEarnings": 125.50,
    "referralLevel": 2,
    "referralTree": [
      {
        "id": "referral_id",
        "referredId": "referred_user_id",
        "level": 1,
        "createdAt": "2024-01-15T10:30:00Z",
        "name": "Referred User Name",
        "email": "referred@example.com",
        "referralCode": "BNX789"
      }
    ],
    "recentRewards": [
      {
        "id": "reward_id",
        "amount": 25.00,
        "percentage": 10.0,
        "sourceType": "DEPOSIT",
        "level": 1,
        "status": "PAID",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "referralUrl": "https://bitnex-global.com/signup?ref=BNX456"
  }
}
```

### 3. Distribute Referral Rewards
**POST** `/api/referrals/reward`

Triggered when a referred user performs a profitable action.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "amount": 1000.00,
  "sourceType": "DEPOSIT",
  "sourceId": "transaction_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral rewards distributed successfully",
  "data": {
    "userId": "user_id",
    "amount": 1000.00,
    "sourceType": "DEPOSIT",
    "sourceId": "transaction_id",
    "rewardsDistributed": 3,
    "totalRewardsAmount": 170.00,
    "rewards": [
      {
        "userId": "referrer_1_id",
        "amount": 100.00,
        "percentage": 10.0,
        "level": 1
      },
      {
        "userId": "referrer_2_id",
        "amount": 50.00,
        "percentage": 5.0,
        "level": 2
      },
      {
        "userId": "referrer_3_id",
        "amount": 20.00,
        "percentage": 2.0,
        "level": 3
      }
    ]
  }
}
```

### 4. Validate Referral Code
**POST** `/api/referrals/validate`

Validates a referral code.

**Request Body:**
```json
{
  "referralCode": "BNX123"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "message": "Valid referral code",
  "data": {
    "referrer": {
      "id": "referrer_id",
      "name": "Referrer Name",
      "email": "referrer@example.com",
      "referralCode": "BNX123"
    }
  }
}
```

## Commission Logic

### Tiered Commission Structure
- **Level 1 (Direct referrer)**: 10%
- **Level 2 (Referrer of the referrer)**: 5%
- **Level 3**: 2%
- **Level 4+**: 1%

### Reward Distribution Flow
1. User performs profitable action (deposit, trade, investment, staking)
2. System identifies referral chain (up to 4 levels)
3. Commissions are calculated and distributed:
   - Level 1: 10% of transaction amount
   - Level 2: 5% of transaction amount
   - Level 3: 2% of transaction amount
   - Level 4: 1% of transaction amount
4. Rewards are added to referrers' wallets
5. Transaction records are created for each reward
6. Referral earnings are updated

## Integration Points

### User Registration
When a new user signs up with a referral code:
1. Validate referral code exists
2. Create user with referral information
3. Create referral record
4. Set referral level based on referrer's level

### Transaction Processing
When a referred user performs a profitable action:
1. Check if user has a referrer
2. Get referral chain (up to 4 levels)
3. Calculate and distribute rewards
4. Update user wallets and earnings
5. Create transaction records

### Supported Source Types
- `DEPOSIT`: User makes a deposit
- `TRADE`: User executes a trade
- `INVESTMENT`: User makes an investment
- `STAKING`: User stakes tokens

## Security Considerations

1. **Referral Code Validation**: All referral codes are validated before use
2. **Duplicate Prevention**: Users can only have one referrer
3. **Level Limitation**: Commission distribution is capped at 4 levels
4. **Amount Validation**: All amounts are validated before processing
5. **Status Tracking**: All rewards have status tracking (PENDING, PAID, CANCELLED)

## Error Handling

The system handles various error scenarios:
- Invalid referral codes
- Users without referrers
- Invalid amounts
- Database connection issues
- Duplicate referral attempts

## Performance Considerations

1. **Database Indexing**: Proper indexes on referral-related fields
2. **Batch Processing**: Rewards are processed in batches when possible
3. **Caching**: Referral summaries can be cached for better performance
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Monitoring and Analytics

The system tracks:
- Total referrals per user
- Total earnings from referrals
- Referral conversion rates
- Commission distribution statistics
- Reward processing times

## Future Enhancements

Potential improvements:
1. **Dynamic Commission Rates**: Configurable commission percentages
2. **Referral Bonuses**: Special bonuses for milestone achievements
3. **Referral Contests**: Periodic contests with additional rewards
4. **Advanced Analytics**: Detailed referral performance metrics
5. **Multi-level Marketing**: Support for more complex referral structures
