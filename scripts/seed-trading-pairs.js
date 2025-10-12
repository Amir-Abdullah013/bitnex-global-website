const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const tradingPairs = [
  {
    symbol: 'BNX/USDT',
    baseAsset: 'BNX',
    quoteAsset: 'USDT',
    minOrderSize: 0.001,
    maxOrderSize: 1000000,
    pricePrecision: 4,
    amountPrecision: 4,
    makerFee: 0.001,
    takerFee: 0.001
  },
  {
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    minOrderSize: 0.00001,
    maxOrderSize: 100,
    pricePrecision: 2,
    amountPrecision: 5,
    makerFee: 0.001,
    takerFee: 0.001
  },
  {
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    minOrderSize: 0.0001,
    maxOrderSize: 10000,
    pricePrecision: 2,
    amountPrecision: 4,
    makerFee: 0.001,
    takerFee: 0.001
  },
  {
    symbol: 'BNB/USDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    minOrderSize: 0.001,
    maxOrderSize: 100000,
    pricePrecision: 2,
    amountPrecision: 3,
    makerFee: 0.001,
    takerFee: 0.001
  },
  {
    symbol: 'ADA/USDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    minOrderSize: 1,
    maxOrderSize: 10000000,
    pricePrecision: 4,
    amountPrecision: 0,
    makerFee: 0.001,
    takerFee: 0.001
  },
  {
    symbol: 'SOL/USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    minOrderSize: 0.01,
    maxOrderSize: 100000,
    pricePrecision: 2,
    amountPrecision: 2,
    makerFee: 0.001,
    takerFee: 0.001
  }
];

const marketData = [
  {
    symbol: 'BNX/USDT',
    price: 0.0035,
    volume24h: 150000,
    change24h: 2.5,
    high24h: 0.0036,
    low24h: 0.0034
  },
  {
    symbol: 'BTC/USDT',
    price: 45000,
    volume24h: 50000000,
    change24h: 1.2,
    high24h: 45500,
    low24h: 44500
  },
  {
    symbol: 'ETH/USDT',
    price: 3200,
    volume24h: 30000000,
    change24h: -0.8,
    high24h: 3250,
    low24h: 3180
  },
  {
    symbol: 'BNB/USDT',
    price: 320,
    volume24h: 10000000,
    change24h: 0.5,
    high24h: 325,
    low24h: 318
  },
  {
    symbol: 'ADA/USDT',
    price: 0.45,
    volume24h: 5000000,
    change24h: 3.2,
    high24h: 0.47,
    low24h: 0.43
  },
  {
    symbol: 'SOL/USDT',
    price: 95,
    volume24h: 15000000,
    change24h: -1.5,
    high24h: 98,
    low24h: 94
  }
];

async function seedTradingPairs() {
  try {
    console.log('🌱 Seeding trading pairs...');

    // Create trading pairs using upsert
    for (const pair of tradingPairs) {
      try {
        const createdPair = await prisma.tradingPair.upsert({
          where: { symbol: pair.symbol },
          update: pair,
          create: pair
        });
        console.log(`✅ Upserted trading pair: ${createdPair.symbol}`);
      } catch (error) {
        console.error(`❌ Error upserting trading pair ${pair.symbol}:`, error);
      }
    }

    // Create market data for each pair
    for (const data of marketData) {
      const pair = await prisma.tradingPair.findUnique({
        where: { symbol: data.symbol }
      });

      if (pair) {
        // Check if market data already exists
        const existingData = await prisma.marketData.findFirst({
          where: { tradingPairId: pair.id }
        });

        if (!existingData) {
          await prisma.marketData.create({
            data: {
              tradingPairId: pair.id,
              price: data.price,
              volume24h: data.volume24h,
              change24h: data.change24h,
              high24h: data.high24h,
              low24h: data.low24h
            }
          });
          console.log(`✅ Created market data for: ${data.symbol}`);
        } else {
          console.log(`⚠️  Market data already exists for: ${data.symbol}`);
        }
      }
    }

    console.log('🎉 Trading pairs seeded successfully!');
    
    // Display summary
    const totalPairs = await prisma.tradingPair.count();
    const activePairs = await prisma.tradingPair.count({
      where: { isActive: true }
    });
    
    console.log(`📊 Summary:`);
    console.log(`   Total trading pairs: ${totalPairs}`);
    console.log(`   Active trading pairs: ${activePairs}`);

  } catch (error) {
    console.error('❌ Error seeding trading pairs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedTradingPairs()
    .then(async () => {
      console.log('✅ Trading pairs seeding completed');
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ Trading pairs seeding failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedTradingPairs };
