const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const feeStructures = [
  {
    name: 'Standard Trading Fees',
    description: 'Default fee structure for all trading pairs',
    makerFee: 0.001, // 0.1%
    takerFee: 0.001, // 0.1%
    withdrawalFees: {
      'BTC': 0.0005,
      'ETH': 0.01,
      'USDT': 1.0,
      'BNX': 0.1,
      'USD': 1.0
    },
    depositFees: {
      'BTC': 0.0,
      'ETH': 0.0,
      'USDT': 0.0,
      'BNX': 0.0,
      'USD': 0.0
    },
    minTradingFee: 0.0001,
    minWithdrawalFee: 0.0001,
    maxTradingFee: 0.01, // 1% max
    maxWithdrawalFee: 10.0,
    isDefault: true,
    isActive: true
  },
  {
    name: 'VIP Trading Fees',
    description: 'Reduced fees for VIP users',
    makerFee: 0.0005, // 0.05%
    takerFee: 0.0008, // 0.08%
    withdrawalFees: {
      'BTC': 0.0003,
      'ETH': 0.005,
      'USDT': 0.5,
      'BNX': 0.05,
      'USD': 0.5
    },
    depositFees: {
      'BTC': 0.0,
      'ETH': 0.0,
      'USDT': 0.0,
      'BNX': 0.0,
      'USD': 0.0
    },
    minTradingFee: 0.00005,
    minWithdrawalFee: 0.00005,
    maxTradingFee: 0.005, // 0.5% max
    maxWithdrawalFee: 5.0,
    isDefault: false,
    isActive: true
  },
  {
    name: 'High Volume Fees',
    description: 'Special fees for high volume traders',
    makerFee: 0.0002, // 0.02%
    takerFee: 0.0005, // 0.05%
    withdrawalFees: {
      'BTC': 0.0001,
      'ETH': 0.002,
      'USDT': 0.1,
      'BNX': 0.01,
      'USD': 0.1
    },
    depositFees: {
      'BTC': 0.0,
      'ETH': 0.0,
      'USDT': 0.0,
      'BNX': 0.0,
      'USD': 0.0
    },
    minTradingFee: 0.00001,
    minWithdrawalFee: 0.00001,
    maxTradingFee: 0.002, // 0.2% max
    maxWithdrawalFee: 2.0,
    isDefault: false,
    isActive: true
  }
];

async function seedFeeStructures() {
  try {
    console.log('🌱 Seeding fee structures...');

    // Create fee structures
    for (const feeStructure of feeStructures) {
      try {
        const createdFeeStructure = await prisma.feeStructure.upsert({
          where: { name: feeStructure.name },
          update: feeStructure,
          create: feeStructure
        });
        console.log(`✅ Upserted fee structure: ${createdFeeStructure.name}`);
      } catch (error) {
        console.error(`❌ Error upserting fee structure ${feeStructure.name}:`, error);
      }
    }

    // Assign default fee structure to existing trading pairs
    const defaultFeeStructure = await prisma.feeStructure.findFirst({
      where: { isDefault: true }
    });

    if (defaultFeeStructure) {
      const tradingPairs = await prisma.tradingPair.findMany({
        where: { feeStructureId: null }
      });

      for (const pair of tradingPairs) {
        await prisma.tradingPair.update({
          where: { id: pair.id },
          data: { feeStructureId: defaultFeeStructure.id }
        });
        console.log(`✅ Assigned default fee structure to trading pair: ${pair.symbol}`);
      }
    }

    console.log('✅ Fee structures seeding completed');

  } catch (error) {
    console.error('❌ Error seeding fee structures:', error);
    throw error;
  }
}

// Run the seed function
if (require.main === module) {
  seedFeeStructures()
    .then(async () => {
      console.log('✅ Fee structures seeding completed');
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ Fee structures seeding failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedFeeStructures };


