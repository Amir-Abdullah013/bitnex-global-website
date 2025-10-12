const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const priceData = [
  { symbol: 'BNX', price: 0.0035, volume: 150000, marketCap: 350000 },
  { symbol: 'BTC', price: 45000, volume: 50000000, marketCap: 850000000000 },
  { symbol: 'ETH', price: 3200, volume: 30000000, marketCap: 385000000000 },
  { symbol: 'BNB', price: 320, volume: 10000000, marketCap: 50000000000 },
  { symbol: 'ADA', price: 0.45, volume: 5000000, marketCap: 15000000000 },
  { symbol: 'SOL', price: 95, volume: 15000000, marketCap: 40000000000 }
];

async function seedPriceData() {
  try {
    console.log('🌱 Seeding price data...');

    for (const data of priceData) {
      // Create price entry
      await prisma.price.create({
        data: {
          symbol: data.symbol,
          price: data.price,
          volume: data.volume,
          marketCap: data.marketCap,
          timestamp: new Date(),
          source: 'seed'
        }
      });
      console.log(`✅ Created price data for: ${data.symbol}`);
    }

    console.log('🎉 Price data seeded successfully!');
    
    // Display summary
    const totalPrices = await prisma.price.count();
    console.log(`📊 Total price entries: ${totalPrices}`);

  } catch (error) {
    console.error('❌ Error seeding price data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedPriceData()
    .then(() => {
      console.log('✅ Price data seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Price data seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPriceData };

